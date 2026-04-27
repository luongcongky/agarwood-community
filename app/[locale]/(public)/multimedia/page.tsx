import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { getLocale } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { newsToMultimedia } from "@/lib/multimedia-from-news"

export const revalidate = 300

const TYPE_LABELS = {
  PHOTO_COLLECTION: "Bộ sưu tập ảnh",
  VIDEO: "Video",
} as const

function isValidType(t?: string): t is keyof typeof TYPE_LABELS {
  return t === "PHOTO_COLLECTION" || t === "VIDEO"
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}): Promise<Metadata> {
  const sp = await searchParams
  const title = isValidType(sp.type)
    ? `${TYPE_LABELS[sp.type]} — Multimedia`
    : "Multimedia"
  return {
    title,
    description:
      "Bộ sưu tập hình ảnh + video của Hội Trầm Hương Việt Nam — hoạt động, sự kiện, sản phẩm.",
    alternates: { canonical: "/multimedia" },
  }
}

function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
}

export default async function MultimediaListingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const sp = await searchParams
  const filterType = isValidType(sp.type) ? sp.type : null
  const locale = (await getLocale()) as Locale

  // Phase 3.7 round 4 (2026-04): bảng Multimedia đã merge vào News (template
  // PHOTO/VIDEO). Đọc từ News, adapt qua newsToMultimedia() để giữ shape
  // mà UI cũ đang dùng.
  const newsTemplateFilter =
    filterType === "PHOTO_COLLECTION"
      ? "PHOTO"
      : filterType === "VIDEO"
        ? "VIDEO"
        : null
  const newsRows = await prisma.news.findMany({
    where: {
      isPublished: true,
      template: newsTemplateFilter
        ? newsTemplateFilter
        : { in: ["PHOTO", "VIDEO"] },
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 24,
    select: {
      id: true,
      slug: true,
      title: true,
      title_en: true,
      title_zh: true,
      title_ar: true,
      excerpt: true,
      excerpt_en: true,
      excerpt_zh: true,
      excerpt_ar: true,
      coverImageUrl: true,
      template: true,
      gallery: true,
      publishedAt: true,
    },
  })

  const items = newsRows.flatMap((n) => {
    const mapped = newsToMultimedia(n)
    return mapped ? [mapped] : []
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-4 text-xs text-neutral-500">
        <Link href="/" className="hover:text-brand-700">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">Multimedia</span>
        {filterType && (
          <>
            <span className="mx-2">/</span>
            <span className="text-neutral-800">{TYPE_LABELS[filterType]}</span>
          </>
        )}
      </nav>

      <header className="mb-6 border-b-2 border-brand-700 pb-3">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-brand-900 lg:text-4xl">
          {filterType ? TYPE_LABELS[filterType] : "Multimedia"}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Hình ảnh hoạt động + video giới thiệu — Hội Trầm Hương Việt Nam.
        </p>
      </header>

      {/* Filter chips */}
      <nav
        aria-label="Lọc theo loại"
        className="mb-6 flex flex-wrap items-center gap-2 text-sm"
      >
        <FilterChip active={!filterType} href="/multimedia" label="Tất cả" />
        <FilterChip
          active={filterType === "PHOTO_COLLECTION"}
          href="/multimedia?type=PHOTO_COLLECTION"
          label="Hình ảnh"
        />
        <FilterChip
          active={filterType === "VIDEO"}
          href="/multimedia?type=VIDEO"
          label="Video"
        />
      </nav>

      {items.length === 0 ? (
        <div className="border border-dashed border-neutral-300 p-12 text-center italic text-neutral-500">
          Chưa có nội dung ở mục này.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const title = localize(item, "title", locale) as string
            const excerpt = localize(item, "excerpt", locale) as string | null
            const cover =
              item.coverImageUrl ??
              (item.type === "VIDEO" && item.youtubeId
                ? youtubeThumb(item.youtubeId)
                : item.type === "PHOTO_COLLECTION" && item.imageUrls.length > 0
                  ? item.imageUrls[0]
                  : null)
            return (
              <Link
                key={item.id}
                href={`/multimedia/${item.slug}`}
                className="group block"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-brand-100">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={title}
                      fill
                      placeholder="blur"
                      blurDataURL={BRAND_BLUR_DATA_URL}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <AgarwoodPlaceholder
                      className="h-full w-full"
                      size="lg"
                      shape="square"
                    />
                  )}
                  {item.type === "VIDEO" && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div
                        aria-hidden
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-1/2 w-1/2"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {item.type === "PHOTO_COLLECTION" && item.imageUrls.length > 1 && (
                    <span className="absolute right-2 bottom-2 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {item.imageUrls.length} ảnh
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-brand-700">
                  {TYPE_LABELS[item.type]}
                </p>
                <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-tight text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
                  {title}
                </h3>
                {excerpt && (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-700">
                    {excerpt}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  href,
  label,
}: {
  active: boolean
  href: string
  label: string
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 font-semibold transition-colors ${
        active
          ? "border-brand-700 bg-brand-700 text-white"
          : "border-neutral-300 text-neutral-600 hover:border-brand-500 hover:text-brand-700"
      }`}
    >
      {label}
    </Link>
  )
}
