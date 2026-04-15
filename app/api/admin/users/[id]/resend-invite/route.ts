import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, name: true, isActive: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Delete old tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: user.email },
  })

  // Create new token
  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires },
  })

  const activationUrl = `${process.env.NEXTAUTH_URL}/dat-mat-khau?token=${token}&email=${encodeURIComponent(user.email)}`

  try {
    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: user.email,
      subject: "Kích hoạt tài khoản - Hội Trầm Hương Việt Nam",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Xin chào ${user.name},</h2>
          <p>Đây là liên kết mới để kích hoạt tài khoản Hội Trầm Hương Việt Nam của bạn.</p>
          <p><a href="${activationUrl}" style="display:inline-block;background:#1a5632;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Đặt mật khẩu & Kích hoạt</a></p>
          <p style="color:#888;font-size:13px;">Liên kết có hiệu lực trong 48 giờ.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send invite email:", err)
    return NextResponse.json({ error: "Không thể gửi email" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
