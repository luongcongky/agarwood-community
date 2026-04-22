import Link from "next/link"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"

const DAYS_WINDOW = 30
const MIN_ITEMS = 3

/** Cached Prisma queries — trước đây fetch fresh mỗi request, giờ cache 60s
 *  với tags homepage/news/documents để admin mutation invalidate ngay.
 *  Bucket key (phút) đảm bảo cutoff "now - 30 days" không stale quá lâu. */
const getPinnedNews = unstable_cache(
  async (_bucketMinutes: number) => {
    void _bucketMinutes
    const cutoff = new Date(Date.now() - DAYS_WINDOW * 24 * 60 * 60 * 1000)
    return prisma.news.findMany({
      where: {
        isPublished: true,
        isPinned: true,
        publishedAt: { gte: cutoff, not: null },
      },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        title_en: true,
        title_zh: true,
        title_ar: true,
        publishedAt: true,
      },
      take: 15,
    })
  },
  ["breaking_ticker_pinned_news"],
  { revalidate: 60, tags: ["homepage", "news"] },
)

const getRecentDocs = unstable_cache(
  async (_bucketMinutes: number) => {
    void _bucketMinutes
    const cutoff = new Date(Date.now() - DAYS_WINDOW * 24 * 60 * 60 * 1000)
    return prisma.document.findMany({
      where: {
        isPublic: true,
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        category: true,
        title: true,
        title_en: true,
        title_zh: true,
        title_ar: true,
        issuedDate: true,
        createdAt: true,
      },
      take: 10,
    })
  },
  ["breaking_ticker_recent_docs"],
  { revalidate: 60, tags: ["homepage", "documents"] },
)

type TickerItem = {
  id: string
  label: string
  href: string
  date: Date
}

function mapDocHref(category: string): string {
  switch (category) {
    case "DIEU_LE":
      return "/phap-ly?tab=dieu-le"
    case "QUY_CHE":
      return "/phap-ly?tab=quy-che"
    case "GIAY_PHEP":
      return "/phap-ly?tab=giay-phep"
    default:
      return "/phap-ly"
  }
}

const BCP47: Record<Locale, string> = { vi: "vi-VN", en: "en-GB", zh: "zh-CN", ar: "ar" }

function fmtDate(d: Date, locale: Locale): string {
  return d.toLocaleDateString(BCP47[locale], {
    day: "2-digit",
    month: "2-digit",
  })
}

export async function BreakingTickerV2() {
  // eslint-disable-next-line react-hooks/purity -- server component fresh per request
  const bucketMinutes = Math.floor(Date.now() / 60_000)
  const [locale, t, pinnedNews, recentDocs] = await Promise.all([
    getLocale() as Promise<Locale>,
    getTranslations("breakingTicker"),
    getPinnedNews(bucketMinutes),
    getRecentDocs(bucketMinutes),
  ])

  const l = <T extends Record<string, unknown>>(rec: T, field: string) =>
    localize(rec, field, locale) as string

  const items: TickerItem[] = [
    ...pinnedNews.map((n) => ({
      id: `news-${n.id}`,
      label: l(n, "title"),
      href: `/tin-tuc/${n.slug}`,
      date: n.publishedAt as Date,
    })),
    ...recentDocs.map((d) => ({
      id: `doc-${d.id}`,
      label: l(d, "title"),
      href: mapDocHref(d.category),
      date: d.issuedDate ?? d.createdAt,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  if (items.length < MIN_ITEMS) return null

  const looped = [...items, ...items]

  return (
    <section aria-label={t("ariaLabel")}>
      <div className="ticker-wrapper relative flex h-10 items-stretch overflow-hidden border-y border-neutral-200 bg-white">
        {/* Label trái — khối đỏ đặc kiểu VTV, không icon */}
        <div className="flex shrink-0 items-center bg-red-600 px-4 text-[12px] font-bold uppercase tracking-wide text-white">
          {t("label")}
        </div>

        {/* Marquee — phần giữa */}
        <div className="flex-1 overflow-hidden">
          <ul className="ticker-track flex h-full items-center whitespace-nowrap">
            {looped.map((item, idx) => (
              <li
                key={`${item.id}-${idx}`}
                className="flex shrink-0 items-center"
              >
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 px-4 text-[13px] text-neutral-800 hover:text-red-600 hover:underline"
                >
                  <span className="text-[11px] font-semibold tabular-nums text-neutral-500">
                    {fmtDate(item.date, locale)}
                  </span>
                  <span aria-hidden="true" className="text-neutral-400">
                    ·
                  </span>
                  <span className="font-semibold">{item.label}</span>
                </Link>
                <span aria-hidden="true" className="shrink-0 text-red-600">
                  •
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA phải — text link thay pill */}
        <Link
          href="/tin-tuc"
          className="hidden shrink-0 items-center self-center border-l border-neutral-200 px-3 text-[11px] font-bold uppercase tracking-wide text-red-600 hover:underline sm:inline-flex"
        >
          {t("viewAll")} »
        </Link>
      </div>
    </section>
  )
}
