import Link from "next/link"
import Image from "next/image"
import {
  getLatestMultimedia,
  type HomepageMultimediaItem,
} from "@/lib/homepage"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"

/**
 * Section 2b — Đa phương tiện (V1 homepage, modern template).
 *
 * Hiển thị 3 item đa phương tiện mới nhất (photo collection + video) dưới
 * dạng grid 3 cột với card aesthetic V1 (rounded-xl, shadow, hover zoom).
 * Reuse fetcher getLatestMultimedia từ lib/homepage.ts (đã được V2 dùng).
 */

function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
}

function coverOf(item: HomepageMultimediaItem): string | null {
  if (item.coverImageUrl) return item.coverImageUrl
  if (item.type === "VIDEO" && item.youtubeId) return youtubeThumb(item.youtubeId)
  if (item.type === "PHOTO_COLLECTION" && item.imageUrls.length > 0) {
    return item.imageUrls[0]
  }
  return null
}

export async function MultimediaSection() {
  const [items, t, locale] = await Promise.all([
    getLatestMultimedia(3),
    getTranslations("homepage"),
    getLocale() as Promise<Locale>,
  ])

  if (items.length === 0) return null

  return (
    <section className="bg-brand-50/85 backdrop-blur-[2px] py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              {t("multimediaTitle")}
            </h2>
            <p className="mt-1 text-sm text-brand-500">
              {t("multimediaSubtitle")}
            </p>
          </div>
          <Link
            href="/multimedia"
            className="hidden text-sm font-medium text-brand-600 underline underline-offset-4 hover:text-brand-800 sm:inline-block"
          >
            {t("viewAll")}
          </Link>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MultimediaCard
              key={item.id}
              item={item}
              locale={locale}
              videoBadge={t("multimediaVideoBadge")}
              photoBadge={t("multimediaPhotoBadge")}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function MultimediaCard({
  item,
  locale,
  videoBadge,
  photoBadge,
}: {
  item: HomepageMultimediaItem
  locale: Locale
  videoBadge: string
  photoBadge: string
}) {
  const title = localize(item, "title", locale) as string
  const excerpt = localize(item, "excerpt", locale) as string | null
  const cover = coverOf(item)
  const isVideo = item.type === "VIDEO"
  const photoCount =
    item.type === "PHOTO_COLLECTION" ? item.imageUrls.length : 0

  return (
    <Link
      href={`/multimedia/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative aspect-16/10 w-full overflow-hidden bg-brand-100">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="lg" shape="square" />
        )}

        {/* Type badge — góc trên trái */}
        <span
          className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow ${
            isVideo ? "bg-red-600" : "bg-brand-700"
          }`}
        >
          {isVideo ? `▶ ${videoBadge}` : `📷 ${photoBadge}`}
        </span>

        {/* Photo count pill — góc dưới phải, chỉ cho photo collection */}
        {!isVideo && photoCount > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
            {photoCount} ảnh
          </span>
        )}

        {/* Play overlay icon — cho video, hiển thị khi hover */}
        {isVideo && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div
              aria-hidden
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-brand-900 shadow-lg"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-brand-900 group-hover:text-brand-700">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-brand-600">
            {excerpt}
          </p>
        )}
      </div>
    </Link>
  )
}
