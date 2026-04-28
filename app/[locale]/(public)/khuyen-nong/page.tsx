import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { cloudinaryResize } from "@/lib/cloudinary"
import { BLUR_DATA_URL } from "@/lib/seo/blur-placeholder"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { BASE_URL, SITE_NAME, hreflangAlternates, localizedUrl } from "@/lib/seo/site"
import { Section } from "@/components/features/homepage/Section"
import { HomepageBannerSlot } from "@/components/features/homepage/HomepageBannerSlot"
import { SidebarList } from "@/components/features/article/SidebarList"
import { LatestAgricultureList } from "./LatestAgricultureList"
import { mergeByDateDesc } from "../_lib/post-news-merge"

const AGRICULTURE_LIST_SELECT = {
  id: true,
  title: true, title_en: true, title_zh: true, title_ar: true,
  slug: true,
  excerpt: true, excerpt_en: true, excerpt_zh: true, excerpt_ar: true,
  coverImageUrl: true,
  isPinned: true,
  publishedAt: true,
} as const

const PAGE_TITLE = "Khuyến nông"
const PAGE_META_TITLE = "Khuyến nông | Hội Trầm Hương Việt Nam"
const PAGE_META_DESC =
  "Tin tức khuyến nông, hướng dẫn kỹ thuật trồng và chăm sóc cây dó bầu, kiến thức nông học cho người trồng trầm hương."

