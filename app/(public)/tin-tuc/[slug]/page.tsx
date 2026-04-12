import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { CopyLinkButton } from "./CopyLinkButton"

export const revalidate = 1800

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const news = await prisma.news.findFirst({
    where: { slug, category: "GENERAL" },
    select: {
      title: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
    },
  })
  if (!news) return { title: "Tin tức không tồn tại" }
  return {
    title: `${news.title} | Hội Trầm Hương Việt Nam`,
    description: news.excerpt ?? undefined,
    openGraph: {
      title: news.title,
      description: news.excerpt ?? undefined,
      images: news.coverImageUrl ? [{ url: news.coverImageUrl }] : [],
      type: "article",
      publishedTime: news.publishedAt?.toISOString(),
      siteName: "Hội Trầm Hương Việt Nam",
    },
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params

  const news = await prisma.news.findFirst({
    where: { slug, isPublished: true, category: "GENERAL" },
  })

  // If not found, try slugifying the input
  if (!news) {
    const normalizedSlug = slugify(slug)
    if (normalizedSlug !== slug) {
      const redirectedNews = await prisma.news.findFirst({
        where: { slug: normalizedSlug, isPublished: true, category: "GENERAL" },
      })
      if (redirectedNews) {
        redirect(`/tin-tuc/${normalizedSlug}`)
      }
    }
  }

  if (!news) notFound()

  // Fetch related articles (excluding current slug)
  const related = await prisma.news.findMany({
    where: { isPublished: true, category: "GENERAL", slug: { not: slug } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
    },
  })

  const articleUrl = `https://hoitramhuong.vn/tin-tuc/${slug}`

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    description: news.excerpt ?? news.content.replace(/<[^>]*>/g, "").slice(0, 160),
    image: news.coverImageUrl ?? undefined,
    datePublished: news.publishedAt?.toISOString(),
    dateModified: news.updatedAt?.toISOString(),
    author: { "@type": "Organization", name: "Hội Trầm Hương Việt Nam" },
    publisher: { "@type": "Organization", name: "Hội Trầm Hương Việt Nam" },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-brand-700 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/tin-tuc" className="hover:text-brand-700 transition-colors">
          Tin tức
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium line-clamp-1">{news.title}</span>
      </nav>

      {/* Article Header */}
      <header className="mb-8 space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
          {news.title}
        </h1>
        {news.publishedAt && (
          <p className="text-muted-foreground text-sm">
            Ngày đăng:{" "}
            {new Date(news.publishedAt).toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        )}
        {news.coverImageUrl && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
            <Image
              src={news.coverImageUrl}
              alt={news.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        )}
      </header>

      {/* Article Body */}
      <article className="mb-10">
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(news.content) }}
        />
      </article>

      {/* Share Buttons */}
      <div className="border-t border-border pt-6 mb-10">
        <p className="text-sm font-medium text-foreground mb-3">Chia sẻ bài viết:</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            📘 Facebook
          </a>
          <a
            href={`https://zalo.me/share?url=${encodeURIComponent(articleUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            💬 Zalo
          </a>
          <CopyLinkButton />
        </div>
      </div>

      {/* Related Articles */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-5">
            Tin tức liên quan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/tin-tuc/${item.slug}`}
                className="group block bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow"
              >
                {item.coverImageUrl ? (
                  <div className="relative w-full h-36">
                    <Image
                      src={item.coverImageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <AgarwoodPlaceholder className="w-full h-36" size="md" shape="square" />
                )}
                <div className="p-3 space-y-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.publishedAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.publishedAt).toLocaleDateString("vi-VN")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
