import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import type { PostCategory, NewsCategory } from "@prisma/client"
import { getMergedFeed, type MergedFeedItem } from "@/lib/homepage"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { ThumbnailCard } from "./ThumbnailCard"
import { Section } from "./Section"

const BCP47: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-GB",
  zh: "zh-CN",
  ar: "ar",
}

function fmtDate(d: Date | string | null): string {
  if (!d) return ""
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  })
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

function localizedTitle(item: MergedFeedItem, locale: Locale): string {
  return (localize(item, "title", locale) as string) || ""
}

export async function PostsSection({
  category,
  newsCategory,
  title,
  emptyText,
  variant = "grid",
}: {
  /** Post category — bài user feed (NEWS / PRODUCT). */
  category: PostCategory
  /** News category gộp chung — admin tin BUSINESS hoặc PRODUCT đi cùng
   *  Post tương ứng. Q0=C decision (Phase 3.3 2026-04). */
  newsCategory: NewsCategory
  title: string
  emptyText: string
  /** "grid" = 4-col thumbnail wall (default).
   *  "feature-list" = 2 featured cards + 4 text-only list items (3 col).
   *  "hero-list" = 1 big hero left + 3 side-thumb items right (2 col).
   *  "column-feature" = 1 hero + 3 side-thumb stack vertically — design cho
   *  cột hẹp (col-span-7 trong grid 12-col).
   *  "column-grid" = 2-col thumbnail grid (3 hàng = 6 items) — design cho
   *  cột hẹp (col-span-5). 2 variant này dùng cho row "tin DN || tin SP"
   *  song song trên trang chủ — KH yêu cầu đa dạng bố cục (2026-04-29). */
  variant?: "grid" | "feature-list" | "hero-list" | "column-feature" | "column-grid"
}) {
  const take =
    variant === "feature-list" ? 6
      : variant === "hero-list" ? 5
      : variant === "column-feature" ? 5
      : variant === "column-grid" ? 8
      : 8
  const [items] = await Promise.all([
    getMergedFeed(category, newsCategory, take),
    getTranslations("homepage"),
  ])
  const locale = (await getLocale()) as Locale
  // Title click: feed Posts là phần lớn nội dung user-generated → /feed?category
  // mở đúng tab. Admin News rải rác vào trong list nhưng không có "see all"
  // page chung — user click từng card route riêng. Trade-off: see-all chỉ
  // hiển thị Post nguồn, nhưng đa số bài là Post nên acceptable.
  const titleHref =
    category === "NEWS" || category === "PRODUCT"
      ? `/feed?category=${category}`
      : "/feed"

  if (items.length === 0) {
    return (
      <Section title={title} titleHref={titleHref}>
        <div className="border border-brand-200 bg-white p-12 text-center italic text-brand-500">
          {emptyText}
        </div>
      </Section>
    )
  }

  if (variant === "feature-list") {
    return <FeatureListLayout items={items} title={title} locale={locale} titleHref={titleHref} />
  }

  if (variant === "hero-list") {
    return <HeroListLayout items={items} title={title} locale={locale} titleHref={titleHref} />
  }

  if (variant === "column-feature") {
    return <ColumnFeatureLayout items={items} title={title} locale={locale} titleHref={titleHref} />
  }

  if (variant === "column-grid") {
    return <ColumnGridLayout items={items} title={title} locale={locale} titleHref={titleHref} />
  }

  return (
    <Section title={title} titleHref={titleHref}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((it) => (
          <ThumbnailCard
            key={it.id}
            href={it.href}
            coverUrl={it.coverUrl}
            title={localizedTitle(it, locale)}
            meta={fmtDate(it.date)}
          />
        ))}
      </div>
    </Section>
  )
}

/** Variant `column-feature`: 1 hero card top + 3 SideThumb item stack dọc.
 *  Dùng cho cột narrower trong layout side-by-side (KH yêu cầu 2026-04-29). */
function ColumnFeatureLayout({
  items,
  title,
  locale,
  titleHref,
}: {
  items: MergedFeedItem[]
  title: string
  locale: Locale
  titleHref: string
}) {
  const [main, ...rest] = items
  const list = rest.slice(0, 4)
  return (
    <Section title={title} titleHref={titleHref}>
      <div className="space-y-5">
        {main && <HeroCard item={main} locale={locale} />}
        <div className="space-y-4 border-t border-brand-100 pt-4">
          {list.map((it) => (
            <SideThumbItem key={it.id} item={it} locale={locale} />
          ))}
        </div>
      </div>
    </Section>
  )
}

/** Variant `column-grid`: 2-col grid 6 thumbnail (3 hàng). Cùng vibe carousel
 *  thương mại — đặt cạnh ColumnFeatureLayout tạo tương phản editorial/grid. */
