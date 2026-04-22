"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import type { BannerPosition } from "@prisma/client"
import { cloudinaryFit } from "@/lib/cloudinary"

type BannerItem = {
  id: string
  title: string
  imageUrl: string
  targetUrl: string
}

const ROTATION_INTERVAL_MS = 5000

/**
 * V2 banner carousel — VTV-faithful:
 * - Không label "QUẢNG CÁO"
 * - Không pagination dots
 * - Không rounded / shadow / title overlay
 * - Auto-rotate 5s, pause on hover
 * - targetUrl rỗng → render <div> thay <a> (banner không clickable)
 * - position điều khiển aspect ratio: SIDEBAR → 2:3 portrait,
 *   MID → responsive landscape (16:9 → 21:9 → 5:1)
 */
export function BannerCarouselV2({
  banners,
  position,
}: {
  banners: BannerItem[]
  position: BannerPosition
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const safeActiveIdx = banners.length > 0 ? activeIdx % banners.length : 0

  useEffect(() => {
    if (paused || banners.length <= 1) return
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % banners.length)
    }, ROTATION_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [paused, banners.length])

  if (banners.length === 0) return null

  const isPortrait = position === "SIDEBAR"
  const containerAspectClass = isPortrait
    ? "aspect-[2/3]"
    : "aspect-video sm:aspect-21/9 lg:aspect-5/1"

  return (
    <div
      className={`relative w-full overflow-hidden bg-neutral-100 ${containerAspectClass}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((banner, idx) => {
        const isActive = idx === safeActiveIdx
        const wrapperClass = `absolute inset-0 transition-opacity duration-700 ${
          isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
        }`
        const media: ReactNode = isPortrait ? (
          // SIDEBAR — portrait 2:3, single source (aspect không đổi theo viewport)
          <picture>
            <source
              media="(min-resolution: 1.5dppx)"
              srcSet={cloudinaryFit(banner.imageUrl, { ar: "2:3", w: 1200 })}
            />
            <img
              src={cloudinaryFit(banner.imageUrl, { ar: "2:3", w: 800 })}
              alt={banner.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "auto"}
            />
          </picture>
        ) : (
          // MID — responsive landscape
          <picture>
            <source
              media="(min-width: 1024px)"
              srcSet={cloudinaryFit(banner.imageUrl, { ar: "5:1", w: 2560 })}
            />
            <source
              media="(min-width: 640px)"
              srcSet={cloudinaryFit(banner.imageUrl, { ar: "21:9", w: 1280 })}
            />
            <img
              src={cloudinaryFit(banner.imageUrl, { ar: "16:9", w: 1280 })}
              alt={banner.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "auto"}
            />
          </picture>
        )

        return banner.targetUrl ? (
          <a
            key={banner.id}
            href={banner.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={wrapperClass}
            aria-hidden={!isActive}
          >
            {media}
          </a>
        ) : (
          <div
            key={banner.id}
            className={wrapperClass}
            aria-hidden={!isActive}
          >
            {media}
          </div>
        )
      })}
    </div>
  )
}
