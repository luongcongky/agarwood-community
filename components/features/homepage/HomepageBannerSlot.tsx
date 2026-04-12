import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { BannerCarousel } from "./BannerCarousel"

/**
 * Section 4 — Banner quảng cáo (Phase 6).
 *
 * Fetch top 20 banner ACTIVE đang trong khoảng startDate ≤ now ≤ endDate.
 * Priority sort: Hội viên★★★ Vàng → Hội viên★★ Bạc → Hội viên★ → Tài khoản cơ bản → ADMIN
 * (sort theo `contributionTotal DESC` của owner — proxy cho tier)
 *
 * Cache 60s để tránh query liên tục, cùng tag "homepage" + "banners".
 */

const getActiveBanners = unstable_cache(
  async () => {
    const now = new Date()
    const banners = await prisma.banner.findMany({
      where: {
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [
        // Priority: contributionTotal DESC = VIP cao nhất trước, GUEST cuối
        { user: { contributionTotal: "desc" } },
        { createdAt: "desc" },
      ],
      take: 20,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        targetUrl: true,
      },
    })
    return banners
  },
  ["homepage_active_banners"],
  { revalidate: 60, tags: ["homepage", "banners"] },
)

export async function HomepageBannerSlot() {
  const banners = await getActiveBanners()

  if (banners.length === 0) {
    return (
      <section className="bg-brand-50 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="rounded-xl border-2 border-dashed border-brand-300 bg-white p-8 text-center">
            <p className="text-xs uppercase tracking-wider font-semibold text-brand-500 mb-2">
              Vị trí Banner Quảng cáo
            </p>
            <p className="text-sm text-brand-600">
              Doanh nghiệp hội viên có thể đăng ký banner quảng cáo tại vị trí này.
            </p>
            <a
              href="/banner/dang-ky"
              className="mt-3 inline-flex items-center text-xs font-semibold text-brand-700 underline"
            >
              Đăng ký banner ngay →
            </a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-brand-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <BannerCarousel banners={banners} />
      </div>
    </section>
  )
}
