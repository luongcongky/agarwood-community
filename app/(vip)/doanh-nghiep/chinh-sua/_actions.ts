"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const companySchema = z.object({
  name: z.string().min(2, "Ten cong ty toi thieu 2 ky tu"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug chi chua a-z, 0-9, dau gach ngang").min(2),
  description: z.string().max(10000).optional().or(z.literal("")),
  foundedYear: z.number().min(1900).max(2030).optional().nullable(),
  employeeCount: z.string().optional().or(z.literal("")),
  businessLicense: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().url("URL khong hop le").optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  coverImageUrl: z.string().optional().or(z.literal("")),
})

export async function updateCompany(formData: Record<string, unknown>) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Chua dang nhap" }

  const parsed = companySchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, slug: true },
  })
  if (!company) return { error: "Khong tim thay doanh nghiep" }

  // Check slug uniqueness (exclude self)
  if (parsed.data.slug !== company.slug) {
    const slugExists = await prisma.company.findFirst({
      where: { slug: parsed.data.slug, id: { not: company.id } },
    })
    if (slugExists) return { error: "Slug da duoc su dung boi doanh nghiep khac" }
  }

  await prisma.company.update({
    where: { id: company.id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      foundedYear: parsed.data.foundedYear ?? null,
      employeeCount: parsed.data.employeeCount || null,
      businessLicense: parsed.data.businessLicense || null,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      website: parsed.data.website || null,
      logoUrl: parsed.data.logoUrl || null,
      coverImageUrl: parsed.data.coverImageUrl || null,
    },
  })

  revalidatePath("/doanh-nghiep/" + parsed.data.slug)
  revalidatePath("/doanh-nghiep/chinh-sua")
  return { success: true, slug: parsed.data.slug }
}
