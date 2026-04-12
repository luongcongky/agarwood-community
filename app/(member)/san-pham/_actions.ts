"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(2, "Ten san pham toi thieu 2 ky tu"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug chi chua a-z, 0-9, dau gach ngang").min(2),
  description: z.string().max(15000).optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  priceRange: z.string().optional().or(z.literal("")),
  imageUrls: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
})

export async function createProduct(formData: Record<string, unknown>) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Chua dang nhap" }

  const parsed = productSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Get company
  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  })
  if (!company) return { error: "Ban chua co doanh nghiep" }

  // Check slug uniqueness
  const slugExists = await prisma.product.findUnique({ where: { slug: parsed.data.slug } })
  if (slugExists) return { error: "Slug da duoc su dung" }

  const product = await prisma.product.create({
    data: {
      companyId: company.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      priceRange: parsed.data.priceRange || null,
      imageUrls: parsed.data.imageUrls ?? [],
      isPublished: parsed.data.isPublished ?? true,
    },
  })

  revalidatePath("/san-pham-chung-nhan")
  return { success: true, slug: product.slug }
}

export async function updateProduct(productId: string, formData: Record<string, unknown>) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Chua dang nhap" }

  const parsed = productSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // Verify ownership
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, company: { select: { ownerId: true } } },
  })
  if (!product || product.company.ownerId !== session.user.id) {
    return { error: "Khong co quyen chinh sua" }
  }

  // Check slug uniqueness (exclude self)
  if (parsed.data.slug !== product.slug) {
    const slugExists = await prisma.product.findFirst({
      where: { slug: parsed.data.slug, id: { not: productId } },
    })
    if (slugExists) return { error: "Slug da duoc su dung" }
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      priceRange: parsed.data.priceRange || null,
      imageUrls: parsed.data.imageUrls ?? [],
      isPublished: parsed.data.isPublished ?? true,
    },
  })

  revalidatePath("/san-pham/" + parsed.data.slug)
  revalidatePath("/san-pham-chung-nhan")
  return { success: true, slug: parsed.data.slug }
}
