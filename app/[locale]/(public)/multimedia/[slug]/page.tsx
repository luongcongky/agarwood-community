import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getLocale } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { MultimediaLightbox } from "@/components/features/multimedia/MultimediaLightbox"
import { newsToMultimedia, newsCoverImage } from "@/lib/multimedia-from-news"
import { CommentsSection } from "@/components/features/comments/CommentsSection"
import { Section } from "@/components/features/homepage/Section"
import { HomepageBannerSlot } from "@/components/features/homepage/HomepageBannerSlot"
import { SidebarList } from "@/components/features/article/SidebarList"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { cloudinaryResize } from "@/lib/cloudinary"
import { CopyLinkButton } from "./CopyLinkButton"

export const revalidate = 300

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoitramhuong.vn"

const NEWS_SELECT = {
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
  isPublished: true,
} as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const news = await prisma.news.findUnique({ where: { slug }, select: NEWS_SELECT })
  if (!news) return { title: "Không tìm thấy" }
  const item = newsToMultimedia(news)
  if (!item) return { title: "Không tìm thấy" }
  return {
    title: item.title,
    description: item.excerpt ?? undefined,
    alternates: { canonical: `/multimedia/${slug}` },
    openGraph: {
      title: item.title,
      description: item.excerpt ?? undefined,
      images: item.coverImageUrl
        ? [{ url: item.coverImageUrl }]
        : item.youtubeId
          ? [{ url: `https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg` }]
          : undefined,
    },
  }
}

