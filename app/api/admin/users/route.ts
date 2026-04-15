import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import crypto from "crypto"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { name, email, phone, password, sendInvite } = body as {
    name: string
    email: string
    phone?: string
    password?: string
    sendInvite?: boolean
  }

  if (!name || !email) {
    return NextResponse.json({ error: "Tên và email là bắt buộc" }, { status: 400 })
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email đã tồn tại trong hệ thống" }, { status: 409 })
  }

  // Check slot limit
  const maxCfg = await prisma.siteConfig.findUnique({ where: { key: "max_vip_accounts" } })
  const maxSlot = Number(maxCfg?.value ?? 100)
  const currentCount = await prisma.user.count({ where: { role: "VIP" } })
  if (currentCount >= maxSlot) {
    return NextResponse.json({ error: `Đã đạt giới hạn ${maxSlot} tài khoản VIP` }, { status: 400 })
  }

  // If sendInvite, create with token-based activation
  // If password provided, create with password directly
  const hasPassword = !!password
  const passwordHash = hasPassword ? await hash(password, 12) : null

  const user = await prisma.user.create({
    data: {
      email,
      name,
      phone: phone || null,
      role: "VIP",
      isActive: hasPassword, // active immediately if password set, else wait for activation
      passwordHash,
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
        },
      },
    },
  })

  // Send invitation email if requested (no password set)
  if (sendInvite && !hasPassword) {
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    const activationUrl = `${process.env.NEXTAUTH_URL}/dat-mat-khau?token=${token}&email=${encodeURIComponent(email)}`

    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: email,
        subject: "Chào mừng bạn gia nhập Hội Trầm Hương Việt Nam",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Xin chào ${name},</h2>
            <p>Bạn đã được mời tham gia cộng đồng Hội Trầm Hương Việt Nam với tư cách Hội viên VIP.</p>
            <p>Vui lòng nhấn vào liên kết bên dưới để đặt mật khẩu và kích hoạt tài khoản:</p>
            <p><a href="${activationUrl}" style="display:inline-block;background:#1a5632;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Đặt mật khẩu & Kích hoạt tài khoản</a></p>
            <p style="color:#888;font-size:13px;">Liên kết có hiệu lực trong 48 giờ.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#888;font-size:12px;">Hội Trầm Hương Việt Nam · Email tự động, vui lòng không trả lời.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send invite email:", err)
      // Don't fail the user creation if email fails
    }
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    inviteSent: sendInvite && !hasPassword,
  })
}
