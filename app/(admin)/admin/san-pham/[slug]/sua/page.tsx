import { auth } from "@/lib/auth"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ProductForm, type ProductFormSubmitter } from "@/app/(member)/san-pham/ProductForm"
import { adminUpdateProduct } from "./_actions"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Sửa sản phẩm — Quản trị" }
export const revalidate = 0

// Adapter từ signature ProductFormSubmitter (productId | null) → server action
// yêu cầu productId string. Null không xảy ra trong admin flow vì page này
// chỉ load khi product tồn tại.
const adminProductSubmitter: ProductFormSubmitter = async (productId, data) => {
  "use server"
  if (!productId) return { error: "Thiếu productId" }
  return adminUpdateProduct(productId, data)
}

/**
 * Admin edit SP của owner bất kỳ — chỉ cho role ADMIN hoặc committee
 * TRUYEN_THONG (permission `product:write`). Reuse ProductForm từ member
 * flow, truyền thêm `mode="admin"` + submitter = adminUpdateProduct +
 * currentVersion để check optimistic concurrency.
 *
 * Owner flow (/san-pham/[slug]/sua) vẫn tồn tại song song cho owner tự
 * sửa. Admin edit qua page này để thao tác ghi revision với editedRole
 * khác + reason bắt buộc.
 */
export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "product:write")) {
    redirect("/admin")
  }

  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      name_en: true,
      name_zh: true,
      name_ar: true,
      slug: true,
      description: true,
      description_en: true,
      description_zh: true,
      description_ar: true,
      category: true,
      category_en: true,
      category_zh: true,
      category_ar: true,
      priceRange: true,
      imageUrls: true,
      isPublished: true,
      // Phase 4 (2026-04-29): spec sheet + variants
      origin: true,
      treeAge: true,
      packagingNote: true,
      scentProfile: true,
      variants: true,
      shippingPolicy: true,
      returnPolicy: true,
      owner: { select: { name: true, email: true } },
    },
  })
  if (!product) notFound()

  const latestRev = await prisma.productRevision.findFirst({
    where: { productId: product.id },
    orderBy: { version: "desc" },
    select: { version: true },
  })
  const currentVersion = latestRev?.version ?? 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-brand-600 hover:text-brand-800 text-sm">
          ← Về Quản trị
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">
          Chỉnh sửa SP: {product.name}
        </h1>
      </div>

      <ProductForm
        mode="admin"
        ownerInfo={{
          name: product.owner.name,
          email: product.owner.email,
        }}
        currentVersion={currentVersion}
        submitter={adminProductSubmitter}
        historyHref={`/san-pham/${slug}/lich-su`}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category,
          priceRange: product.priceRange,
          imageUrls: product.imageUrls as string[],
          isPublished: product.isPublished,
          // @ts-expect-error — i18n + spec fields ProductForm reads via record cast
          name_en: product.name_en,
          name_zh: product.name_zh,
          name_ar: product.name_ar,
          description_en: product.description_en,
          description_zh: product.description_zh,
          description_ar: product.description_ar,
          category_en: product.category_en,
          category_zh: product.category_zh,
          category_ar: product.category_ar,
          origin: product.origin,
          treeAge: product.treeAge,
          packagingNote: product.packagingNote,
          scentProfile: product.scentProfile,
          variants: product.variants,
          shippingPolicy: product.shippingPolicy,
          returnPolicy: product.returnPolicy,
        }}
      />
    </div>
  )
}
