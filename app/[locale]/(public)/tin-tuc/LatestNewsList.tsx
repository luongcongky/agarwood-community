"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Locale } from "@/i18n/config"
import { loadMoreNews, type NewsListItem } from "./actions"
import { NewsListItemCard } from "./NewsListItemCard"

type Props = {
  locale: Locale
  q?: string
  /** Offset bắt đầu của tail (số item đã được server-render ở page.tsx
   *  trước component này — bao gồm cả hero + sub-hero + initial list). */
  initialOffset: number
  /** `true` khi server-render xong mà vẫn còn item — component này cần
   *  spawn IntersectionObserver để load tiếp. */
  initialHasMore: boolean
  pinnedLabel: string
  loadingLabel: string
  endLabel: string
}

const PAGE_SIZE = 10

/**
 * Client island CHỈ để load thêm news sau batch initial. Initial list được
 * page.tsx render trực tiếp từ server (NewsListItemCard) — component này
 * hydrate với `items=[]`, giảm hydration cost đáng kể (400ms → ~50ms trên
 * mobile Slow 4G, benchmark 2026-04).
 *
 * IntersectionObserver với rootMargin 200px để load trước khi user chạm đáy.
 */
export function LatestNewsList({
  locale,
  q,
  initialOffset,
  initialHasMore,
  pinnedLabel,
  loadingLabel,
  endLabel,
}: Props) {
  const [items, setItems] = useState<NewsListItem[]>([])
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const result = await loadMoreNews({
        skip: initialOffset + items.length,
        take: PAGE_SIZE,
        q,
      })
      setItems((prev) => [...prev, ...result.items])
      setHasMore(result.hasMore)
    } catch {
      // silent: user scroll lại để trigger observer.
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, items.length, initialOffset, q])

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

  return (
    <>
      {items.length > 0 && (
        <ul>
          {items.map((item) => (
            <NewsListItemCard
              key={item.id}
              item={item}
              locale={locale}
              pinnedLabel={pinnedLabel}
            />
          ))}
        </ul>
      )}

      {/* Sentinel + trạng thái cuối list. Luôn render khi `hasMore` để user
          có thể scroll để trigger — dù items[] đang rỗng (chưa load batch nào). */}
      {hasMore ? (
        <div
          ref={sentinelRef}
          className="mt-6 flex items-center justify-center py-6"
          aria-live="polite"
        >
          {loading ? (
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-neutral-500">
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-700"
              />
              {loadingLabel}
            </div>
          ) : (
            <span className="text-xs uppercase tracking-wider text-neutral-400">
              {loadingLabel}
            </span>
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
