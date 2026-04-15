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
  const body = await req.json().catch(() => ({}))
  const reason = (body.reason as string)?.trim()

  if (!reason) {
    return NextResponse.json({ error: "Vui lòng nhập lý do từ chối" }, { status: 400 })
  }

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      type: true,
      amount: true,
      status: true,
      membershipId: true,
      certificationId: true,
      description: true,
      user: {
        select: {
          name: true,
          email: true,
          bankName: true,
          bankAccountNumber: true,
          bankAccountName: true,
        },
      },
    },
  })
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "Thanh toán này đã được xử lý" }, { status: 400 })
  }

  // Update payment + related records
  await prisma.payment.update({
    where: { id },
    data: { status: "FAILED", failureReason: reason },
  })

  if (payment.membershipId) {
    await prisma.membership.update({
      where: { id: payment.membershipId },
      data: { status: "EXPIRED" },
    })
  }
  if (payment.certificationId) {
    await prisma.certification.update({
      where: { id: payment.certificationId },
      data: { status: "REJECTED" },
    })
  }

  // Email VIP with rejection reason
  try {
    const typeLabel = payment.type === "MEMBERSHIP_FEE" ? "phí hội viên" : payment.type === "CERTIFICATION_FEE" ? "phí chứng nhận" : "thanh toán"

    let bankRefundInfo = ""
    if (payment.type === "CERTIFICATION_FEE" && payment.user.bankName) {
      bankRefundInfo = `<p style="margin-top:12px;padding:12px;background:#f0f9ff;border-radius:8px;font-size:13px;">Thông tin hoàn tiền: ${payment.user.bankName} - ${payment.user.bankAccountNumber} - ${payment.user.bankAccountName}</p>`
    }

    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: payment.user.email,
      subject: `Chuyển khoản ${typeLabel} bị từ chối - Hội Trầm Hương Việt Nam`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2>Xin chào ${payment.user.name},</h2>
          <p>Chuyển khoản <strong>${payment.amount.toLocaleString("vi-VN")}đ</strong> ${typeLabel} của bạn đã bị từ chối.</p>
          <p><strong>Lý do:</strong> ${reason}</p>
          <p>Nếu bạn đã chuyển khoản, vui lòng kiểm tra lại nội dung chuyển khoản và thực hiện lại tại trang Gia hạn.</p>
          ${bankRefundInfo}
          <p style="color:#888;font-size:12px;margin-top:24px;">Nếu cần hỗ trợ, vui lòng liên hệ ban quản trị.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send rejection email:", err)
  }

  return NextResponse.json({ success: true })
}
