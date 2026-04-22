import Link from "next/link"
import Image from "next/image"
import {
  getLatestMultimedia,
  type HomepageMultimediaItem,
} from "@/lib/homepage"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { getLocale } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { HomepageBannerSlotV2 } from "./HomepageBannerSlotV2"
import { SectionV2 } from "./SectionV2"

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

export async function MultimediaSectionV2() {
  const [items, locale] = await Promise.all([
    getLatestMultimedia(3),
    getLocale() as Promise<Locale>,
  ])

  if (items.length === 0) return null

  const [side1, side2, main] = items

  return (
    <SectionV2
      title="Multimedia"
      titleHref="/multimedia"
      rightNav={
        <>
          <Link
            href="/multimedia?type=PHOTO_COLLECTION"
            className="hover:text-brand-700"
          >
            Hình ảnh
          </Link>
          <Link
            href="/multimedia?type=VIDEO"
            className="hover:text-brand-700"
          >
            Video
          </Link>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-5 lg:col-span-3">
          {side1 && <SmallItem item={side1} locale={locale} />}
          {side2 && <SmallItem item={side2} locale={locale} />}
        </div>
        <div className="min-w-0 lg:col-span-6">
          {main && <MainItem item={main} locale={locale} />}
        </div>
        <div className="min-w-0 lg:col-span-3">
          <HomepageBannerSlotV2 position="SIDEBAR" />
        </div>
      </div>
    </SectionV2>
  )
}

function SmallItem({
  item,
  locale,
}: {
  item: HomepageMultimediaItem
  locale: Locale
}) {
  const title = localize(item, "title", locale) as string
  const cover = coverOf(item)
  return (
    <Link href={`/multimedia/${item.slug}`} className="group block">
      <div className="relative aspect-video w-full overflow-hidden bg-brand-100">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            sizes="(max-width: 1024px) 50vw, 18vw"
            className="object-cover"
          />
        ) : (
          <AgarwoodPlaceholder
            className="aspect-video w-full"
            size="sm"
            shape="square"
            tone="light"
          />
        )}
        {item.type === "VIDEO" && <VideoBadge />}
      </div>
      <h4 className="mt-2 text-[14px] font-bold leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
        {title}
      </h4>
    </Link>
  )
}

function MainItem({
  item,
  locale,
}: {
  item: HomepageMultimediaItem
  locale: Locale
}) {
  const title = localize(item, "title", locale) as string
  const excerpt = localize(item, "excerpt", locale) as string | null
  const cover = coverOf(item)
  return (
    <Link href={`/multimedia/${item.slug}`} className="group block">
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
        {item.type === "VIDEO" && <VideoBadge large />}
      </div>
      <h3 className="mt-3 text-xl font-bold leading-tight text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
        {title}
      </h3>
      {excerpt && (
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-neutral-700">
          {excerpt}
        </p>
      )}
    </Link>
  )
}

function VideoBadge({ large = false }: { large?: boolean }) {
  const size = large ? "h-14 w-14" : "h-10 w-10"
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        className={`${size} flex items-center justify-center rounded-full bg-black/60 text-white`}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-1/2 w-1/2">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  )
}
