"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { cloudinaryResize } from "@/lib/cloudinary"
import { BLUR_DATA_URL } from "@/lib/seo/blur-placeholder"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { loadMoreAgriculture, type AgricultureListItem } from "./actions"

type Props = {
  initialItems: AgricultureListItem[]
  initialHasMore: boolean
  locale: Locale
  q?: string
  offsetStart: number
  pinnedLabel: string
  emptyLabel: string
  loadingLabel: string
  endLabel: string
}

const PAGE_SIZE = 10

/** Cùng pattern với LatestResearchList — IntersectionObserver lazy load. */
export function LatestAgricultureList({
  initialItems,
  initialHasMore,
  locale,
  q,
  offsetStart,
  pinnedLabel,
  emptyLabel,
  loadingLabel,
  endLabel,
}: Props) {
  const [items, setItems] = useState<AgricultureListItem[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Snapshot initial length — initialItems có thể chứa Post mixed (sort theo
  // date), load-more luôn fetch News only theo skip baseline = offsetStart.
  const initialLenRef = useRef(initialItems.length)

  const l = <T extends Record<string, unknown>>(r: T, f: string) =>
    localize(r, f, locale) as string

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const result = await loadMoreAgriculture({
        skip: offsetStart + (items.length - initialLenRef.current),
        take: PAGE_SIZE,
        q,
      })
      setItems((prev) => [...prev, ...result.items])
      setHasMore(result.hasMore)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, items.length, offsetStart, q])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore()
      },
      { threshold: 0.1, rootMargin: "200px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-neutral-300 py-16 text-center">
        <p className="text-base font-medium text-neutral-600">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <>
      <ul>
        {items.map((item, idx) => {
          const d = normalizeDate(item.publishedAt)
          const isPost = item.source === "post"
          const href = isPost ? `/bai-viet/${item.id}` : `/khuyen-nong/${item.slug}`
          return (
            <li
              key={item.id}
              className={cn("border-b border-neutral-200", idx === 0 && "border-t")}
            >
              <Link href={href} className="group flex gap-4 py-5">
                <div className="relative aspect-4/3 w-32 shrink-0 overflow-hidden bg-neutral-100 sm:w-44">
                  {isPost && (
                    <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-md bg-amber-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                      📝 Bài hội viên
                    </span>
                  )}
                  {item.coverImageUrl ? (
                    <Image
                      src={cloudinaryResize(item.coverImageUrl, 320)}
                      alt={l(item, "title")}
                      fill
                      sizes="(max-width: 640px) 128px, 176px"
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                    />
                  ) : (
                    <AgarwoodPlaceholder className="h-full w-full" size="md" shape="square" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-[16px] font-bold leading-snug text-neutral-900 group-hover:text-brand-700 sm:text-[18px]">
                    {l(item, "title")}
                  </h3>
                  {l(item, "excerpt") && (
                    <p className="mt-1.5 line-clamp-2 hidden text-[13px] leading-relaxed text-neutral-600 sm:block">
                      {l(item, "excerpt")}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-neutral-500">
                    {item.isPinned && <span className="font-bold text-brand-700">{pinnedLabel}</span>}
                    {d && (
                      <time dateTime={d.toISOString()}>
                        {d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </time>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      {hasMore ? (
        <div ref={sentinelRef} className="mt-6 flex items-center justify-center py-6" aria-live="polite">
          {loading ? (
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-neutral-500">
              <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-700" />
              {loadingLabel}
            </div>
          ) : (
            <span className="text-xs uppercase tracking-wider text-neutral-400">{loadingLabel}</span>
          )}
        </div>
      ) : (
        <div className="mt-6 py-6 text-center text-[11px] uppercase tracking-wider text-neutral-400">
          — {endLabel} —
        </div>
      )}
    </>
  )
}

function normalizeDate(d: Date | string | null): Date | null {
  if (!d) return null
  return d instanceof Date ? d : new Date(d)
}
