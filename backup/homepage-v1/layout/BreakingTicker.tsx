import Link from "next/link"
import { Flame } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"

/** Ticker chỉ kéo tin trong N ngày gần nhất — tránh hiển thị tin cũ như
 *  "nổi bật" khi admin không pin item mới. */
const DAYS_WINDOW = 30

/** Ẩn toàn bộ thanh nếu quá ít item — marquee với 1 item sẽ nhấp nháy
 *  không đẹp. 3 là ngưỡng tối thiểu cho cảm giác "chạy ngang". */
const MIN_ITEMS = 3

type TickerItem = {
  id: string
  label: string
  href: string
  date: Date
}

/** Document category → tab trên /phap-ly. Các category khác (công văn nội bộ)
 *  đã bị filter bằng isPublic=true nên không xuất hiện ở đây. */
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

const BCP47: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-GB",
  zh: "zh-CN",
  ar: "ar",
}

function fmtDate(d: Date, locale: Locale): string {
  return d.toLocaleDateString(BCP47[locale], {
    day: "2-digit",
    month: "2-digit",
  })
}

export async function BreakingTicker() {
  const [locale, t] = await Promise.all([
    getLocale() as Promise<Locale>,
    getTranslations("breakingTicker"),
  ])
  const cutoff = new Date(Date.now() - DAYS_WINDOW * 24 * 60 * 60 * 1000)

  const [pinnedNews, recentDocs] = await Promise.all([
    prisma.news.findMany({
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
    }),
    prisma.document.findMany({
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
    }),
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

  // Duplicate cho seamless loop — CSS translateX(-50%) sẽ chạm đúng đầu copy
  // thứ 2 đang ở vị trí 0, tạo vòng lặp mượt.
  const looped = [...items, ...items]

  return (
    <section aria-label={t("ariaLabel")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="ticker-wrapper relative flex h-10 items-stretch gap-3 overflow-hidden rounded-md border border-brand-200 bg-white px-3 mt-2 shadow-sm">
          {/* Label bên trái — tĩnh */}
          <div className="flex items-center gap-1.5 shrink-0 text-red-600 text-sm font-bold tracking-wide uppercase">
            <Flame className="h-4 w-4" aria-hidden="true" />
            <span>{t("label")}</span>
          </div>
          <span className="shrink-0 self-center text-brand-300" aria-hidden="true">|</span>

          {/* Marquee — chiếm phần giữa */}
          <div className="flex-1 overflow-hidden">
            <ul className="ticker-track flex items-center whitespace-nowrap h-full">
              {looped.map((item, idx) => (
                <li key={`${item.id}-${idx}`} className="flex items-center shrink-0">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm text-brand-800 hover:text-red-700 transition-colors"
                  >
                    <span className="text-xs font-semibold text-brand-500 tabular-nums">
                      {fmtDate(item.date, locale)}
                    </span>
                    <span className="text-brand-400" aria-hidden="true">·</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                  <span className="text-red-500 shrink-0 mx-1" aria-hidden="true">•</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA phải — link sang trang tin */}
          <Link
            href="/tin-tuc"
            className="hidden sm:inline-flex items-center gap-1 shrink-0 self-center rounded-md bg-red-600 px-3 py-1 text-xs font-bold uppercase text-white hover:bg-red-700 transition-colors"
          >
            {t("viewAll")}
          </Link>
        </div>
      </div>
    </section>
  )
}
