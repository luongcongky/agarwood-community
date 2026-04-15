import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { reviewNote } = await req.json()

  const cert = await prisma.certification.findUnique({
    where: { id },
    include: {
      applicant: { select: { email: true, name: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  })

  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (cert.status !== "PENDING" && cert.status !== "UNDER_REVIEW") {
    return NextResponse.json({ error: "Không thể duyệt đơn này" }, { status: 400 })
  }

  const now = new Date()

  // Generate cert code: HTHVN-{YEAR}-{4-digit sequence}
  const year = now.getFullYear()
  const approvedCount = await prisma.certification.count({
    where: { status: "APPROVED", approvedAt: { gte: new Date(`${year}-01-01`) } },
  })
  const certCode = `HTHVN-${year}-${String(approvedCount + 1).padStart(4, "0")}`

  // All updates in a single transaction
  await prisma.$transaction([
    prisma.certification.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewNote: reviewNote || null,
        reviewedBy: session.user.id,
        reviewedAt: now,
        approvedAt: now,
      },
    }),
    prisma.product.update({
      where: { id: cert.productId },
      data: {
        certStatus: "APPROVED",
        certApprovedAt: now,
        // Badge URL can be a Cloudinary overlay or static asset
        badgeUrl: `/badge-chung-nhan.png`,
      },
    }),
  ])

  // Email VIP with congratulations
  try {
    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: cert.applicant.email,
      subject: "Chúc mừng! Sản phẩm của bạn đã được chứng nhận — Hội Trầm Hương Việt Nam",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Chúc mừng ${cert.applicant.name}!</h2>
          <p>Sản phẩm <strong>${cert.product.name}</strong> đã được Hội Trầm Hương Việt Nam cấp chứng nhận.</p>
          <p><strong>Mã chứng nhận:</strong> ${certCode}</p>
          ${reviewNote ? `<p><strong>Ghi chú:</strong> ${reviewNote}</p>` : ""}
          <p>Badge chứng nhận đã được hiển thị trên trang sản phẩm của bạn.</p>
          <p>Trang xác minh: <a href="${process.env.NEXTAUTH_URL}/verify/${cert.product.slug}">${process.env.NEXTAUTH_URL}/verify/${cert.product.slug}</a></p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#888;font-size:12px;">Hội Trầm Hương Việt Nam</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send approval email:", err)
  }

  return NextResponse.json({ success: true, certCode })
}
