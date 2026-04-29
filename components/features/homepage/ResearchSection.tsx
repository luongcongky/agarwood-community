import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import {
  getLatestResearchNews,
  type HomepageNewsItem,
} from "@/lib/homepage"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { newsCoverImage } from "@/lib/multimedia-from-news"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { Section } from "./Section"
import { HomepageBannerSlot } from "./HomepageBannerSlot"

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
 * Phase 3.7 round 4 (2026-04): redesign 3 cột theo yêu cầu khách hàng
 * (mock VOV/VTV-style political section). Layout giống MultimediaSection
 * nhưng với 1 hero ở cột 1 + 3 sub-hero ở cột 2 + banner SIDEBAR ở cột 3.
 *
 * SIDEBAR banner dùng chung position với MultimediaSection — cùng pool ad
 * portrait 2:3, có thể xuất hiện ở cả 2 chỗ trên 1 lần render homepage.
 * Carousel rotate độc lập nên hiếm khi thấy cùng 1 frame.
 */
export async function ResearchSection() {
  const [items, t, locale] = await Promise.all([
    getLatestResearchNews(5),
    getTranslations("homepage"),
    getLocale() as Promise<Locale>,
  ])

  if (items.length === 0) return null

  const hero = items[0]
  const subs = items.slice(1, 5)

  return (
    <Section title={t("researchTitle")} titleHref="/nghien-cuu">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Col 1 — Hero: image top + title + excerpt + meta */}
        <div className="min-w-0 lg:col-span-5">
          <HeroCard item={hero} locale={locale} />
        </div>

        {/* Col 2 — 3 sub-hero items, image left + title right */}
        {subs.length > 0 && (
          <div className="min-w-0 space-y-5 lg:col-span-4">
            {subs.map((item) => (
              <SubHeroItem key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}

        {/* Col 3 — banner SIDEBAR (2:3 portrait). Tự ẩn nếu không có banner
            ACTIVE; cột để trống là acceptable (grid không collapse). */}
        <div className="min-w-0 lg:col-span-3">
          <HomepageBannerSlot slot="HOMEPAGE_RESEARCH_SIDEBAR" />
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
    <Link href={`/nghien-cuu/${item.slug}`} className="group block">
      <div className="relative aspect-video w-full overflow-hidden bg-brand-100">
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
      <h3 className="mt-3 text-lg font-bold leading-tight text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
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

function SubHeroItem({
  item,
  locale,
}: {
  item: HomepageNewsItem
  locale: Locale
}) {
  const title = localize(item, "title", locale) as string
  const cover = newsCoverImage(item)
  return (
    <Link href={`/nghien-cuu/${item.slug}`} className="group flex gap-3">
      <div className="relative aspect-4/3 w-28 shrink-0 overflow-hidden bg-brand-100 sm:w-32">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            sizes="128px"
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
        <h3 className="line-clamp-3 text-[14px] font-bold leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
          {title}
        </h3>
        <div className="mt-1.5">
          <TimeMeta date={item.publishedAt} locale={locale} />
        </div>
      </div>
    </Link>
  )
}
