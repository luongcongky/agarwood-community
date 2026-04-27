"use server"

import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
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
  address_en: z.string().nullable().optional(),
  address_zh: z.string().nullable().optional(),
  name_en: z.string().nullable().optional(),
  name_zh: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_zh: z.string().nullable().optional(),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().url("URL khong hop le").optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  coverImageUrl: z.string().optional().or(z.literal("")),
})

export async function updateCompany(
  formData: Record<string, unknown>,
  /** Phase 3.7 (2026-04): explicit companyId — admin override flow. Bỏ
   *  trống → fallback ownerId (legacy owner self-edit). */
  companyId?: string,
) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Chua dang nhap" }

  const parsed = companySchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Lookup theo companyId nếu có (admin override) hoặc ownerId (owner default).
  // Validate quyền: phải là chủ DN HOẶC admin role.
  let company: { id: string; slug: string; ownerId: string } | null = null
  if (companyId) {
    company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, slug: true, ownerId: true },
    })
    if (!company) return { error: "Khong tim thay doanh nghiep" }
    const isOwner = company.ownerId === session.user.id
    if (!isOwner && !isAdmin(session.user.role)) {
      return { error: "Khong co quyen chinh sua doanh nghiep nay" }
    }
  } else {
    company = await prisma.company.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true, slug: true, ownerId: true },
    })
    if (!company) return { error: "Khong tim thay doanh nghiep" }
  }

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
      name_en: parsed.data.name_en || null,
      name_zh: parsed.data.name_zh || null,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      description_en: parsed.data.description_en || null,
      description_zh: parsed.data.description_zh || null,
      foundedYear: parsed.data.foundedYear ?? null,
      employeeCount: parsed.data.employeeCount || null,
      businessLicense: parsed.data.businessLicense || null,
      address: parsed.data.address || null,
      address_en: parsed.data.address_en || null,
      address_zh: parsed.data.address_zh || null,
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
