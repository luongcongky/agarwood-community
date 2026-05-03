import Link from "next/link"
import { cn } from "@/lib/utils"
import { CloudinaryImage } from "@/components/ui/CloudinaryImage"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import type { NewsListItem } from "./actions"

/**
 * Pure presentational list item card. Dùng được ở cả server component
 * (initial SSR batch) lẫn client component (items load thêm qua infinite
 * scroll). Tách riêng để markup nhất quán mà không duplicate code.
 *
 * Date có thể là Date (prisma trực tiếp) hoặc string (sau khi đi qua
 * unstable_cache JSON serialize) — normalize tại đây.
 */
export function NewsListItemCard({
  item,
  locale,
  pinnedLabel,
  isFirst = false,
}: {
  item: NewsListItem
  locale: Locale
  pinnedLabel: string
  isFirst?: boolean
}) {
  const title = localize(item as unknown as Record<string, unknown>, "title", locale) as string
  const excerpt = localize(item as unknown as Record<string, unknown>, "excerpt", locale) as string | null
  const d = normalizeDate(item.publishedAt)
  // Phase 3.7 round 4 (2026-04): item có thể là Post curated thay vì News.
  // Source="post" → href /bai-viet/[id] + badge "📝 Bài hội viên".
  const isPost = item.source === "post"
  const href = isPost ? `/bai-viet/${item.id}` : `/tin-tuc/${item.slug}`

  return (
    <li className={cn("border-b border-neutral-200", isFirst && "border-t")}>
      <Link href={href} className="group flex gap-4 py-5">
        <div className="relative aspect-4/3 w-32 shrink-0 overflow-hidden bg-neutral-100 sm:w-44">
          {/* Badge "Bài hội viên" trên ảnh khi source=post */}
          {isPost && (
            <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-md bg-amber-500/95 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
              📝 Bài hội viên
            </span>
          )}
          <CloudinaryImage
            src={item.coverImageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 128px, 176px"
            className="object-cover"
            maxWidth={480}
            fallbackSize="sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[16px] font-bold leading-snug text-neutral-900 group-hover:text-brand-700 sm:text-[18px]">
            {title}
          </h3>
          {excerpt && (
            <p className="mt-1.5 line-clamp-2 hidden text-[13px] leading-relaxed text-neutral-600 sm:block">
              {excerpt}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-neutral-500">
            {item.isPinned && (
              <span className="font-bold text-brand-700">{pinnedLabel}</span>
            )}
            {d && (
              <time dateTime={d.toISOString()}>
                {d.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </time>
            )}
          </div>
        </div>
      </Link>
    </li>
  )
}

function normalizeDate(d: Date | string | null): Date | null {
  if (!d) return null
  return d instanceof Date ? d : new Date(d)
}
