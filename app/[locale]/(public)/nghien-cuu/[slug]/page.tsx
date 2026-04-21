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
import { BASE_URL, SITE_NAME, hreflangAlternates, localizedUrl } from "@/lib/seo/site"
import { addAnchorIdsToH2, extractTocFromHtml } from "@/lib/seo/toc"
import { cloudinaryResize, rewriteCloudinaryInHtml } from "@/lib/cloudinary"
import { CopyLinkButton } from "../../tin-tuc/[slug]/CopyLinkButton"

export const revalidate = 1800

type Props = { params: Promise<{ locale: Locale; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const news = await prisma.news.findFirst({
    where: { slug, category: "RESEARCH" },
    select: {
      title: true, title_en: true, title_zh: true, title_ar: true,
      excerpt: true, excerpt_en: true, excerpt_zh: true, excerpt_ar: true,
      seoTitle: true, seoTitle_en: true, seoTitle_zh: true, seoTitle_ar: true,
      seoDescription: true, seoDescription_en: true, seoDescription_zh: true, seoDescription_ar: true,
      coverImageUrl: true,
      publishedAt: true,
    },
  })
  if (!news) return { title: "Bài nghiên cứu không tồn tại" }
  const title =
    (localize(news, "seoTitle", locale) as string | null) ||
    (localize(news, "title", locale) as string)
  const excerpt =
    ((localize(news, "seoDescription", locale) as string | null) ||
      (localize(news, "excerpt", locale) as string | null)) ?? undefined
  const path = `/nghien-cuu/${slug}`
  return {
    title: `${title} | Nghiên cứu khoa học | ${SITE_NAME}`,
    description: excerpt,
    alternates: hreflangAlternates(path),
    openGraph: {
      title,
      description: excerpt,
      url: localizedUrl(path, locale),
      images: news.coverImageUrl ? [{ url: news.coverImageUrl }] : [],
      type: "article",
      publishedTime: news.publishedAt?.toISOString(),
      siteName: SITE_NAME,
      locale: locale === "vi" ? "vi_VN" : locale === "en" ? "en_US" : locale === "zh" ? "zh_CN" : "ar_AR",
    },
  }
}

export default async function ResearchDetailPage({ params }: Props) {
  const [locale, t, tc] = await Promise.all([
    getLocale() as Promise<Locale>,
    getTranslations("news"),
    getTranslations("common"),
  ])
  const l = <T extends Record<string, unknown>>(record: T, field: string) => localize(record, field, locale) as string
  const { slug } = await params

  const news = await prisma.news.findFirst({
    where: { slug, isPublished: true, category: "RESEARCH" },
  })

  // If not found, try slugifying the input (e.g. user typed with diacritics)
  if (!news) {
    const normalizedSlug = slugify(slug)
    if (normalizedSlug !== slug) {
      const redirectedNews = await prisma.news.findFirst({
        where: { slug: normalizedSlug, isPublished: true, category: "RESEARCH" },
      })
      if (redirectedNews) {
        redirect(`/nghien-cuu/${normalizedSlug}`)
      }
    }
  }

  if (!news) notFound()

  // Related research articles — prefer same focus keyword, fallback to recency.
  const relatedPool = await prisma.news.findMany({
    where: {
      isPublished: true,
      category: "RESEARCH",
      slug: { not: slug },
      ...(news.focusKeyword
        ? {
            OR: [
              { focusKeyword: news.focusKeyword },
              { secondaryKeywords: { has: news.focusKeyword } },
            ],
          }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true, title_en: true, title_zh: true, title_ar: true,
      slug: true,
      excerpt: true, excerpt_en: true, excerpt_zh: true, excerpt_ar: true,
      coverImageUrl: true,
      publishedAt: true,
    },
  })
  let related = relatedPool
  if (related.length < 3) {
    const fill = await prisma.news.findMany({
      where: {
        isPublished: true,
        category: "RESEARCH",
        slug: { not: slug },
        id: { notIn: related.map((r) => r.id) },
      },
      orderBy: { publishedAt: "desc" },
      take: 3 - related.length,
      select: {
        id: true,
        title: true, title_en: true, title_zh: true, title_ar: true,
        slug: true,
        excerpt: true, excerpt_en: true, excerpt_zh: true, excerpt_ar: true,
        coverImageUrl: true,
        publishedAt: true,
      },
    })
    related = [...related, ...fill]
  }

  // Fetch author for E-E-A-T signals.
  const author = await prisma.user.findUnique({
    where: { id: news.authorId },
    select: {
      id: true, name: true, avatarUrl: true, role: true,
      bio: true, bio_en: true, bio_zh: true, bio_ar: true,
    },
  })
  const authorDisplayName = news.originalAuthor || author?.name || SITE_NAME
  const authorBio = author ? (l(author, "bio") as string | null) : null
  const authorUrl = author ? localizedUrl(`/thanh-vien/${author.id}`, locale) : BASE_URL

  // Inject H2 anchor IDs + extract TOC. Also rewrite Cloudinary URLs in
  // the body to include width limit so the browser doesn't pull the
  // original full-size image into a content column.
  const sanitizedContent = DOMPurify.sanitize(l(news, "content") ?? "")
  const optimizedContent = rewriteCloudinaryInHtml(sanitizedContent, 1024)
  const contentWithAnchors = addAnchorIdsToH2(optimizedContent)
  const toc = extractTocFromHtml(sanitizedContent)

  const articleUrl = localizedUrl(`/nghien-cuu/${slug}`, locale)
  const seoTitle = (l(news, "seoTitle") as string | null) || l(news, "title")
  const seoDesc = (l(news, "seoDescription") as string | null) || l(news, "excerpt")
  const coverAlt = (l(news, "coverImageAlt") as string | null) || l(news, "title")
  const localizedContent = (l(news, "content") as string | undefined) ?? ""
  const keywords = [news.focusKeyword, ...(news.secondaryKeywords ?? [])]
    .filter((k): k is string => Boolean(k && k.trim()))

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    headline: seoTitle,
    description: seoDesc || localizedContent.replace(/<[^>]*>/g, "").slice(0, 160),
    image: news.coverImageUrl ?? undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    inLanguage: locale === "vi" ? "vi-VN" : locale === "zh" ? "zh-CN" : locale,
    datePublished: news.publishedAt?.toISOString(),
    dateModified: news.updatedAt?.toISOString(),
    author: {
      "@type": "Person",
      name: authorDisplayName,
      url: authorUrl,
      ...(author?.avatarUrl ? { image: author.avatarUrl } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
    },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("home"), item: localizedUrl("/", locale) },
      { "@type": "ListItem", position: 2, name: "Nghiên cứu khoa học", item: localizedUrl("/nghien-cuu", locale) },
      { "@type": "ListItem", position: 3, name: seoTitle, item: articleUrl },
    ],
  }

  return (
    <div className="bg-brand-50/60 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Article card */}
        <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
          {/* Breadcrumb — nằm trong card, phía trên cover ảnh */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap px-6 sm:px-10 pt-6 pb-4">
            <Link href="/" className="hover:text-brand-700 transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <Link href="/nghien-cuu" className="hover:text-brand-700 transition-colors">
              Nghiên cứu khoa học
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium line-clamp-1">{l(news, "title")}</span>
          </nav>

          {/* Cover image — khung beige ôm ảnh, tách khỏi nền trắng của card */}
          {news.coverImageUrl && (
            <div className="bg-brand-100 p-2">
              <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden ring-1 ring-brand-300/60">
                <Image
                  src={cloudinaryResize(news.coverImageUrl, 1280)}
                  alt={coverAlt}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1280px) 100vw, 1280px"
                />
              </div>
            </div>
          )}

          {/* Article Header + Body */}
          <div className="px-6 sm:px-10 py-8 sm:py-10">
            <header className="mb-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 text-brand-800 text-xs font-medium px-3 py-1">
                  📚 Nghiên cứu khoa học
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                {l(news, "title")}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
                {news.publishedAt && (
                  <span>
                    {t("publishedAt")}{" "}
                    {new Date(news.publishedAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                )}
                {news.updatedAt && news.publishedAt &&
                  news.updatedAt.getTime() - news.publishedAt.getTime() > 24 * 60 * 60 * 1000 && (
                    <span>
                      · {t("updatedAt")}{" "}
                      {new Date(news.updatedAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  )}
                <span className="text-brand-600 font-medium">· {authorDisplayName}</span>
              </div>
            </header>

            {/* Table of Contents — auto-generated from H2 tags. */}
            {toc.length >= 2 && (
              <nav className="mb-8 rounded-lg border border-brand-200 bg-brand-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
                  {t("tocTitle")}
                </p>
                <ol className="space-y-1 text-sm">
                  {toc.map((entry, i) => (
                    <li key={entry.id} className="flex items-baseline gap-2">
                      <span className="text-brand-400 shrink-0 tabular-nums">{i + 1}.</span>
                      <a
                        href={`#${entry.id}`}
                        className="text-brand-700 hover:text-brand-900 hover:underline line-clamp-1"
                      >
                        {entry.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Article Body */}
            <article className="mb-10">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: contentWithAnchors }}
              />
            </article>

            {/* Author bio — E-E-A-T signal. */}
            {author && (authorBio || author.avatarUrl) && (
              <aside className="mb-8 rounded-xl border border-brand-200 bg-brand-50/40 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">
                  {t("aboutAuthor")}
                </p>
                <div className="flex items-start gap-4">
                  <div className="relative w-14 h-14 shrink-0 rounded-full bg-brand-200 overflow-hidden">
                    {author.avatarUrl ? (
                      <Image
                        src={author.avatarUrl}
                        alt={author.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-brand-700 font-bold">
                        {author.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-900">{author.name}</p>
                    {authorBio && (
                      <p className="mt-1 text-sm text-brand-700 leading-relaxed whitespace-pre-line">
                        {authorBio}
                      </p>
                    )}
                  </div>
                </div>
              </aside>
            )}

            {/* Share Buttons */}
            <div className="border-t border-border pt-6">
              <p className="text-sm font-medium text-foreground mb-3">Chia sẻ bài nghiên cứu:</p>
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

        {/* Related Research — cùng pattern card trắng như article chính */}
        {related.length > 0 && (
          <section className="mt-6 bg-white rounded-2xl border border-brand-200 shadow-sm p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-5">
              Nghiên cứu liên quan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/nghien-cuu/${item.slug}`}
                  className="group block bg-brand-50/40 rounded-xl overflow-hidden border border-brand-200 hover:shadow-md hover:border-brand-300 transition-all"
                >
                  {item.coverImageUrl ? (
                    <div className="relative w-full h-36">
                      <Image
                        src={cloudinaryResize(item.coverImageUrl, 480)}
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
