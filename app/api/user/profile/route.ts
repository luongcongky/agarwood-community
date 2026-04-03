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
    bankAccountName,
    bankAccountNumber,
    bankName,
    currentPassword,
    newPassword,
  } = body

  const updateData: Record<string, unknown> = {}
  if (name) updateData.name = name
  if (phone !== undefined) updateData.phone = phone
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
