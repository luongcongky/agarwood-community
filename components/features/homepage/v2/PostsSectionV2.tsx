import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import type { PostCategory } from "@prisma/client"
import { getLatestPostsByCategory, type HomepagePost } from "@/lib/homepage"
import { getLocale, getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/config"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { ThumbnailCardV2 } from "./ThumbnailCardV2"
import { SectionV2 } from "./SectionV2"

const BCP47: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-GB",
  zh: "zh-CN",
  ar: "ar",
}

function getCover(post: HomepagePost): string | null {
  if (post.imageUrls && post.imageUrls.length > 0) return post.imageUrls[0]
  const m = post.content.match(/https:\/\/res\.cloudinary\.com\/[^"'\s)]+/)
  return m ? m[0] : null
}

function cardTitle(post: HomepagePost, n = 80): string {
  if (post.title) return post.title
  return post.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n)
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

export async function PostsSectionV2({
  category,
  title,
  emptyText,
  variant = "grid",
}: {
  category: PostCategory
  title: string
  emptyText: string
  /** "grid" = 4-col thumbnail wall (default).
   *  "feature-list" = 2 featured cards + 4 text-only list items (3 col).
   *  "hero-list" = 1 big hero left + 3 side-thumb items right (2 col) */
  variant?: "grid" | "feature-list" | "hero-list"
}) {
  const take =
    variant === "feature-list" ? 6 : variant === "hero-list" ? 5 : 8
  const [posts] = await Promise.all([
    getLatestPostsByCategory(category, take),
    getTranslations("homepage"),
  ])
  const locale = (await getLocale()) as Locale

  if (posts.length === 0) {
    return (
      <SectionV2 title={title} titleHref="/feed">
        <div className="border border-brand-200 bg-white p-12 text-center italic text-brand-500">
          {emptyText}
        </div>
      </SectionV2>
    )
  }

  if (variant === "feature-list") {
    return <FeatureListLayout posts={posts} title={title} locale={locale} />
  }

  if (variant === "hero-list") {
    return <HeroListLayout posts={posts} title={title} locale={locale} />
  }

  return (
    <SectionV2 title={title} titleHref="/feed">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {posts.map((p) => (
          <ThumbnailCardV2
            key={p.id}
            href={`/feed?post=${p.id}`}
            coverUrl={getCover(p)}
            title={cardTitle(p)}
            meta={fmtDate(p.createdAt)}
          />
        ))}
      </div>
    </SectionV2>
  )
}

function FeatureListLayout({
  posts,
  title,
  locale,
}: {
  posts: HomepagePost[]
  title: string
  locale: Locale
}) {
  const [feat1, feat2, ...rest] = posts
  const list = rest.slice(0, 4)

  return (
    <SectionV2 title={title} titleHref="/feed">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0">
          {feat1 && <FeaturedCard post={feat1} locale={locale} />}
        </div>
        <div className="min-w-0">
          {feat2 && <FeaturedCard post={feat2} locale={locale} />}
        </div>
        <div className="min-w-0 space-y-5">
          {list.map((p) => (
            <ListItem key={p.id} post={p} locale={locale} />
          ))}
        </div>
      </div>
    </SectionV2>
  )
}

function HeroListLayout({
  posts,
  title,
  locale,
}: {
  posts: HomepagePost[]
  title: string
  locale: Locale
}) {
  const [main, ...rest] = posts
  const list = rest.slice(0, 4)

  return (
    <SectionV2 title={title} titleHref="/feed">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          {main && <HeroCard post={main} locale={locale} />}
        </div>
        <div className="min-w-0 space-y-4">
          {list.map((p) => (
            <SideThumbItem key={p.id} post={p} locale={locale} />
          ))}
        </div>
      </div>
    </SectionV2>
  )
}

function HeroCard({
  post,
  locale,
}: {
  post: HomepagePost
  locale: Locale
}) {
  const cover = getCover(post)
  const title = cardTitle(post)
  return (
    <Link href={`/feed?post=${post.id}`} className="group block">
      <div className="relative aspect-video w-full overflow-hidden bg-brand-100">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="xl" shape="square" />
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 text-xl font-bold leading-tight text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
        {title}
      </h3>
      <div className="mt-2">
        <TimeMeta date={post.createdAt} locale={locale} />
      </div>
    </Link>
  )
}

function SideThumbItem({
  post,
  locale,
}: {
  post: HomepagePost
  locale: Locale
}) {
  const cover = getCover(post)
  const title = cardTitle(post)
  return (
    <Link href={`/feed?post=${post.id}`} className="group flex gap-3">
      <div className="min-w-0 flex-1">
        <h3
          style={{ fontWeight: 400 }}
          className="line-clamp-3 text-[15px] leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline"
        >
          {title}
        </h3>
        <div className="mt-1.5">
          <TimeMeta date={post.createdAt} locale={locale} />
        </div>
      </div>
      <div className="relative h-20 w-28 shrink-0 overflow-hidden bg-brand-100">
        {cover ? (
          <Image
            src={cover}
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
  post,
  locale,
}: {
  post: HomepagePost
  locale: Locale
}) {
  const cover = getCover(post)
  const title = cardTitle(post)
  return (
    <Link href={`/feed?post=${post.id}`} className="group block">
      <div className="relative aspect-video w-full overflow-hidden bg-brand-100">
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            sizes="(max-width: 1024px) 50vw, 28vw"
            className="object-cover"
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="lg" shape="square" />
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 text-[16px] font-bold leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
        {title}
      </h3>
      <div className="mt-2">
        <TimeMeta date={post.createdAt} locale={locale} />
      </div>
    </Link>
  )
}

function ListItem({
  post,
  locale,
}: {
  post: HomepagePost
  locale: Locale
}) {
  const title = cardTitle(post)
  return (
    <Link href={`/feed?post=${post.id}`} className="group block">
      <h3
        style={{ fontWeight: 400 }}
        className="text-[15px] leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline"
      >
        {title}
      </h3>
      <div className="mt-1.5">
        <TimeMeta date={post.createdAt} locale={locale} />
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
