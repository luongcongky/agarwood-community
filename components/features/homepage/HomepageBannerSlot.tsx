import { unstable_cache } from "next/cache"
import type { BannerPosition } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { BannerCarousel } from "./BannerCarousel"

/**
 * Banner quảng cáo trang chủ — tách theo position (TOP / MID).
 *
 * Fetch top 20 banner ACTIVE đang trong khoảng startDate ≤ now ≤ endDate,
 * lọc theo vị trí hiển thị. Priority sort theo `contributionTotal DESC` của owner.
 * Cache 60s mỗi position, tag "homepage" + "banners".
 */

const getActiveBanners = (position: BannerPosition) =>
  unstable_cache(
    async () => {
      const now = new Date()
      return prisma.banner.findMany({
        where: {
          status: "ACTIVE",
          position,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: [
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
    },
    [`homepage_active_banners_${position}`],
    { revalidate: 60, tags: ["homepage", "banners"] },
  )()

const POSITION_COPY: Record<BannerPosition, string> = {
  TOP: "Vị trí Banner — Đầu trang chủ",
  MID: "Vị trí Banner — Giữa trang chủ",
}

export async function HomepageBannerSlot({
  position = "MID",
}: {
  position?: BannerPosition
}) {
  const banners = await getActiveBanners(position)

  if (banners.length === 0) {
    return (
      <section className="bg-brand-50 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="rounded-xl border-2 border-dashed border-brand-300 bg-white p-8 text-center">
            <p className="text-xs uppercase tracking-wider font-semibold text-brand-500 mb-2">
              {POSITION_COPY[position]}
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
