import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ProductForm } from "../ProductForm"
import { getProductQuotaUsage } from "@/lib/product-quota"

export default async function CreateProductPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [company, quota] = await Promise.all([
    prisma.company.findUnique({
      where: { ownerId: session.user.id },
      select: { slug: true },
    }),
    getProductQuotaUsage(session.user.id),
  ])

  const backHref = company ? `/doanh-nghiep/${company.slug}` : "/san-pham-doanh-nghiep"

  // Quota exceeded
  if (quota.limit !== -1 && quota.remaining <= 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-brand-900">Thêm sản phẩm</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-sm text-yellow-800 space-y-2">
          <p className="font-semibold">B���n đã đạt giới hạn {quota.limit} sản phẩm/tháng.</p>
          <p>
            Quota sẽ được làm mới vào{" "}
            <span className="font-medium">{quota.resetAt.toLocaleDateString("vi-VN")}</span>.
            Nâng cấp hội viên để tăng giới hạn.
          </p>
        </div>
        <Link href={backHref} className="text-brand-600 hover:text-brand-800 text-sm">
          ← Quay lại
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="text-brand-600 hover:text-brand-800 text-sm">
          ← Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">Thêm sản phẩm mới</h1>
      </div>

      {/* Quota info */}
      {quota.limit !== -1 && (
        <div className="bg-brand-50 border border-brand-200 rounded-lg px-4 py-2 text-sm text-brand-600">
          Sản phẩm: {quota.used}/{quota.limit} tháng này — còn lại{" "}
          <span className="font-semibold text-brand-800">{quota.remaining}</span>
        </div>
      )}

      <ProductForm companySlug={company?.slug} />
    </div>
  )
}
