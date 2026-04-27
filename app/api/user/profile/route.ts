import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    name,
    phone,
    bio,
    avatarUrl,
    bankAccountName,
    bankAccountNumber,
    bankName,
    currentPassword,
    newPassword,
  } = body

  const updateData: Record<string, unknown> = {}
  if (name) updateData.name = name
  if (phone !== undefined) updateData.phone = phone
  if (bio !== undefined) updateData.bio = typeof bio === "string" ? bio.trim() || null : null
  // Phase 3.7 (2026-04): owner đổi avatar. Accept Cloudinary URL hoặc null
  // (xoá). Validate origin để chặn arbitrary URL injection.
  if (avatarUrl !== undefined) {
    if (avatarUrl === null || avatarUrl === "") {
      updateData.avatarUrl = null
    } else if (typeof avatarUrl === "string" && /^https:\/\/res\.cloudinary\.com\//.test(avatarUrl)) {
      updateData.avatarUrl = avatarUrl
    } else {
      return NextResponse.json({ error: "URL avatar không hợp lệ" }, { status: 400 })
    }
  }
  if (bankAccountName !== undefined) updateData.bankAccountName = bankAccountName
  if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber
  if (bankName !== undefined) updateData.bankName = bankName

  if (newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Không thể đổi mật khẩu" }, { status: 400 })
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 })
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 12)
  }

  await prisma.user.update({ where: { id: session.user.id }, data: updateData })
  return NextResponse.json({ success: true })
}
