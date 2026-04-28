import Link from "next/link"
import Image from "next/image"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { cloudinaryResize } from "@/lib/cloudinary"
import { newsCoverImage } from "@/lib/multimedia-from-news"

export type SidebarListItem = {
  id: string
  title: string
  title_en?: string | null
  title_zh?: string | null
  title_ar?: string | null
  slug: string
  coverImageUrl: string | null
  /** Phase 3.7 round 4 (2026-04): optional template + gallery để fallback
   *  thumbnail từ YouTube ID (VIDEO) hoặc gallery[0] (PHOTO) khi
   *  coverImageUrl null. */
  template?: "NORMAL" | "PHOTO" | "VIDEO" | null
  gallery?: unknown
  /** Date từ Prisma query trực tiếp, HOẶC string nếu data đi qua
   *  unstable_cache (JSON serialize đưa Date về ISO string). */
  publishedAt: Date | string | null
}

/** Normalize Date|string|null → Date|null trước khi dùng Date API. */
function normalizeDate(d: Date | string | null): Date | null {
  if (!d) return null
  return d instanceof Date ? d : new Date(d)
}

type Props = {
  /** Tiêu đề section — hiển thị uppercase với brown underline. */
  title: string
  /** Danh sách bài. */
  items: SidebarListItem[]
  /** Locale để localize title. */
  locale: Locale
  /** URL prefix dẫn tới detail (vd `/tin-tuc`, `/nghien-cuu`). */
  itemHrefPrefix: string
  /** Compact mode: ẩn thumbnail, chỉ hiện title — tiết kiệm chiều cao cho
   *  list "Mới đăng" dưới "Tin nổi bật" (đã có thumb). */
  compact?: boolean
}

/**
 * Shared sidebar list block dùng ở cả news list + detail pages.
 * Header format khớp Section component (brown underline + uppercase).
 */
export function SidebarList({
  title,
  items,
  locale,
  itemHrefPrefix,
  compact = false,
}: Props) {
  if (items.length === 0) return null
  const l = <T extends Record<string, unknown>>(record: T, field: string) =>
    localize(record, field, locale) as string
  return (
    <section aria-label={title}>
      <h2 className="mb-4 border-b-[3px] border-brand-700 pb-1 text-[13px] font-bold uppercase tracking-wider text-neutral-900">
        {title}
      </h2>
      <ul className={compact ? "space-y-3" : "space-y-4"}>
        {items.map((item) => {
          const cover = newsCoverImage(item)
          return (
          <li key={item.id}>
            <Link href={`${itemHrefPrefix}/${item.slug}`} className="group flex gap-3">
              {!compact && cover && (
                <div className="relative aspect-16/10 w-[92px] shrink-0 overflow-hidden bg-neutral-100">
                  <Image
                    src={
                      // YouTube CDN không qua Cloudinary, không cần resize
                      cover.includes("img.youtube.com")
                        ? cover
                        : cloudinaryResize(cover, 200)
                    }
                    alt={l(item, "title")}
                    fill
                    className="object-cover"
                    sizes="92px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-3 text-[14px] font-semibold leading-snug text-neutral-900 group-hover:text-brand-700">
                  {l(item, "title")}
                </h3>
                {(() => {
                  const d = normalizeDate(item.publishedAt)
                  if (!d) return null
                  return (
                    <time
                      dateTime={d.toISOString()}
                      className="mt-1 block text-[11px] uppercase tracking-wide text-neutral-500"
                    >
                      {d.toLocaleDateString("vi-VN")}
                    </time>
                  )
                })()}
              </div>
            </Link>
          </li>
          )
        })}
      </ul>
    </section>
  )
}
