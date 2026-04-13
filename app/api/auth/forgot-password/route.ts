import { NextResponse } from "next/server"
import crypto from "crypto"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

export async function POST(req: Request) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 })
  }

  // Always respond success to avoid email enumeration.
  const genericSuccess = NextResponse.json({ success: true })

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, name: true, role: true },
  })

  if (!user || user.role === "ADMIN") {
    return genericSuccess
  }

  await prisma.verificationToken.deleteMany({ where: { identifier: user.email } })

  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/dat-mat-khau?token=${token}&email=${encodeURIComponent(user.email)}`

  try {
    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: user.email,
      subject: "Đặt lại mật khẩu - Hội Trầm Hương Việt Nam",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2>Xin chào ${user.name ?? ""},</h2>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại Hội Trầm Hương Việt Nam.</p>
          <p>Vui lòng nhấn vào liên kết bên dưới để đặt mật khẩu mới:</p>
          <p style="margin:24px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#1a5632;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
              Đặt mật khẩu mới
            </a>
          </p>
          <p style="color:#888;font-size:13px;">Liên kết có hiệu lực trong 48 giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send forgot-password email:", err)
    // still return generic success
  }

  return genericSuccess
}
