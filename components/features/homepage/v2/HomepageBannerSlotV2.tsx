import { unstable_cache } from "next/cache"
import type { BannerPosition } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { BannerCarouselV2 } from "./BannerCarouselV2"
import { BannerLeaderboardV2 } from "./BannerLeaderboardV2"

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
    [`homepage_active_banners_v2_${position}`],
    { revalidate: 60, tags: ["homepage", "banners"] },
  )()

/**
 * V2 banner slot — VTV-faithful, không wrapper section bg/padding,
 * không empty-state placeholder (ẩn hoàn toàn nếu không có banner nào).
 */
export async function HomepageBannerSlotV2({
  position = "MID",
}: {
  position?: BannerPosition
}) {
  const banners = await getActiveBanners(position)
  if (banners.length === 0) return null
  // TOP slot: VTV-style 970x90 leaderboard stack (2 banners, static).
  // MID (landscape 5:1) / SIDEBAR (portrait 2:3): auto-rotating carousel.
  if (position === "TOP") {
    return <BannerLeaderboardV2 banners={banners} />
  }
  return <BannerCarouselV2 banners={banners} position={position} />
}
