import { auth } from "@/lib/auth"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { RevisionHistory } from "./RevisionHistory"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Lịch sử chỉnh sửa sản phẩm" }
export const revalidate = 0

/**
 * Lịch sử chỉnh sửa 1 Product. Truy cập: owner hoặc bất cứ ai có
 * `product:write` (ADMIN / TRUYEN_THONG).
 *
 * Không phải user role thường — hội viên VIP khác không xem được lịch sử
 * SP của người khác (privacy nhẹ: nội dung kinh doanh có thể nhạy cảm).
 */
export default async function ProductHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      ownerId: true,
      owner: { select: { name: true, email: true } },
    },
  })
  if (!product) notFound()

  const isOwner = product.ownerId === session.user.id
  const perms = await getUserPermissions(session.user.id)
  const canWrite = hasPermission(perms, "product:write")
  if (!isOwner && !canWrite) redirect(`/san-pham/${slug}`)

  const revisions = await prisma.productRevision.findMany({
    where: { productId: product.id },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      editedAt: true,
      editedRole: true,
      reason: true,
      changedFields: true,
      editor: { select: { id: true, name: true, email: true } },
      // Snapshot fields — cần để diff
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
    },
  })

  // Serialize dates — Next 15 không tự convert trong client boundary.
  const serialized = revisions.map((r) => ({
    ...r,
    editedAt: r.editedAt.toISOString(),
  }))

  const editHref = canWrite && !isOwner
    ? `/admin/san-pham/${slug}/sua`
    : `/san-pham/${slug}/sua`

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href={`/san-pham/${slug}`} className="text-brand-600 hover:text-brand-800 text-sm">
          ← Về trang sản phẩm
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">Lịch sử: {product.name}</h1>
      </div>

      <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-4 text-sm text-brand-700">
        <p>
          <span className="font-semibold">Chủ sở hữu:</span> {product.owner.name}{" "}
          <span className="text-brand-500">({product.owner.email})</span>
        </p>
        <p className="mt-1 text-xs text-brand-500">
          Tổng số phiên bản: {revisions.length}. Chọn 2 phiên bản để so sánh
          thay đổi từng dòng trong mô tả + field khác.
        </p>
        <p className="mt-2">
          <Link href={editHref} className="text-brand-700 font-semibold hover:underline">
            Sửa sản phẩm →
          </Link>
        </p>
      </div>

      {revisions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-200 p-10 text-center text-brand-500">
          Chưa có lịch sử chỉnh sửa. Có vẻ SP được tạo trước khi bật tính năng
          audit — phiên bản mới sẽ được ghi nhận kể từ lần edit tiếp theo.
        </div>
      ) : (
        <RevisionHistory revisions={serialized} />
      )}
    </div>
  )
}
