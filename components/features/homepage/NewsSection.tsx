import Link from "next/link"
import Image from "next/image"
import { getAssociationNews, type HomepageNewsItem } from "@/lib/homepage"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"

function formatDate(d: Date | null | string): string {
  if (!d) return ""
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export async function NewsSection() {
  const associationNews = await getAssociationNews()
  const heroNews = associationNews[0] ?? null
  const restNews = associationNews.slice(1)

  return (
    <div className="min-w-0 lg:col-span-2 space-y-6">
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
  )
}

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
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
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
        <time className="mt-3 block text-xs text-brand-500">
          {formatDate(news.publishedAt)}
        </time>
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
          <Image
            src={news.coverImageUrl}
            alt=""
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            className="object-cover"
            sizes="96px"
          />
        </div>
      ) : (
        <AgarwoodPlaceholder className="h-20 w-24" size="sm" shape="rounded" tone="light" />
      )}
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-semibold text-brand-900 group-hover:text-brand-700">
          {news.title}
        </h4>
        <time className="mt-1 block text-xs text-brand-500">
          {formatDate(news.publishedAt)}
        </time>
      </div>
    </Link>
  )
}
