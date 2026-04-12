import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

// PATCH — Admin duyệt hoặc từ chối đơn kết nạp
// Body: { action: "APPROVE" | "REJECT", rejectReason?: string, finalCategory?: MemberCategory }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const action = body.action as "APPROVE" | "REJECT" | undefined

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, accountType: true } },
    },
  })
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (application.status !== "PENDING") {
    return NextResponse.json(
      { error: "Đơn này đã được xử lý" },
      { status: 400 },
    )
  }

  const now = new Date()

  if (action === "REJECT") {
    const rejectReason = (body.rejectReason as string)?.trim()
    if (!rejectReason) {
      return NextResponse.json(
        { error: "Vui lòng nhập lý do từ chối" },
        { status: 400 },
      )
    }

    await prisma.membershipApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: now,
        reviewedById: session.user.id,
        rejectReason,
      },
    })

    // Email applicant
    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: application.user.email,
        subject: "Đơn kết nạp Hội viên bị từ chối",
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Xin chào ${application.user.name},</h2>
            <p>Đơn xin kết nạp Hội viên chính thức của bạn đã được Ban Thường vụ xem xét và <strong>chưa được thông qua</strong>.</p>
            <p><strong>Lý do:</strong> ${rejectReason}</p>
            <p>Bạn có thể bổ sung hồ sơ và nộp lại đơn tại trang <a href="https://hoitramhuong.vn/ket-nap">Kết nạp Hội viên</a>.</p>
            <p style="color:#888;font-size:12px;margin-top:24px;">Trân trọng,<br/>Hội Trầm Hương Việt Nam (VAWA)</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send rejection email:", err)
    }

    return NextResponse.json({ success: true })
  }

  // APPROVE
  const finalCategory =
    body.finalCategory === "AFFILIATE" || body.finalCategory === "HONORARY"
      ? body.finalCategory
      : application.requestedCategory

  await prisma.$transaction([
    prisma.membershipApplication.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: now,
        reviewedById: session.user.id,
      },
    }),
    prisma.user.update({
      where: { id: application.userId },
      data: {
        memberCategory: finalCategory,
        isActive: true,
      },
    }),
  ])

  // Email applicant
  try {
    const categoryLabel =
      finalCategory === "OFFICIAL"
        ? "Chính thức"
        : finalCategory === "AFFILIATE"
          ? "Liên kết"
          : "Danh dự"

    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: application.user.email,
      subject: "Quyết định công nhận Hội viên - Hội Trầm Hương Việt Nam",
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>Xin chào ${application.user.name},</h2>
          <p>Chúng tôi vui mừng thông báo: đơn xin kết nạp của bạn đã được Chủ tịch Hội <strong>phê duyệt</strong>.</p>
          <p>Bạn được công nhận là <strong>Hội viên ${categoryLabel}</strong> của Hội Trầm Hương Việt Nam (VAWA).</p>
          <p>Xem quyền và nghĩa vụ Hội viên tại <a href="https://hoitramhuong.vn/dieu-le">Điều lệ Hội</a>.</p>
          <p style="color:#888;font-size:12px;margin-top:24px;">Trân trọng,<br/>Ban Quản trị Hội Trầm Hương Việt Nam</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send approval email:", err)
  }

  return NextResponse.json({ success: true })
}
