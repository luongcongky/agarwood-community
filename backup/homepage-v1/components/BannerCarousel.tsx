"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { cloudinaryFit } from "@/lib/cloudinary"

type BannerItem = {
  id: string
  title: string
  imageUrl: string
  targetUrl: string
}

interface Props {
  banners: BannerItem[]
}

const ROTATION_INTERVAL_MS = 5000

/**
 * Auto-rotate carousel cho banner quảng cáo (Phase 6).
 * - 5 giây / banner
 * - Pause khi user hover
 * - Click banner → mở targetUrl tab mới
 * - Pagination dots dưới
 * - Smooth fade transition
 */
export function BannerCarousel({ banners }: Props) {
  const t = useTranslations("homepage")
  const [activeIdx, setActiveIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clamp index trong render để chống out-of-bounds (khi banners array thay đổi)
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

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Sponsored label */}
      <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-400 mb-1.5 text-right">
        {t("sponsored")}
      </p>

      {/* Banner stack — fade transition */}
      <div className="relative w-full aspect-video sm:aspect-21/9 lg:aspect-5/1 rounded-xl overflow-hidden bg-brand-100 shadow-md">
        {banners.map((banner, idx) => (
          <a
            key={banner.id}
            href={banner.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === safeActiveIdx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-hidden={idx !== safeActiveIdx}
          >
            {/*
              Responsive crop bằng Cloudinary transformation:
              - lg (≥1024px): 5:1 (1280×256 → ~2560×512 retina)
              - sm (≥640px):  21:9 (640×274 → ~1280×548 retina)
              - mobile:       16:9 (640×360 → ~1280×720 retina)
              g_auto: AI tự chọn trọng tâm. f_auto+q_auto: webp/avif tự chọn theo trình duyệt.
            */}
            <picture>
              <source
                media="(min-width: 1024px)"
                srcSet={cloudinaryFit(banner.imageUrl, { ar: "5:1", w: 2560 })}
              />
              <source
                media="(min-width: 640px)"
                srcSet={cloudinaryFit(banner.imageUrl, { ar: "21:9", w: 1280 })}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cloudinaryFit(banner.imageUrl, { ar: "16:9", w: 1280 })}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
                fetchPriority={idx === 0 ? "high" : "auto"}
              />
            </picture>
            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-sm sm:text-base font-semibold line-clamp-1">
                {banner.title}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* Pagination dots */}
      {banners.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              aria-label={`Banner ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === safeActiveIdx ? "w-6 bg-brand-700" : "w-2 bg-brand-300 hover:bg-brand-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