function ColumnGridLayout({
  items,
  title,
  locale,
  titleHref,
}: {
  items: MergedFeedItem[]
  title: string
  locale: Locale
  titleHref: string
}) {
  return (
    <Section title={title} titleHref={titleHref}>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => (
          <ThumbnailCard
            key={it.id}
            href={it.href}
            coverUrl={it.coverUrl}
            title={localizedTitle(it, locale)}
            meta={fmtDate(it.date)}
          />
        ))}
      </div>
    </Section>
  )
}

function FeatureListLayout({
  items,
  title,
  locale,
  titleHref,
}: {
  items: MergedFeedItem[]
  title: string
  locale: Locale
  titleHref: string
}) {
  const [feat1, feat2, ...rest] = items
  const list = rest.slice(0, 4)

  return (
    <Section title={title} titleHref={titleHref}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0">
          {/* Card đầu nhận priority — đây là LCP candidate khi NewsSection
              hero đã load xong (audit 2026-04: LCP element = ảnh tin tức
              của section "Tin hội viên" = feat1). */}
          {feat1 && <FeaturedCard item={feat1} locale={locale} priority />}
        </div>
        <div className="min-w-0">
          {feat2 && <FeaturedCard item={feat2} locale={locale} />}
        </div>
        <div className="min-w-0 space-y-5">
          {list.map((it) => (
            <ListItem key={it.id} item={it} locale={locale} />
          ))}
        </div>
      </div>
    </Section>
  )
}

function HeroListLayout({
  items,
  title,
  locale,
  titleHref,
}: {
  items: MergedFeedItem[]
  title: string
  locale: Locale
  titleHref: string
}) {
  const [main, ...rest] = items
  const list = rest.slice(0, 4)

  return (
    <Section title={title} titleHref={titleHref}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          {/* Hero đầu của hero-list layout = LCP candidate khi section này
              ở mid-fold. Section bên dưới (Sản phẩm) thường có hero lớn
              hơn → thêm priority để ưu tiên fetch khi user scroll. */}
          {main && <HeroCard item={main} locale={locale} priority />}
        </div>
        <div className="min-w-0 space-y-4">
          {list.map((it) => (
            <SideThumbItem key={it.id} item={it} locale={locale} />
          ))}
        </div>
      </div>
    </Section>
  )
}

function HeroCard({
  item,
  locale,
  priority = false,
}: {
  item: MergedFeedItem
  locale: Locale
  /** Truyền `true` cho hero card đầu tiên trong trang → Next.js sẽ
   *  `fetchPriority="high"` + skip lazy-load. Một page chỉ nên có 1 ảnh
   *  priority — đó phải là LCP candidate lớn nhất above-the-fold. */
  priority?: boolean
}) {
  const title = localizedTitle(item, locale)
  return (
    <Link href={item.href} className="group block">
      <div className="relative aspect-video w-full overflow-hidden bg-brand-100">
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt={title}
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="xl" shape="square" />
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 text-xl font-bold leading-tight text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
        {title}
      </h3>
      <div className="mt-2">
        <TimeMeta date={item.date} locale={locale} />
      </div>
    </Link>
  )
}

function SideThumbItem({
  item,
  locale,
}: {
  item: MergedFeedItem
  locale: Locale
}) {
  const title = localizedTitle(item, locale)
  return (
    <Link href={item.href} className="group flex gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-3 text-[15px] font-bold leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
          {title}
        </h3>
        <div className="mt-1.5">
          <TimeMeta date={item.date} locale={locale} />
        </div>
      </div>
      <div className="relative h-20 w-28 shrink-0 overflow-hidden bg-brand-100">
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt=""
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            sizes="112px"
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
    </Link>
  )
}

function FeaturedCard({
  item,
  locale,
  priority = false,
}: {
  item: MergedFeedItem
  locale: Locale
  priority?: boolean
}) {
  const title = localizedTitle(item, locale)
  return (
    <Link href={item.href} className="group block">
      <div className="relative aspect-video w-full overflow-hidden bg-brand-100">
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt={title}
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            sizes="(max-width: 1024px) 50vw, 28vw"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="lg" shape="square" />
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 text-[16px] font-bold leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
        {title}
      </h3>
      <div className="mt-2">
        <TimeMeta date={item.date} locale={locale} />
      </div>
    </Link>
  )
}

function ListItem({
  item,
  locale,
}: {
  item: MergedFeedItem
  locale: Locale
}) {
  const title = localizedTitle(item, locale)
  return (
    <Link href={item.href} className="group block">
      <h3
        style={{ fontWeight: 400 }}
        className="text-[15px] leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline"
      >
        {title}
      </h3>
      <div className="mt-1.5">
        <TimeMeta date={item.date} locale={locale} />
      </div>
    </Link>
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
