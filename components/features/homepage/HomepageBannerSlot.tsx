import { unstable_cache } from "next/cache"
import type { BannerSlot } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { cloudinaryFit } from "@/lib/cloudinary"
import { getSlotShape } from "@/lib/banner-slots"
import { BannerCarousel } from "./BannerCarousel"

const getActiveBanners = (slot: BannerSlot) =>
  unstable_cache(
    async () => {
      const now = new Date()
      return prisma.banner.findMany({
        where: {
          status: "ACTIVE",
          positions: { has: slot }, // multi-slot: banner áp dụng cho slot này
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
    [`banners_active_${slot}`],
    { revalidate: 60, tags: ["homepage", "banners"] },
  )()

/**
 * Banner slot — VTV-faithful, không wrapper section bg/padding,
 * không empty-state placeholder (ẩn hoàn toàn nếu không có banner nào).
 *
 * Phase 4 (2026-04-29): nhận `slot: BannerSlot` page-prefixed (HOMEPAGE_TOP_LEFT,
 * NEWS_LIST_SIDEBAR, ...). Aspect ratio derive từ suffix slot.
 *
 * Render dispatcher:
 *  - TOP_HALF (HOMEPAGE_TOP_LEFT/RIGHT): single banner 485:90, no rotation.
 *  - MID / SIDEBAR: BannerCarousel auto-rotate.
 */
export async function HomepageBannerSlot({
  slot,
}: {
  slot: BannerSlot
}) {
  const banners = await getActiveBanners(slot)
  if (banners.length === 0) return null

  if (getSlotShape(slot) === "TOP_HALF") {
    // Single half-leaderboard — chỉ hiện 1 banner đầu, no carousel.
    const banner = banners[0]
    const media = (
      <picture>
        <source
          media="(min-width: 640px)"
          srcSet={cloudinaryFit(banner.imageUrl, { ar: "485:90", w: 970 })}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cloudinaryFit(banner.imageUrl, { ar: "485:90", w: 640 })}
          alt={banner.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      </picture>
    )
    return banner.targetUrl ? (
      <a
        href={banner.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-485/90 w-full overflow-hidden bg-neutral-100"
      >
        {media}
      </a>
    ) : (
      <div className="relative aspect-485/90 w-full overflow-hidden bg-neutral-100">
        {media}
      </div>
    )
  }

  return <BannerCarousel banners={banners} slot={slot} />
}
