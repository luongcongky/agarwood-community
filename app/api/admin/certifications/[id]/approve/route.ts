import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { reviewNote } = await req.json()

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
      { error: "Không thể duyệt đơn này" },
      { status: 400 }
    )
  }

  const now = new Date()

  await prisma.certification.update({
    where: { id },
    data: {
      status: "APPROVED",
      reviewNote,
      reviewedBy: session.user.id,
      reviewedAt: now,
      approvedAt: now,
    },
  })

  await prisma.product.update({
    where: { id: cert.productId },
    data: { certStatus: "APPROVED", certApprovedAt: now },
  })

  try {
    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: cert.applicant.email,
      subject: "Chúc mừng! Sản phẩm của bạn đã được chứng nhận",
      html: `
        <h2>Chúc mừng ${cert.applicant.name}!</h2>
        <p>Sản phẩm <strong>${cert.product.name}</strong> đã được Hội Trầm Hương Việt Nam cấp chứng nhận.</p>
        ${reviewNote ? `<p><strong>Ghi chú:</strong> ${reviewNote}</p>` : ""}
        <p>Huy hiệu chứng nhận sẽ được hiển thị trên trang sản phẩm của bạn trong vòng 24 giờ.</p>
        <p>Hội Trầm Hương Việt Nam</p>
      `,
    })
  } catch (e) {
    console.error("Email send failed:", e)
  }

  return NextResponse.json({ success: true })
}
