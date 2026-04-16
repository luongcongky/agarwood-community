"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const profileSchema = z.object({
  name:  z.string().min(2, "Ten toi thieu 2 ky tu"),
  phone: z.string().regex(/^(0|\+84)[0-9]{8,9}$/, "So dien thoai khong hop le").or(z.literal("")),
  bio:   z.string().max(2000, "Tieu su toi da 2000 ky tu").optional().default(""),
})

export async function updateProfile(formData: { name: string; phone: string; bio?: string }) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Chua dang nhap" }

  const parsed = profileSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      bio: parsed.data.bio?.trim() || null,
    },
  })

  revalidatePath("/ho-so")
  return { success: true }
}

const bankSchema = z.object({
  bankName:          z.string().min(1, "Vui long chon ngan hang"),
  bankAccountNumber: z.string().regex(/^\d{6,20}$/, "So tai khoan khong hop le"),
  bankAccountName:   z.string().regex(/^[A-Z\s]{2,50}$/, "Ten chu TK phai viet IN HOA khong dau"),
})

export async function updateBankInfo(formData: {
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Chua dang nhap" }

  const parsed = bankSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  })

  revalidatePath("/ho-so")
  return { success: true }
}
