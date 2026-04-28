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
import { newsToMultimedia } from "@/lib/multimedia-from-news"
import { CommentsSection } from "@/components/features/comments/CommentsSection"

export const revalidate = 300

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

  return (
    <article className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <nav className="mb-4 text-xs text-neutral-500">
        <Link href="/" className="hover:text-brand-700">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <Link href="/multimedia" className="hover:text-brand-700">
          Multimedia
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800">{title}</span>
      </nav>

      <header className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-700">
          {item.type === "VIDEO" ? "Video" : "Bộ sưu tập ảnh"}
        </p>
        <h1 className="text-3xl font-bold leading-tight text-brand-900 lg:text-4xl">
          {title}
        </h1>
        {excerpt && (
          <p className="mt-3 text-[17px] leading-relaxed text-neutral-700">{excerpt}</p>
        )}
        {item.publishedAt && (
          <p className="mt-3 text-xs uppercase tracking-wide text-neutral-500">
            {new Date(item.publishedAt).toLocaleDateString("vi-VN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </header>

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

      {/* Comments — Phase 3.7 round 4 (2026-04). Dùng cùng polymorphic
          Comment.newsId như /tin-tuc + /nghien-cuu vì multimedia entry giờ
          là News template=PHOTO|VIDEO sau migration drop_multimedia. */}
      <div className="mt-10 lg:max-w-3xl">
        <CommentsSection
          newsId={news.id}
          currentUserId={session?.user?.id ?? null}
          currentUserRole={session?.user?.role}
          currentUserName={session?.user?.name}
          currentUserAvatar={session?.user?.image}
        />
      </div>
    </article>
  )
}