export default async function MultimediaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [locale, session] = await Promise.all([
    getLocale() as Promise<Locale>,
    auth(),
  ])

  // Phase 3.7 round 4 (2026-04): đọc từ News (template=PHOTO|VIDEO).
  // Bảng Multimedia đã merge sang News qua migration script.
  // 404 nếu News không tồn tại / chưa publish / template=NORMAL (vì /multimedia
  // không phải route cho text article — bài đó dùng /tin-tuc/[slug]).
  const news = await prisma.news.findUnique({ where: { slug }, select: NEWS_SELECT })
  if (!news || !news.isPublished) notFound()
  const item = newsToMultimedia(news)
  if (!item) notFound()

  const title = localize(item, "title", locale) as string
  const excerpt = localize(item, "excerpt", locale) as string | null
  const l = <T extends Record<string, unknown>>(rec: T, field: string) =>
    localize(rec, field, locale) as string

  // Phase 3.7 round 4 (2026-04): related + sidebar pinned/recent — fetch
  // song song. Sidebar pattern khớp /vi/tin-tuc/[slug] (banner + 2 list).
  const SIDEBAR_LIST_SELECT = {
    id: true,
    slug: true,
    title: true,
    title_en: true,
    title_zh: true,
    title_ar: true,
    coverImageUrl: true,
    publishedAt: true,
    template: true,
    gallery: true,
  } as const
  const [related, sidebarPinned, sidebarLatest] = await Promise.all([
    prisma.news.findMany({
      where: {
        isPublished: true,
        template: { in: ["PHOTO", "VIDEO"] },
        slug: { not: slug },
      },
      orderBy: [{ publishedAt: "desc" }],
      take: 6,
      select: SIDEBAR_LIST_SELECT,
    }),
    prisma.news.findMany({
      where: {
        isPublished: true,
        isPinned: true,
        template: { in: ["PHOTO", "VIDEO"] },
        slug: { not: slug },
      },
      orderBy: [{ publishedAt: "desc" }],
      take: 4,
      select: SIDEBAR_LIST_SELECT,
    }),
    prisma.news.findMany({
      where: {
        isPublished: true,
        template: { in: ["PHOTO", "VIDEO"] },
        slug: { not: slug },
      },
      orderBy: [{ publishedAt: "desc" }],
      take: 8,
      select: SIDEBAR_LIST_SELECT,
    }),
  ])
  // Dedupe sidebar: latest không trùng pinned
  const pinnedIdSet = new Set(sidebarPinned.map((n) => n.id))
  const sidebarRecent = sidebarLatest.filter((n) => !pinnedIdSet.has(n.id)).slice(0, 5)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="grid gap-8 lg:grid-cols-12">
        <article className="min-w-0 lg:col-span-9">
      {/* Category eyebrow — VTV-style label nhỏ trên headline */}
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-700">
        {item.type === "VIDEO" ? "Video" : "Bộ sưu tập ảnh"}
      </p>

      {/* Headline — Merriweather serif, match /tin-tuc/[slug] style */}
      <h1 className="font-serif-headline mb-4 text-[24px] font-bold leading-tight text-neutral-900 sm:text-[28px] lg:text-[30px]">
        {title}
      </h1>

      {/* Sapo (lede) với prefix abbreviation Hội — convention báo VN */}
      {excerpt && (
        <p className="mb-5 text-[17px] font-bold leading-[1.55] text-neutral-800">
          <span className="text-brand-700">HTHVN - </span>
          {excerpt}
        </p>
      )}

      {/* Byline — published date inline */}
      {item.publishedAt && (
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-neutral-200 pb-3 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">Ban Quản Trị Hội</span>
          <span className="text-neutral-300" aria-hidden>•</span>
          <time
            dateTime={new Date(item.publishedAt).toISOString()}
            className="text-neutral-500"
          >
            {new Date(item.publishedAt).toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </div>
      )}

      {item.type === "VIDEO" && item.youtubeId ? (
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${item.youtubeId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ) : item.type === "PHOTO_COLLECTION" && item.imageUrls.length > 0 ? (
        <MultimediaLightbox images={item.imageUrls} alt={title} />
      ) : item.coverImageUrl ? (
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
          <Image
            src={item.coverImageUrl}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1000px"
            className="object-contain"
          />
        </div>
      ) : (
        <div className="border border-dashed border-neutral-300 p-12 text-center text-neutral-400">
          Nội dung đang được cập nhật.
        </div>
      )}

      {/* Share bar — FB / Zalo / copy link. Match /tin-tuc/[slug] style. */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-neutral-300 py-4">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
          Chia sẻ:
        </span>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${SITE_URL}/multimedia/${slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="inline-flex items-center gap-1.5 border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:border-[#1877F2] hover:text-[#1877F2]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
          </svg>
          Facebook
        </a>
        <a
          href={`https://zalo.me/share?url=${encodeURIComponent(`${SITE_URL}/multimedia/${slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Zalo"
          className="inline-flex items-center gap-1.5 border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:border-[#0068ff] hover:text-[#0068ff]"
        >
          <span className="font-bold tracking-tight">Zalo</span>
        </a>
        <CopyLinkButton />
      </div>

      {/* Comments — đặt INSIDE article col để không gap khi sidebar dài. */}
      <div className="mt-10">
        <CommentsSection
          newsId={news.id}
          currentUserId={session?.user?.id ?? null}
          currentUserRole={session?.user?.role}
          currentUserName={session?.user?.name}
          currentUserAvatar={session?.user?.image}
        />
      </div>
        </article>

        {/* Right rail — sticky desktop. Banner xuống cuối (dưới Mới đăng). */}
        <aside className="mt-10 min-w-0 space-y-8 lg:col-span-3 lg:mt-0 lg:sticky lg:top-16 lg:self-start">
          <SidebarList
            title="Multimedia nổi bật"
            items={sidebarPinned}
            locale={locale}
            itemHrefPrefix="/multimedia"
          />
          <SidebarList
            title="Mới đăng"
            items={sidebarRecent}
            locale={locale}
            itemHrefPrefix="/multimedia"
            compact
          />
          <Suspense fallback={null}>
            <HomepageBannerSlot slot="MULTIMEDIA_DETAIL_SIDEBAR" />
          </Suspense>
        </aside>
      </div>

      {/* Tin liên quan — multimedia khác (template=PHOTO|VIDEO).
          Phase 3.7 round 4 (2026-04). */}
      {related.length > 0 && (
        <div className="mt-14">
          <Section title="Multimedia liên quan" titleHref="/multimedia">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((it) => {
                const cover = newsCoverImage(it)
                const isVideo = it.template === "VIDEO"
                return (
                  <Link
                    key={it.id}
                    href={`/multimedia/${it.slug}`}
                    className="group block"
                  >
                    {cover ? (
                      <div className="relative aspect-16/10 w-full overflow-hidden bg-neutral-100">
                        <Image
                          src={
                            cover.includes("img.youtube.com")
                              ? cover
                              : cloudinaryResize(cover, 480)
                          }
                          alt={l(it, "title")}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {isVideo && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div
                              aria-hidden
                              className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-1/2 w-1/2">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <AgarwoodPlaceholder className="aspect-16/10 w-full" size="md" shape="square" />
                    )}
                    <div className="mt-3">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-brand-700">
                        {isVideo ? "Video" : "Bộ sưu tập ảnh"}
                      </p>
                      <h3 className="line-clamp-3 text-base font-bold leading-snug text-neutral-900 group-hover:text-brand-700">
                        {l(it, "title")}
                      </h3>
                      {it.publishedAt && (
                        <time
                          dateTime={it.publishedAt.toISOString()}
                          className="mt-1 block text-xs uppercase tracking-wide text-neutral-500"
                        >
                          {new Date(it.publishedAt).toLocaleDateString("vi-VN")}
                        </time>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}
