import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

// POST /api/admin/registrations/[id] — approve or reject
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { action, reason } = (await req.json()) as { action: "approve" | "reject"; reason?: string }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, name: true, role: true, isActive: true },
  })

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (user.role !== "GUEST" || user.isActive) {
    return NextResponse.json({ error: "Don nay da duoc xu ly" }, { status: 400 })
  }

  if (action === "approve") {
    // Generate activation token (48h)
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await prisma.$transaction([
      // Upgrade to VIP (still inactive until they set password)
      prisma.user.update({
        where: { id },
        data: { role: "VIP", isActive: false },
      }),
      // Publish company
      prisma.company.updateMany({
        where: { ownerId: id },
        data: { isPublished: true },
      }),
      // Create activation token
      prisma.verificationToken.create({
        data: { identifier: user.email, token, expires },
      }),
    ])

    // Send welcome email with activation link
    const activationUrl = `${process.env.NEXTAUTH_URL}/dat-mat-khau?token=${token}&email=${encodeURIComponent(user.email)}`
    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: user.email,
        subject: "Chúc mừng! Đơn đăng ký hội viên đã được chấp thuận",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Xin chào ${user.name},</h2>
            <p>Đơn đăng ký hội viên của bạn đã được <strong>chấp thuận</strong>!</p>
            <p>Vui lòng nhấn vào liên kết bên dưới để đặt mật khẩu và kích hoạt tài khoản:</p>
            <p><a href="${activationUrl}" style="display:inline-block;background:#1a5632;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Đặt mật khẩu & Kích hoạt tài khoản</a></p>
            <p style="color:#888;font-size:13px;">Liên kết có hiệu lực trong 48 giờ.</p>
            <p>Sau khi kích hoạt, bạn có thể đóng phí hội viên để sử dụng đầy đủ tính năng.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="color:#888;font-size:12px;">Hội Trầm Hương Việt Nam</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send approval email:", err)
    }

    return NextResponse.json({ success: true, action: "approved" })
  }

  if (action === "reject") {
    if (!reason) {
      return NextResponse.json({ error: "Vui long nhap ly do tu choi" }, { status: 400 })
    }

    // Delete user + company
    await prisma.$transaction([
      prisma.company.deleteMany({ where: { ownerId: id } }),
      prisma.account.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ])

    // Send rejection email
    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: user.email,
        subject: "Thông báo kết quả đăng ký hội viên — Hội Trầm Hương Việt Nam",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Xin chào ${user.name},</h2>
            <p>Sau khi xem xét, Ban quản trị chưa thể chấp thuận đơn đăng ký hội viên của bạn tại thời điểm này.</p>
            <p><strong>Lý do:</strong> ${reason}</p>
            <p>Nếu bạn có thắc mắc, vui lòng liên hệ Ban quản trị để được hỗ trợ thêm.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="color:#888;font-size:12px;">Hội Trầm Hương Việt Nam</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send rejection email:", err)
    }

    return NextResponse.json({ success: true, action: "rejected" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
