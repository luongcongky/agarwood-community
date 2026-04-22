import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import {
  getLatestResearchNews,
  type HomepageNewsItem,
} from "@/lib/homepage"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { SectionV2 } from "./SectionV2"

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

export async function ResearchSectionV2() {
  const [items, t, locale] = await Promise.all([
    getLatestResearchNews(4),
    getTranslations("homepage"),
    getLocale() as Promise<Locale>,
  ])

  if (items.length === 0) return null

  const main = items[0]
  const list = items.slice(1, 4)

  return (
    <SectionV2 title={t("researchTitle")} titleHref="/nghien-cuu">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left — 4 text-only items */}
        {list.length > 0 && (
          <div className="min-w-0 space-y-5 lg:col-span-5">
            {list.map((item) => (
              <ListItem key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}

        {/* Right — main card horizontal: photo + text */}
        <div className="min-w-0 lg:col-span-7">
          <MainCard item={main} locale={locale} />
        </div>
      </div>
    </SectionV2>
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

function ListItem({
  item,
  locale,
}: {
  item: HomepageNewsItem
  locale: Locale
}) {
  const title = localize(item, "title", locale) as string
  return (
    <Link href={`/nghien-cuu/${item.slug}`} className="group block">
      <h3
        style={{ fontWeight: 400 }}
        className="text-[15px] leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline"
      >
        {title}
      </h3>
      <div className="mt-1.5">
        <TimeMeta date={item.publishedAt} locale={locale} />
      </div>
    </Link>
  )
}

function MainCard({
  item,
  locale,
}: {
  item: HomepageNewsItem
  locale: Locale
}) {
  const title = localize(item, "title", locale) as string
  const excerpt = localize(item, "excerpt", locale) as string | null
  return (
    <Link
      href={`/nghien-cuu/${item.slug}`}
      className="group grid gap-4 sm:grid-cols-2 sm:gap-5"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-brand-100">
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={title}
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 35vw"
            className="object-cover"
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="lg" shape="square" />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-xl font-bold leading-tight text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-neutral-700">
            {excerpt}
          </p>
        )}
        <div className="mt-3">
          <TimeMeta date={item.publishedAt} locale={locale} />
        </div>
      </div>
    </Link>
  )
}
