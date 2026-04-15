import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

const STATUS_EMAIL: Record<string, { subject: string; body: (name: string) => string }> = {
  CONFIRMED: {
    subject: "Đơn dịch vụ đã được xác nhận",
    body: (name) => `Xin chào ${name}, đơn dịch vụ truyền thông của bạn đã được xác nhận. Chúng tôi sẽ sớm liên hệ để trao đổi chi tiết.`,
  },
  IN_PROGRESS: {
    subject: "Chúng tôi đang thực hiện yêu cầu của bạn",
    body: (name) => `Xin chào ${name}, đội ngũ của chúng tôi đang thực hiện yêu cầu truyền thông của bạn. Chúng tôi sẽ cập nhật khi hoàn thành.`,
  },
  DELIVERED: {
    subject: "Bài viết đã hoàn thành — vui lòng xem và phản hồi",
    body: (name) => `Xin chào ${name}, bài viết đã được hoàn thành và bàn giao. Vui lòng xem và phản hồi nếu cần chỉnh sửa.`,
  },
  COMPLETED: {
    subject: "Cảm ơn bạn đã sử dụng dịch vụ",
    body: (name) => `Xin chào ${name}, đơn dịch vụ truyền thông của bạn đã hoàn tất. Cảm ơn bạn đã tin tưởng Hội Trầm Hương Việt Nam!`,
  },
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const data = await req.json()
  const { status, assignedTo, quotedPrice, internalNote, deliveryFileUrls, cancelReason } = data

  // Get current order for email
  const order = await prisma.mediaOrder.findUnique({
    where: { id },
    select: { requesterName: true, requesterEmail: true, status: true },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {}
  if (status !== undefined) updateData.status = status
  if (assignedTo !== undefined) updateData.assignedTo = assignedTo
  if (quotedPrice !== undefined) updateData.quotedPrice = quotedPrice
  if (internalNote !== undefined) updateData.internalNote = internalNote
  if (deliveryFileUrls !== undefined) updateData.deliveryFileUrls = deliveryFileUrls
  if (cancelReason !== undefined) updateData.cancelReason = cancelReason

  if (status === "DELIVERED") updateData.deliveredAt = new Date()
  else if (status === "COMPLETED") updateData.completedAt = new Date()

  await prisma.mediaOrder.update({ where: { id }, data: updateData })

  // Send email on status change
  if (status && status !== order.status && STATUS_EMAIL[status]) {
    const emailConfig = STATUS_EMAIL[status]
    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: order.requesterEmail,
        subject: `${emailConfig.subject} — Hội Trầm Hương Việt Nam`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <p>${emailConfig.body(order.requesterName)}</p>
            ${quotedPrice ? `<p>Báo giá: <strong>${quotedPrice.toLocaleString("vi-VN")}đ</strong></p>` : ""}
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
            <p style="color:#888;font-size:12px;">Hội Trầm Hương Việt Nam</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send status email:", err)
    }
  }

  // Email admin on REVISION status
  if (status === "REVISION") {
    try {
      const adminEmail = (await prisma.siteConfig.findUnique({ where: { key: "association_email" } }))?.value ?? "admin@hoi-tram-huong.vn"
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: adminEmail,
        subject: `[Chỉnh sửa] ${order.requesterName} yêu cầu chỉnh sửa`,
        html: `<p>${order.requesterName} yêu cầu chỉnh sửa đơn dịch vụ truyền thông.</p>`,
      })
    } catch (err) {
      console.error("Failed to send revision email:", err)
    }
  }

  return NextResponse.json({ success: true })
}
