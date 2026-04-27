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

export async function BreakingTicker() {
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

  // unstable_cache serialize Date → ISO string; phải new Date() lại
  // trước khi .getTime() / toLocaleDateString.
  const toDate = (v: Date | string | null | undefined): Date =>
    v ? (typeof v === "string" ? new Date(v) : v) : new Date(0)

  const items: TickerItem[] = [
    ...pinnedNews.map((n) => ({
      id: `news-${n.id}`,
      label: l(n, "title"),
      href: `/tin-tuc/${n.slug}`,
      date: toDate(n.publishedAt),
    })),
    ...recentDocs.map((d) => ({
      id: `doc-${d.id}`,
      label: l(d, "title"),
      href: mapDocHref(d.category),
      date: toDate(d.issuedDate ?? d.createdAt),
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

        {/* Social icons phải — đối xứng với label "Nổi bật" trái: nền đỏ
            cùng tone, 3 platform Facebook + YouTube + TikTok. Phase 3.7
            (2026-04). TikTok dùng inline SVG vì lucide-react chưa có brand
            icon này. */}
        <div className="flex shrink-0 items-center gap-1.5 self-stretch bg-red-600 px-2 sm:gap-2 sm:px-3">
          <a
            href="https://www.facebook.com/hoitramhuongvietnam.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            title="Facebook Hội Trầm Hương"
            className="flex items-center justify-center text-white transition-opacity hover:opacity-80"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>
          <span aria-hidden="true" className="h-5 w-px bg-white/40" />
          <a
            href="https://www.youtube.com/@hoitramhuongvietnam"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            title="YouTube Hội Trầm Hương"
            className="flex items-center justify-center text-white transition-opacity hover:opacity-80"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
          <span aria-hidden="true" className="h-5 w-px bg-white/40" />
          <a
            href="https://www.tiktok.com/@hoitramhuongvietnam"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            title="TikTok Hội Trầm Hương"
            className="flex items-center justify-center text-white transition-opacity hover:opacity-80"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
