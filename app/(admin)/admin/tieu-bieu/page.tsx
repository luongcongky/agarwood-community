import { prisma } from "@/lib/prisma"
import { FeaturedManager } from "./FeaturedManager"

export const metadata = {
  title: "Quản lý Tiêu biểu | Admin",
}

export default async function AdminFeaturedPage() {
  // Lấy tất cả SP của doanh nghiệp VIP — admin có thể pin tới 20
  // Lấy tất cả DN VIP — admin có thể pin tới 10
  const [products, companies] = await Promise.all([
    prisma.product
      .findMany({
        where: {
          isPublished: true,
          // Phase 4 (2026-04-29): filter theo direct owner thay vì company.owner.
          // KH yêu cầu admin có thể đưa post sản phẩm trên feed vào "Sản phẩm
          // tiêu biểu" 1-click. Post tạo qua feed có thể có companyId=null
          // (hội viên không link company) → filter cũ qua company.owner sẽ ẩn
          // mất. Dùng owner trực tiếp đồng bộ với /api/admin/products/[id]/featured
          // và homepage carousel (lib/homepage.ts:getFeaturedProductsForHomepage).
          owner: { role: { in: ["VIP", "INFINITE", "ADMIN"] } },
        },
        // Sort thô bằng DB (createdAt desc), tier-sort cuối cùng ở JS vì
        // Prisma orderBy không support CASE expression cho tier logic.
        orderBy: { createdAt: "desc" },
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
      })
      .then((rows) => {
        // 3-tier sort (Phase 4 — 2026-04-29 customer feedback):
        //  1. isFeatured=true (admin đã đưa vào tiêu biểu) — sub-sort theo
        //     featuredOrder asc, items không có order xếp sau (null = last)
        //  2. certStatus = APPROVED (đã chứng nhận)
        //  3. còn lại
        // Trong cùng tier, fallback theo createdAt desc (đã orderBy ở DB).
        const tier = (p: { isFeatured: boolean; certStatus: string }) =>
          p.isFeatured ? 0 : p.certStatus === "APPROVED" ? 1 : 2
        return [...rows].sort((a, b) => {
          const ta = tier(a)
          const tb = tier(b)
          if (ta !== tb) return ta - tb
          if (ta === 0) {
            // Cả 2 đều featured — sub-sort theo featuredOrder asc, null xếp cuối
            const ao = a.featuredOrder
            const bo = b.featuredOrder
            if (ao === null && bo === null) return 0
            if (ao === null) return 1
            if (bo === null) return -1
            return ao - bo
          }
          return 0 // giữ thứ tự DB (createdAt desc)
        })
      }),
    prisma.company
      .findMany({
        where: {
          isPublished: true,
          owner: { role: { in: ["VIP", "INFINITE"] } },
        },
        // Sort thô bằng DB; tier-sort cuối cùng ở JS (Prisma không support
        // CASE expression cho tier logic).
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          isVerified: true,
          isFeatured: true,
          featuredOrder: true,
          owner: { select: { name: true, contributionTotal: true } },
        },
      })
      .then((rows) => {
        // 4-tier sort (Phase 4 — 2026-04-29 customer feedback):
        //  1. isFeatured=true (admin pin) — sub-sort featuredOrder asc, null cuối
        //  2. owner.contributionTotal > 0 → desc (đóng góp giảm dần)
        //  3. isVerified = true (đã xác minh)
        //  4. còn lại
        const tier = (c: {
          isFeatured: boolean
          owner: { contributionTotal: number }
          isVerified: boolean
        }) =>
          c.isFeatured
            ? 0
            : c.owner.contributionTotal > 0
              ? 1
              : c.isVerified
                ? 2
                : 3
        return [...rows].sort((a, b) => {
          const ta = tier(a)
          const tb = tier(b)
          if (ta !== tb) return ta - tb
          if (ta === 0) {
            const ao = a.featuredOrder
            const bo = b.featuredOrder
            if (ao === null && bo === null) return 0
            if (ao === null) return 1
            if (bo === null) return -1
            return ao - bo
          }
          if (ta === 1) {
            return b.owner.contributionTotal - a.owner.contributionTotal
          }
          return 0 // giữ thứ tự DB (createdAt desc) cho tier 2 + 3
        })
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
