import { prisma } from "@/lib/prisma"
import { FeaturedManager } from "./FeaturedManager"

export const metadata = {
  title: "Quản lý Tiêu biểu | Admin",
}

export default async function AdminFeaturedPage() {
  // Lấy tất cả SP của doanh nghiệp VIP — admin có thể pin tới 20
  // Lấy tất cả DN VIP — admin có thể pin tới 10
  const [products, companies] = await Promise.all([
    prisma.product.findMany({
      where: {
        isPublished: true,
        company: { owner: { role: "VIP" } },
      },
      orderBy: [
        { isFeatured: "desc" },
        { featuredOrder: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrls: true,
        certStatus: true,
        isFeatured: true,
        featuredOrder: true,
        company: {
          select: { name: true, slug: true },
        },
      },
    }),
    prisma.company.findMany({
      where: {
        isPublished: true,
        owner: { role: "VIP" },
      },
      orderBy: [
        { isFeatured: "desc" },
        { featuredOrder: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        isVerified: true,
        isFeatured: true,
        featuredOrder: true,
        owner: { select: { name: true } },
      },
    }),
  ])

  const featuredProductCount = products.filter((p) => p.isFeatured).length
  const featuredCompanyCount = companies.filter((c) => c.isFeatured).length

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-900">Quản lý Tiêu biểu</h1>
        <p className="mt-1 text-sm text-brand-500">
          Chọn các sản phẩm và doanh nghiệp xuất hiện ở trang Sản phẩm tiêu biểu
          và Landing page. Chỉ áp dụng cho hội viên.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-brand-500">
            Sản phẩm tiêu biểu (top 20)
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-900">
            {featuredProductCount}
            <span className="text-sm font-normal text-brand-500"> / 20 đã chọn</span>
          </p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-brand-500">
            Doanh nghiệp tiêu biểu (top 10)
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-900">
            {featuredCompanyCount}
            <span className="text-sm font-normal text-brand-500"> / 10 đã chọn</span>
          </p>
        </div>
      </div>

      <FeaturedManager initialProducts={products} initialCompanies={companies} />
    </div>
  )
}
