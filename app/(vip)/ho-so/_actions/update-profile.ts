"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const bioField = z.string().max(2000, "Tieu su toi da 2000 ky tu").optional().default("")
const positionField = z.string().max(200, "Chuc vu toi da 200 ky tu").optional().default("")

const profileSchema = z.object({
  name: z.string().min(2, "Ten toi thieu 2 ky tu"),
  phone: z.string().regex(/^(0|\+84)[0-9]{8,9}$/, "So dien thoai khong hop le").or(z.literal("")),
  bio: bioField,
  bio_en: bioField,
  bio_zh: bioField,
  bio_ar: bioField,
  // Business representative fields — optional. Only written when the caller
  // actually has a company attached (checked server-side).
  representativePosition: positionField.optional(),
  representativePosition_en: positionField.optional(),
  representativePosition_zh: positionField.optional(),
  representativePosition_ar: positionField.optional(),
})

type ProfileInput = {
  name: string
  phone: string
  bio?: string
  bio_en?: string
  bio_zh?: string
  bio_ar?: string
  representativePosition?: string
  representativePosition_en?: string
  representativePosition_zh?: string
  representativePosition_ar?: string
}

export async function updateProfile(formData: ProfileInput) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Chua dang nhap" }

  const parsed = profileSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data

  // Update user fields
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      phone: data.phone || null,
      bio: data.bio?.trim() || null,
      bio_en: data.bio_en?.trim() || null,
      bio_zh: data.bio_zh?.trim() || null,
      bio_ar: data.bio_ar?.trim() || null,
    },
  })

  // If the caller is a business representative and sent position data,
  // update the company row they own. Checking `ownerId` prevents a user
  // from editing someone else's company by forging the request.
  const sentPosition =
    data.representativePosition !== undefined ||
    data.representativePosition_en !== undefined ||
    data.representativePosition_zh !== undefined ||
    data.representativePosition_ar !== undefined
  if (sentPosition) {
    const company = await prisma.company.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true },
    })
    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          representativePosition: data.representativePosition?.trim() || null,
          representativePosition_en: data.representativePosition_en?.trim() || null,
          representativePosition_zh: data.representativePosition_zh?.trim() || null,
          representativePosition_ar: data.representativePosition_ar?.trim() || null,
        },
      })
    }
  }

  revalidatePath("/ho-so")
  return { success: true }
}

const bankSchema = z.object({
  bankName: z.string().min(1, "Vui long chon ngan hang"),
  bankAccountNumber: z.string().regex(/^\d{6,20}$/, "So tai khoan khong hop le"),
  bankAccountName: z.string().regex(/^[A-Z\s]{2,50}$/, "Ten chu TK phai viet IN HOA khong dau"),
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
