import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { reviewNote } = await req.json()

  if (!reviewNote?.trim()) {
    return NextResponse.json(
      { error: "Ghi chú là bắt buộc khi từ chối" },
      { status: 400 }
    )
  }

  const cert = await prisma.certification.findUnique({
    where: { id },
    include: {
      applicant: { select: { email: true, name: true } },
      product: { select: { name: true } },
    },
  })

  if (!cert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (cert.status !== "PENDING" && cert.status !== "UNDER_REVIEW") {
    return NextResponse.json(
      { error: "Không thể từ chối đơn này" },
      { status: 400 }
    )
  }

  const now = new Date()

  await prisma.certification.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewNote,
      reviewedBy: session.user.id,
      reviewedAt: now,
      rejectedAt: now,
    },
  })

  await prisma.product.update({
    where: { id: cert.productId },
    data: { certStatus: "REJECTED" },
  })

  try {
    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: cert.applicant.email,
      subject: "Thông báo kết quả xét duyệt chứng nhận sản phẩm",
      html: `
        <h2>Kính gửi ${cert.applicant.name},</h2>
        <p>Chúng tôi rất tiếc phải thông báo rằng đơn chứng nhận sản phẩm <strong>${cert.product.name}</strong> của bạn chưa được phê duyệt.</p>
        <p><strong>Lý do:</strong> ${reviewNote}</p>
        <p>Phí chứng nhận sẽ được hoàn trả về tài khoản ngân hàng bạn đã đăng ký trong vòng 5–7 ngày làm việc.</p>
        <p>Nếu có thắc mắc, vui lòng liên hệ Ban Quản trị Hội.</p>
        <p>Trân trọng,<br/>Hội Trầm Hương Việt Nam</p>
      `,
    })
  } catch (e) {
    console.error("Email send failed:", e)
  }

  return NextResponse.json({ success: true })
}