const getDefaultAgricultureList = unstable_cache(
  async (take: number) =>
    prisma.news.findMany({
      where: {
        isPublished: true,
        OR: [
          { category: "AGRICULTURE" },
          { secondaryCategories: { has: "AGRICULTURE" } },
        ],
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take,
      select: AGRICULTURE_LIST_SELECT,
    }),
  ["khuyen-nong_list_default"],
  { revalidate: 300, tags: ["news", "agriculture"] },
)

const getSidebarFeaturedAgriculture = unstable_cache(
  async () =>
    prisma.news.findMany({
      where: {
        isPublished: true,
        OR: [
          { category: "AGRICULTURE" },
          { secondaryCategories: { has: "AGRICULTURE" } },
        ],
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 6,
      select: {
        id: true,
        title: true, title_en: true, title_zh: true, title_ar: true,
        slug: true, coverImageUrl: true, publishedAt: true, isPinned: true,
      },
    }),
  ["khuyen-nong_sidebar_featured"],
  { revalidate: 600, tags: ["news", "agriculture"] },
)

async function SidebarFeaturedBlock({ title, locale }: { title: string; locale: Locale }) {
  const items = await getSidebarFeaturedAgriculture()
  return <SidebarList title={title} items={items} locale={locale} itemHrefPrefix="/khuyen-nong" />
}

function SidebarFeaturedSkeleton() {
  return (
    <div aria-hidden>
      <div className="mb-4 h-[20px] w-28 border-b-[3px] border-brand-700 bg-neutral-200" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="aspect-16/10 w-[92px] shrink-0 bg-neutral-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-full bg-neutral-100" />
              <div className="h-3 w-3/4 bg-neutral-100" />
              <div className="h-2 w-16 bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export async function generateMetadata() {
  return {
    title: PAGE_META_TITLE,
    description: PAGE_META_DESC,
    alternates: hreflangAlternates("/khuyen-nong"),
  }
}

export const revalidate = 3600

const LIST_PAGE_SIZE = 10
const HERO_COUNT = 4

function formatDate(d: Date | string | null) {
  if (!d) return ""
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default async function AgriculturePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const [locale, tNews] = await Promise.all([
    getLocale() as Promise<Locale>,
    getTranslations("news"),
  ])
  const l = <T extends Record<string, unknown>>(record: T, field: string) =>
    localize(record, field, locale) as string

  const params = await searchParams
  const q = params.q ?? ""
  const isSearch = q.length > 0

  const initialTake = isSearch ? LIST_PAGE_SIZE + 1 : HERO_COUNT + LIST_PAGE_SIZE + 1
  const where = {
    isPublished: true,
    AND: [
      {
        OR: [
          { category: "AGRICULTURE" as const },
          { secondaryCategories: { has: "AGRICULTURE" as const } },
        ],
      },
      ...(q
        ? [
            {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { excerpt: { contains: q, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  }
  const list = isSearch
    ? await prisma.news.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        take: initialTake,
        select: AGRICULTURE_LIST_SELECT,
      })
    : await getDefaultAgricultureList(initialTake)

  // Phase 3.7 round 4 (2026-04): Post curated by admin, newsCategories has AGRICULTURE.
  const memberPosts = isSearch
    ? []
    : await prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          newsCategories: { has: "AGRICULTURE" },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          content: true,
          imageUrls: true,
          coverImageUrl: true,
          createdAt: true,
          author: { select: { name: true, avatarUrl: true } },
        },
      })

  const showHero = !isSearch
  const heroItem = showHero && list[0] ? list[0] : null
  const subHeroItems = showHero ? list.slice(1, HERO_COUNT) : []
  const heroConsumed = showHero ? HERO_COUNT : 0
  // Phase 3.7 round 4 (2026-04): merge Posts vào latest list theo date desc.
  const newsForLatest = list.slice(heroConsumed, heroConsumed + LIST_PAGE_SIZE)
  const initialListItems = mergeByDateDesc(newsForLatest, memberPosts)
  const initialHasMore = list.length > heroConsumed + LIST_PAGE_SIZE

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_META_TITLE,
    description: PAGE_META_DESC,
    url: localizedUrl("/khuyen-nong", locale),
    inLanguage: locale === "vi" ? "vi-VN" : locale === "zh" ? "zh-CN" : locale,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: BASE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: list.length,
      itemListElement: list.slice(0, heroConsumed + LIST_PAGE_SIZE).map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: localizedUrl(`/khuyen-nong/${item.slug}`, locale),
        name: localize(item, "title", locale) as string,
      })),
    },
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }} />

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-10">
        <div className="min-w-0 lg:col-span-9 lg:col-start-1 lg:row-start-1">
          <Section
            title={PAGE_TITLE}
            titleHref="/khuyen-nong"
            rightNav={
              <form method="GET" action="/khuyen-nong" className="flex items-center gap-2">
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Tìm kiếm tin khuyến nông..."
                  className="w-40 border border-neutral-300 bg-white px-2.5 py-1 text-[13px] text-neutral-800 placeholder:text-neutral-400 focus:border-brand-700 focus:outline-none sm:w-56"
                />
                <button
                  type="submit"
                  className="border border-brand-700 bg-brand-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-800"
                >
                  Tìm
                </button>
                {isSearch && (
                  <Link href="/khuyen-nong" className="text-[11px] uppercase tracking-wide text-neutral-500 hover:text-brand-700 hover:underline">
                    ✕
                  </Link>
                )}
              </form>
            }
          >
            {isSearch && (
              <p className="mb-6 -mt-2 text-sm text-neutral-600">
                Kết quả tìm kiếm: <strong className="text-neutral-900">&ldquo;{q}&rdquo;</strong>
              </p>
            )}

            {heroItem && (
              <div className="mb-10">
                <Link href={`/khuyen-nong/${heroItem.slug}`} className="group block lg:grid lg:grid-cols-3 lg:gap-0">
                  <div className="relative aspect-video w-full overflow-hidden bg-neutral-100 lg:col-span-2 lg:aspect-auto">
                    {heroItem.coverImageUrl ? (
                      <Image
                        src={cloudinaryResize(heroItem.coverImageUrl, 1280)}
                        alt={l(heroItem, "title")}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    ) : (
                      <AgarwoodPlaceholder className="h-full w-full" size="xl" shape="square" tone="dark" />
                    )}
                    {heroItem.isPinned && (
                      <span className="absolute left-3 top-3 bg-brand-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                        Nổi bật
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-center bg-neutral-100 p-5 lg:p-7">
                    <h2 className="font-serif-headline text-[20px] font-bold leading-tight text-neutral-900 group-hover:text-brand-700 lg:text-[22px]">
                      {l(heroItem, "title")}
                    </h2>
                    {l(heroItem, "excerpt") && (
                      <p className="mt-3 line-clamp-4 text-[14px] leading-relaxed text-neutral-700 lg:line-clamp-5">
                        <span className="font-bold text-brand-700">VAWA - </span>
                        {l(heroItem, "excerpt")}
                      </p>
                    )}
                    <time className="mt-3 block text-[11px] uppercase tracking-wide text-neutral-500">
                      {formatDate(heroItem.publishedAt)}
                    </time>
                  </div>
                </Link>

                {subHeroItems.length > 0 && (
                  <div className="mt-8 grid gap-6 border-t border-neutral-200 pt-8 sm:grid-cols-3">
                    {subHeroItems.map((item) => (
                      <Link key={item.id} href={`/khuyen-nong/${item.slug}`} className="group block">
                        <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
                          {item.coverImageUrl ? (
                            <Image
                              src={cloudinaryResize(item.coverImageUrl, 480)}
                              alt={l(item, "title")}
                              fill
                              sizes="(max-width: 640px) 100vw, 33vw"
                              className="object-cover"
                              placeholder="blur"
                              blurDataURL={BLUR_DATA_URL}
                            />
                          ) : (
                            <AgarwoodPlaceholder className="h-full w-full" size="md" shape="square" />
                          )}
                        </div>
                        <h3 className="mt-3 line-clamp-3 text-[15px] font-bold leading-snug text-neutral-900 group-hover:text-brand-700">
                          {l(item, "title")}
                        </h3>
                        <time className="mt-1 block text-[11px] uppercase tracking-wide text-neutral-500">
                          {formatDate(item.publishedAt)}
                        </time>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>

        <aside className="mt-10 min-w-0 space-y-8 lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:row-span-2 lg:mt-0 lg:sticky lg:top-16 lg:self-start">
          <Suspense fallback={null}>
            <HomepageBannerSlot position="SIDEBAR" />
          </Suspense>
          <Suspense fallback={<SidebarFeaturedSkeleton />}>
            <SidebarFeaturedBlock title="Khuyến nông nổi bật" locale={locale} />
          </Suspense>
        </aside>

        <div className="mt-10 min-w-0 lg:col-span-9 lg:col-start-1 lg:row-start-2 lg:mt-10">
          {heroItem && (
            <h2 className="mb-5 inline-block border-b-[3px] border-brand-700 pb-1 text-[13px] font-bold uppercase tracking-wider text-neutral-900">
              Tin mới nhất
            </h2>
          )}
          <LatestAgricultureList
            initialItems={initialListItems}
            initialHasMore={initialHasMore}
            locale={locale}
            q={q || undefined}
            offsetStart={heroConsumed + newsForLatest.length}
            pinnedLabel={tNews("pinned")}
            emptyLabel={isSearch ? "Không tìm thấy bài khuyến nông phù hợp" : "Chưa có bài khuyến nông nào"}
            loadingLabel="Đang tải thêm…"
            endLabel="Đã hiển thị tất cả bài khuyến nông"
          />
        </div>
      </div>
    </div>
  )
}
