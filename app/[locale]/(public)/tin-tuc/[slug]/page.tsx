import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
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
      title: true, title_en: true, title_zh: true,
      excerpt: true, excerpt_en: true, excerpt_zh: true,
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
  const [locale, t] = await Promise.all([
    getLocale() as Promise<Locale>,
    getTranslations("news"),
  ])
  const l = <T extends Record<string, unknown>>(record: T, field: string) => localize(record, field, locale) as string
  const tc = await getTranslations("common")
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
      title: true, title_en: true, title_zh: true,
      slug: true,
      excerpt: true, excerpt_en: true, excerpt_zh: true,
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
    <div className="bg-brand-50/60 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Article card — nền trắng nổi trên background trang */}
        <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
          {/* Breadcrumb — nằm trong card, phía trên cover ảnh */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap px-6 sm:px-10 pt-6 pb-4">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              {tc("home")}
            </Link>
            <span>/</span>
            <Link href="/tin-tuc" className="hover:text-brand-700 transition-colors">
              {t("breadcrumbNews")}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium line-clamp-1">{l(news, "title")}</span>
          </nav>

          {/* Cover image — full-bleed bên trong card */}
          {news.coverImageUrl && (
            <div className="relative w-full aspect-video bg-muted">
              <Image
                src={news.coverImageUrl}
                alt={l(news, "title")}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>
          )}

          {/* Article Header + Body */}
          <div className="px-6 sm:px-10 py-8 sm:py-10">
            <header className="mb-8 space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                {l(news, "title")}
              </h1>
              {news.publishedAt && (
                <p className="text-muted-foreground text-sm">
                  {t("publishedAt")}{" "}
                  {new Date(news.publishedAt).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              )}
            </header>

            {/* Article Body */}
            <article className="mb-10">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(l(news, "content") ?? "") }}
              />
            </article>

            {/* Share Buttons */}
            <div className="border-t border-border pt-6">
              <p className="text-sm font-medium text-foreground mb-3">{t("shareArticle")}</p>
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
          </div>
        </div>

        {/* Related Articles — cùng pattern card trắng như article chính */}
        {related.length > 0 && (
          <section className="mt-6 bg-white rounded-2xl border border-brand-200 shadow-sm p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-5">
              {t("relatedNews")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/tin-tuc/${item.slug}`}
                  className="group block bg-brand-50/40 rounded-xl overflow-hidden border border-brand-200 hover:shadow-md hover:border-brand-300 transition-all"
                >
                  {item.coverImageUrl ? (
                    <div className="relative w-full h-36">
                      <Image
                        src={item.coverImageUrl}
                        alt={l(item, "title")}
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
                      {l(item, "title")}
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
    </div>
  )
}
