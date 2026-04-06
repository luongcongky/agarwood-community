"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui long nhap mat khau hien tai"),
    newPassword:     z.string().min(8, "Mat khau moi phai co it nhat 8 ky tu"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mat khau moi khong khop",
    path: ["confirmPassword"],
  })

export async function changePassword(formData: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Chua dang nhap" }

  const parsed = passwordSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })

  if (!user?.passwordHash) {
    return { error: "Khong the doi mat khau cho tai khoan nay" }
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!valid) {
    return { error: "Mat khau hien tai khong dung" }
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hashed },
  })

  return { success: true }
}
