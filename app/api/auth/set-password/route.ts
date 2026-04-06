import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

export async function POST(request: Request) {
  const { token, email, password } = (await request.json()) as {
    token: string
    email: string
    password: string
  }

  if (!token || !email || !password) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Mật khẩu phải có ít nhất 8 ký tự" }, { status: 400 })
  }

  // Validate token
  const record = await prisma.verificationToken.findFirst({
    where: {
      token,
      identifier: email,
      expires: { gt: new Date() },
    },
  })

  if (!record) {
    return NextResponse.json({ error: "Liên kết đã hết hạn hoặc không hợp lệ" }, { status: 400 })
  }

  // Find user
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 })
  }

  // Hash password and activate
  const passwordHash = await hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, isActive: true },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: email, token },
    }),
  ])

  return NextResponse.json({ success: true })
}
