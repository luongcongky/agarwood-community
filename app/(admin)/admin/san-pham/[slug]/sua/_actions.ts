"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { writeProductRevision, type EditorRole } from "@/lib/product-revision"

/** Schema giống `_actions.ts` bên (member), thêm `reason` bắt buộc — admin
 *  phải ghi lý do để owner + audit trail hiểu tại sao chỉnh. Thiếu reason
 *  ≥10 ký tự → từ chối (không cho log rỗng). */
const adminProductSchema = z.object({
  name: z.string().min(2, "Tên sản phẩm tối thiểu 2 ký tự"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug chỉ chứa a-z, 0-9, dấu gạch").min(2),
  description: z.string().max(15000).optional().or(z.literal("")),
  description_en: z.string().nullable().optional(),
  description_zh: z.string().nullable().optional(),
  description_ar: z.string().nullable().optional(),
  category: z.string().optional().or(z.literal("")),
  category_en: z.string().nullable().optional(),
  category_zh: z.string().nullable().optional(),
  category_ar: z.string().nullable().optional(),
  name_en: z.string().nullable().optional(),
  name_zh: z.string().nullable().optional(),
  name_ar: z.string().nullable().optional(),
  priceRange: z.string().optional().or(z.literal("")),
  imageUrls: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  reason: z.string().min(10, "Lý do chỉnh sửa tối thiểu 10 ký tự"),
  /** Version mà client đang xem — check để tránh 2 admin/owner ghi đè nhau. */
  expectedVersion: z.number().int().nonnegative(),
})

export async function adminUpdateProduct(
  productId: string,
  formData: Record<string, unknown>,
) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Chưa đăng nhập" }

  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "product:write")) {
    return { error: "Không có quyền chỉnh sửa sản phẩm (cần product:write)" }
  }

  const parsed = adminProductSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, ownerId: true },
  })
  if (!existing) return { error: "Sản phẩm không tồn tại" }

  // Check slug unique nếu đổi
  if (parsed.data.slug !== existing.slug) {
    const slugExists = await prisma.product.findFirst({
      where: { slug: parsed.data.slug, id: { not: productId } },
      select: { id: true },
    })
    if (slugExists) return { error: "Slug đã được sử dụng" }
  }

  // Optimistic concurrency — từ chối nếu đã có revision mới hơn (owner
  // vừa sửa song song, hoặc admin khác đè).
  const latest = await prisma.productRevision.findFirst({
    where: { productId },
    orderBy: { version: "desc" },
    select: { version: true },
  })
  const currentVersion = latest?.version ?? 0
  if (parsed.data.expectedVersion !== currentVersion) {
    return {
      error: `Có người khác đã chỉnh sửa (v${currentVersion}). Vui lòng reload trang để xem nội dung mới nhất.`,
      conflict: true,
    }
  }

  // Xác định EditorRole — ADMIN role ưu tiên, còn lại là TRUYEN_THONG
  // (committee duy nhất có product:write hiện tại).
  const editedRole: EditorRole =
    session.user.role === "ADMIN" ? "ADMIN" : "TRUYEN_THONG"

  await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        name: parsed.data.name,
        name_en: parsed.data.name_en || null,
        name_zh: parsed.data.name_zh || null,
        name_ar: parsed.data.name_ar || null,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        description_en: parsed.data.description_en || null,
        description_zh: parsed.data.description_zh || null,
        description_ar: parsed.data.description_ar || null,
        category: parsed.data.category || null,
        category_en: parsed.data.category_en || null,
        category_zh: parsed.data.category_zh || null,
        category_ar: parsed.data.category_ar || null,
        priceRange: parsed.data.priceRange || null,
        imageUrls: parsed.data.imageUrls ?? [],
        isPublished: parsed.data.isPublished ?? true,
      },
    })
    await writeProductRevision({
      product: updated,
      editedBy: session.user.id,
      editedRole,
      reason: parsed.data.reason,
      tx,
    })
  })

  revalidatePath("/san-pham/" + parsed.data.slug)
  revalidatePath("/san-pham-doanh-nghiep")
  revalidatePath("/san-pham-chung-nhan")
  revalidatePath(`/admin/san-pham/${parsed.data.slug}/sua`)
  return { success: true, slug: parsed.data.slug }
}
