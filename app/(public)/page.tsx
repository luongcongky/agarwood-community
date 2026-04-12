import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import {
  getAssociationNews,
  getLatestPostsByCategory,
  type HomepageNewsItem,
} from "@/lib/homepage"
import { MemberNewsRail } from "@/components/features/homepage/MemberNewsRail"
import { CertifiedProductsCarousel } from "@/components/features/homepage/CertifiedProductsCarousel"
import { HomepageBannerSlot } from "@/components/features/homepage/HomepageBannerSlot"
import { PostCard } from "@/components/features/homepage/PostCard"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"

export const metadata: Metadata = {
  title: "Hội Trầm Hương Việt Nam — Cộng đồng Doanh nghiệp Trầm Hương",
  description:
    "Nền tảng kết nối doanh nghiệp trầm hương Việt Nam. Tin tức, sản phẩm chứng nhận, bản tin hội viên cập nhật liên tục.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hội Trầm Hương Việt Nam",
    description: "Cộng đồng kết nối doanh nghiệp trầm hương uy tín trên toàn quốc.",
    type: "website",
  },
}

// Trang chủ phụ thuộc vào nhiều cache 5 phút trong lib/homepage.ts.
// Set revalidate ngắn hơn ở đây để Next.js cũng revalidate static shell.
export const revalidate = 300

function formatDate(d: Date | null | string): string {
  if (!d) return ""
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function HomePage() {
  // Fetch song song để giảm latency
  const [associationNews, businessPosts, productPosts] = await Promise.all([
    getAssociationNews(),
    getLatestPostsByCategory("NEWS", 6),
    getLatestPostsByCategory("PRODUCT", 6),
  ])

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hội Trầm Hương Việt Nam",
    alternateName: "VAWA — Vietnam Agarwood Association",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoitramhuong.vn",
    description:
      "Cộng đồng kết nối, chứng nhận và truyền thông sản phẩm trầm hương Việt Nam.",
    foundingDate: "2010-01-11",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Số 150, Đường Lý Chính Thắng, Phường Xuân Hòa",
      addressLocality: "Thành phố Hồ Chí Minh",
      addressCountry: "VN",
    },
    sameAs: ["https://www.facebook.com/hoitramhuongvietnam.org"],
  }

  const heroNews = associationNews[0] ?? null
  const restNews = associationNews.slice(1)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* ── Section 1 + 2: Tin Hội (left) + Bản tin hội viên (right rail) ── */}
      <section className="bg-brand-50 py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Section 1 — Tin tức Hội (col 1+2) */}
            <div className="lg:col-span-2 space-y-6">
              <header>
                <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">
                  Tin tức của Hội
                </h2>
                <p className="text-sm text-brand-500 mt-1">
                  Cập nhật từ Ban quản trị Hội Trầm Hương Việt Nam
                </p>
              </header>

              {heroNews ? (
                <NewsHero news={heroNews} />
              ) : (
                <div className="rounded-xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
                  Chưa có tin tức nào.
                </div>
              )}

              {restNews.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {restNews.map((news) => (
                    <NewsListItem key={news.id} news={news} />
                  ))}
                </div>
              )}

              <div className="text-right">
                <Link
                  href="/tin-tuc"
                  className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-800 underline underline-offset-4"
                >
                  Xem tất cả tin tức →
                </Link>
              </div>
            </div>

            {/* Section 2 — Bản tin hội viên (right rail) */}
            <div className="lg:col-span-1">
              <MemberNewsRail />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Sản phẩm chứng nhận (carousel) ── */}
      <CertifiedProductsCarousel />

      {/* ── Section 4: Banner quảng cáo ── */}
      <HomepageBannerSlot />

      {/* ── Section 5: Tin doanh nghiệp mới nhất ── */}
      <LatestPostsSection
        title="Tin doanh nghiệp mới nhất"
        subtitle="Tin tức từ các doanh nghiệp hội viên"
        posts={businessPosts}
        emptyText="Chưa có tin tức nào từ doanh nghiệp hội viên."
        bgClass="bg-white"
      />

      {/* ── Section 6: Tin sản phẩm mới nhất ── */}
      <LatestPostsSection
        title="Tin sản phẩm mới nhất"
        subtitle="Sản phẩm mới giới thiệu hoặc vừa được chứng nhận"
        posts={productPosts}
        emptyText="Chưa có tin sản phẩm nào."
        bgClass="bg-brand-50"
      />
    </>
  )
}

// ─── Section 1 sub-components ───────────────────────────────────────────────

function NewsHero({ news }: { news: HomepageNewsItem }) {
  return (
    <Link
      href={`/tin-tuc/${news.slug}`}
      className="group block overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm hover:shadow-md transition-all"
    >
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-brand-100">
        {news.coverImageUrl ? (
          <Image
            src={news.coverImageUrl}
            alt={news.title}
            fill
            priority
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="xl" shape="square" />
        )}
        {news.isPinned && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow">
            📌 Tin nổi bật
          </span>
        )}
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-bold text-brand-900 group-hover:text-brand-700 line-clamp-2">
          {news.title}
        </h3>
        {news.excerpt && (
          <p className="mt-2 text-sm sm:text-base text-brand-600 line-clamp-2">
            {news.excerpt}
          </p>
        )}
        <time className="mt-3 block text-xs text-brand-500">{formatDate(news.publishedAt)}</time>
      </div>
    </Link>
  )
}

function NewsListItem({ news }: { news: HomepageNewsItem }) {
  return (
    <Link
      href={`/tin-tuc/${news.slug}`}
      className="group flex gap-3 p-3 rounded-lg border border-brand-200 bg-white hover:border-brand-300 hover:shadow-sm transition-all"
    >
      {news.coverImageUrl ? (
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded">
          <Image src={news.coverImageUrl} alt="" fill className="object-cover" sizes="96px" />
        </div>
      ) : (
        <AgarwoodPlaceholder className="h-20 w-24" size="sm" shape="rounded" tone="light" />
      )}
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-semibold text-brand-900 group-hover:text-brand-700">
          {news.title}
        </h4>
        <time className="mt-1 block text-xs text-brand-500">{formatDate(news.publishedAt)}</time>
      </div>
    </Link>
  )
}

// ─── Section 5+6 reusable ──────────────────────────────────────────────────

function LatestPostsSection({
  title,
  subtitle,
  posts,
  emptyText,
  bgClass,
}: {
  title: string
  subtitle: string
  posts: Awaited<ReturnType<typeof getLatestPostsByCategory>>
  emptyText: string
  bgClass: string
}) {
  return (
    <section className={`${bgClass} py-12 lg:py-16`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">{title}</h2>
            <p className="text-sm text-brand-500 mt-1">{subtitle}</p>
          </div>
          <Link
            href="/feed"
            className="hidden sm:inline-block text-sm font-medium text-brand-600 hover:text-brand-800 underline underline-offset-4"
          >
            Xem tất cả →
          </Link>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
            {emptyText}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} variant="vertical" />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
