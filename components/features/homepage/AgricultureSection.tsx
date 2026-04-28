import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import {
  getLatestAgricultureNews,
  type HomepageNewsItem,
} from "@/lib/homepage"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { newsCoverImage } from "@/lib/multimedia-from-news"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { Section } from "./Section"

const BCP47: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-GB",
  zh: "zh-CN",
  ar: "ar",
}

function timeAgo(date: Date | string | null, locale: Locale): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const rtf = new Intl.RelativeTimeFormat(BCP47[locale], { numeric: "auto" })
  if (minutes < 60) return rtf.format(-Math.max(1, minutes), "minute")
  if (hours < 24) return rtf.format(-hours, "hour")
  if (days < 7) return rtf.format(-days, "day")
  return d.toLocaleDateString(BCP47[locale], {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })
}

/**
 * Phase 3.7 round 4 (2026-04): section "Tin khuyến nông" 3 cột — yêu cầu
 * khách hàng (mock báo điện tử style):
 *  - Col 1 (5 col): 1 hero — image lớn + title + excerpt
 *  - Col 2 (4 col): 2 sub-hero — image top + title below, stacked
 *  - Col 3 (3 col): 4 small items — thumb trái + title phải, stacked
 *
 * Total fetch 7 items (1 + 2 + 4). Filter News.category=AGRICULTURE; click
 * route /khuyen-nong/[slug].
 */
export async function AgricultureSection() {
  const [items, t, locale] = await Promise.all([
    getLatestAgricultureNews(7),
    getTranslations("homepage"),
    getLocale() as Promise<Locale>,
  ])

  // Layout 3 cột (1 hero + 2 mid + 4 small) cần đủ 7 bài để render đầy.
  // Thiếu bất kỳ slot nào → section sparse trống cột → ẩn hoàn toàn cho gọn.
  if (items.length < 7) return null

  const hero = items[0]
  const mids = items.slice(1, 3)
  const smalls = items.slice(3, 7)

  return (
    <Section title={t("agricultureTitle")} titleHref="/khuyen-nong">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Col 1 — Hero lớn */}
        <div className="min-w-0 lg:col-span-5">
          <HeroCard item={hero} locale={locale} />
        </div>

        {/* Col 2 — 2 sub-hero stacked, image top + title below */}
        <div className="min-w-0 space-y-5 lg:col-span-4">
          {mids.map((item) => (
            <MidCard key={item.id} item={item} locale={locale} />
          ))}
        </div>

        {/* Col 3 — 4 small items, thumb left + title right */}
        <div className="min-w-0 space-y-4 lg:col-span-3">
          {smalls.map((item) => (
            <SmallItem key={item.id} item={item} locale={locale} />
          ))}
        </div>
      </div>
    </Section>
  )
}

function TimeMeta({
  date,
  locale,
}: {
  date: Date | string | null
  locale: Locale
}) {
  if (!date) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
      <Clock className="h-3 w-3" aria-hidden="true" />
      {timeAgo(date, locale)}
    </span>
  )
}

function HeroCard({
  item,
  locale,
}: {
  item: HomepageNewsItem
  locale: Locale
}) {
  const title = localize(item, "title", locale) as string
  const excerpt = localize(item, "excerpt", locale) as string | null
  const cover = newsCoverImage(item)
  return (
    <Link href={`/khuyen-nong/${item.slug}`} className="group block">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-brand-100">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="xl" shape="square" />
        )}
      </div>
      <h3 className="mt-3 text-xl font-bold leading-tight text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
        {title}
      </h3>
      {excerpt && (
        <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-neutral-700">
          {excerpt}
        </p>
      )}
      <div className="mt-2">
        <TimeMeta date={item.publishedAt} locale={locale} />
      </div>
    </Link>
  )
}

function MidCard({
  item,
  locale,
}: {
  item: HomepageNewsItem
  locale: Locale
}) {
  const title = localize(item, "title", locale) as string
  const cover = newsCoverImage(item)
  return (
    <Link href={`/khuyen-nong/${item.slug}`} className="group block">
      <div className="relative aspect-video w-full overflow-hidden bg-brand-100">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 30vw"
            className="object-cover"
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="md" shape="square" />
        )}
      </div>
      <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
        {title}
      </h3>
      <div className="mt-1.5">
        <TimeMeta date={item.publishedAt} locale={locale} />
      </div>
    </Link>
  )
}

function SmallItem({
  item,
  locale,
}: {
  item: HomepageNewsItem
  locale: Locale
}) {
  const title = localize(item, "title", locale) as string
  const cover = newsCoverImage(item)
  return (
    <Link href={`/khuyen-nong/${item.slug}`} className="group flex gap-3">
      <div className="relative aspect-square w-20 shrink-0 overflow-hidden bg-brand-100 sm:w-24">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <AgarwoodPlaceholder
            className="h-full w-full"
            size="sm"
            shape="square"
            tone="light"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-3 text-[13px] font-bold leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
          {title}
        </h3>
      </div>
    </Link>
  )
}
