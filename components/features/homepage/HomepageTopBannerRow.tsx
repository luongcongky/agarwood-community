import { Suspense } from "react"
import { unstable_cache } from "next/cache"
import type { BannerSlot } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { HomepageBannerSlot } from "./HomepageBannerSlot"

/**
 * Pre-check helper — chỉ count, dùng để quyết định có render wrapper top
 * banner row hay không. Cached 60s + revalidate qua tag "banners". Cùng tag
 * với HomepageBannerSlot.getActiveBanners → admin update banner sẽ
 * invalidate cả 2 cache cùng lúc.
 */
const hasActiveBanner = (slot: BannerSlot) =>
  unstable_cache(
    async () => {
      const now = new Date()
      const count = await prisma.banner.count({
        where: {
          status: "ACTIVE",
          positions: { has: slot },
          startDate: { lte: now },
          endDate: { gte: now },
        },
      })
      return count > 0
    },
    [`banner_has_active_${slot}`],
    { revalidate: 60, tags: ["homepage", "banners"] },
  )()

/**
 * Top banner row (HOMEPAGE_TOP_LEFT + HOMEPAGE_TOP_RIGHT).
 *
 * Bug fix (2026-04-29): wrapper div có `aspect-970/90` reserve layout space
 * dù 2 slot bên trong đều render null khi không có banner active. Để tránh
 * khoảng trống, pre-check cả 2 slot — nếu đều rỗng thì return null hoàn toàn,
 * không render wrapper. Khi có ít nhất 1 banner, vẫn dùng Suspense streaming
 * cho mỗi slot như cũ.
 */
export async function HomepageTopBannerRow() {
  const [hasLeft, hasRight] = await Promise.all([
    hasActiveBanner("HOMEPAGE_TOP_LEFT"),
    hasActiveBanner("HOMEPAGE_TOP_RIGHT"),
  ])
  if (!hasLeft && !hasRight) return null

  return (
    <div className="flex aspect-970/90 w-full gap-3">
      <div className="flex-1">
        <Suspense fallback={null}>
          <HomepageBannerSlot slot="HOMEPAGE_TOP_LEFT" />
        </Suspense>
      </div>
      <div className="flex-1">
        <Suspense fallback={null}>
          <HomepageBannerSlot slot="HOMEPAGE_TOP_RIGHT" />
        </Suspense>
      </div>
    </div>
  )
}
