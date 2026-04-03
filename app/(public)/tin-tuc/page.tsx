import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

export const revalidate = 3600

const PAGE_SIZE = 20

function buildUrl(p: number, q: string) {
  const params = new URLSearchParams()
  if (p > 1) params.set("page", String(p))
  if (q) params.set("q", q)
  const qs = params.toString()
  return `/tin-tuc${qs ? `?${qs}` : ""}`
}

/** Smart pagination: luôn hiển thị trang đầu, cuối, và window ±2 xung quanh trang hiện tại */
function paginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = []
  const addPage = (n: number) => { if (!pages.includes(n)) pages.push(n) }
  addPage(1)
  if (current > 4) pages.push("...")
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) addPage(i)
  if (current < total - 3) pages.push("...")
  addPage(total)
  return pages
}

function formatDate(d: Date | null) {
  if (!d) return ""
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}


export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const q = params.q ?? ""
  const isSearch = q.length > 0

  const where = {
    isPublished: true,
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { excerpt: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  }

  // On page 1 without search: fetch featured (pinned) separately for hero
  const [total, newsList, featuredNews] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        isPinned: true,
        publishedAt: true,
      },
    }),
    // Sidebar: latest 6 pinned or most recent (always fresh regardless of page/search)
    prisma.news.findMany({
      where: { isPublished: true },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 6,
      select: { id: true, title: true, slug: true, publishedAt: true, isPinned: true },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // On page 1 without search: first item is the hero, rest go to the list
  const isFirstPage = page === 1 && !isSearch
  const heroItem = isFirstPage && newsList[0] ? newsList[0] : null
  const subHeroItems = isFirstPage ? newsList.slice(1, 4) : []
  const listItems = isFirstPage ? newsList.slice(4) : newsList

  return (
    <div className="min-h-screen bg-white">

      {/* ── Page Banner ─────────────────────────────────────────────────────── */}
      <div className="bg-brand-800 py-14 px-4 text-center">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-brand-100">Tin tức</h1>
        <p className="mt-2 text-brand-300 text-base">
          Thông tin &amp; Cập nhật từ Hội Trầm Hương Việt Nam
        </p>
      </div>

      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      <div className="border-b border-brand-100 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <form method="GET" action="/tin-tuc" className="flex gap-2 max-w-lg">
            <input type="hidden" name="page" value="1" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Tìm kiếm tin tức..."
              className="flex-1 rounded-md border border-brand-200 bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-800 text-brand-100 px-4 py-2 text-sm font-medium hover:bg-brand-900 transition-colors"
            >
              Tìm
            </button>
            {isSearch && (
              <Link
                href="/tin-tuc"
                className="rounded-md border border-brand-300 text-brand-700 px-3 py-2 text-sm hover:bg-brand-100 transition-colors"
              >
                ✕
              </Link>
            )}
          </form>
          {isSearch && (
            <p className="mt-2 text-xs text-brand-500">
              {total} kết quả cho &ldquo;{q}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* ── HERO (chỉ trang 1, không search) ────────────────────────────── */}
        {heroItem && (
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-brand-200 rounded-xl overflow-hidden shadow-sm">

              {/* Hero article — chiếm 2/3 */}
              <Link
                href={`/tin-tuc/${heroItem.slug}`}
                className="group lg:col-span-2 block relative"
              >
                <div className="relative h-64 sm:h-80 lg:h-[400px] bg-brand-800">
                  {heroItem.coverImageUrl ? (
                    <img
                      src={heroItem.coverImageUrl}
                      alt={heroItem.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-7xl opacity-30">🌿</span>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-brand-950/90 via-brand-950/30 to-transparent" />
                  {/* Content over image */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                    {heroItem.isPinned && (
                      <span className="inline-block bg-brand-400 text-brand-900 text-xs font-bold px-2 py-0.5 rounded mb-2 uppercase tracking-wide">
                        Tin nổi bật
                      </span>
                    )}
                    <h2 className="font-heading text-white text-xl sm:text-2xl lg:text-3xl font-bold leading-snug group-hover:text-brand-300 transition-colors line-clamp-3">
                      {heroItem.title}
                    </h2>
                    {heroItem.excerpt && (
                      <p className="mt-2 text-brand-200 text-sm line-clamp-2 hidden sm:block">
                        {heroItem.excerpt}
                      </p>
                    )}
                    <p className="mt-3 text-brand-400 text-xs">
                      {formatDate(heroItem.publishedAt)}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Sub-hero — 3 bài dọc bên phải */}
              {subHeroItems.length > 0 && (
                <div className="flex flex-col divide-y divide-brand-100 border-l border-brand-200 bg-white">
                  {subHeroItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/tin-tuc/${item.slug}`}
                      className="group flex gap-3 p-4 hover:bg-brand-50 transition-colors flex-1"
                    >
                      <div className="w-20 h-16 shrink-0 rounded overflow-hidden bg-brand-100">
                        {item.coverImageUrl ? (
                          <img
                            src={item.coverImageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand-700">
                            <span className="text-xl">🌿</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-brand-900 leading-snug group-hover:text-brand-700 line-clamp-3 transition-colors">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-xs text-brand-400">
                          {formatDate(item.publishedAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MAIN LAYOUT: danh sách + sidebar ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Danh sách bài (2/3) ─────────────────────────────────────────── */}
          <div className="lg:col-span-2">

            {/* Section heading */}
            <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-brand-800">
              <h2 className="font-heading font-bold text-brand-900 text-lg">
                {isSearch ? `Kết quả tìm kiếm` : page === 1 ? "Tin mới nhất" : `Trang ${page}`}
              </h2>
              {!isSearch && (
                <span className="text-xs text-brand-500">{total.toLocaleString("vi-VN")} tin</span>
              )}
            </div>

            {listItems.length === 0 && !heroItem ? (
              <div className="py-20 text-center">
                <p className="text-brand-500 text-lg font-medium">Không tìm thấy tin tức nào</p>
                {isSearch && (
                  <Link href="/tin-tuc" className="mt-3 inline-block text-sm text-brand-700 underline">
                    Xem tất cả tin tức
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-brand-100">
                {listItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/tin-tuc/${item.slug}`}
                    className="group flex gap-4 py-5 hover:bg-brand-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-28 h-20 sm:w-36 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-brand-100">
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand-700">
                          <span className="text-2xl">🌿</span>
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.isPinned && (
                          <span className="text-xs font-bold text-brand-700 bg-brand-100 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                            Ghim
                          </span>
                        )}
                        <span className="text-xs text-brand-400">{formatDate(item.publishedAt)}</span>
                      </div>
                      <h3 className="font-semibold text-brand-900 text-sm sm:text-base leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="mt-1 text-xs sm:text-sm text-brand-500 line-clamp-2 hidden sm:block">
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ── Pagination ────────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-brand-100 pt-6">
                {/* Mobile: Prev / Next only */}
                <div className="flex sm:hidden gap-2 w-full justify-between">
                  {page > 1 ? (
                    <Link href={buildUrl(page - 1, q)} className="px-4 py-2 rounded-lg border border-brand-300 text-sm font-medium text-brand-700 hover:bg-brand-50">
                      ← Trước
                    </Link>
                  ) : <span />}
                  <span className="text-sm text-brand-500 self-center">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link href={buildUrl(page + 1, q)} className="px-4 py-2 rounded-lg border border-brand-300 text-sm font-medium text-brand-700 hover:bg-brand-50">
                      Tiếp →
                    </Link>
                  ) : <span />}
                </div>

                {/* Desktop: full pagination */}
                <div className="hidden sm:flex items-center gap-1 flex-wrap">
                  {page > 1 && (
                    <Link href={buildUrl(page - 1, q)} className="px-3 py-1.5 rounded-md border border-brand-200 text-sm text-brand-700 hover:bg-brand-50 transition-colors">
                      ← Trước
                    </Link>
                  )}
                  {paginationRange(page, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-brand-400 text-sm select-none">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={buildUrl(p, q)}
                        className={cn(
                          "w-9 h-9 flex items-center justify-center rounded-md border text-sm font-medium transition-colors",
                          p === page
                            ? "bg-brand-800 text-white border-brand-800"
                            : "border-brand-200 text-brand-700 hover:bg-brand-50"
                        )}
                      >
                        {p}
                      </Link>
                    )
                  )}
                  {page < totalPages && (
                    <Link href={buildUrl(page + 1, q)} className="px-3 py-1.5 rounded-md border border-brand-200 text-sm text-brand-700 hover:bg-brand-50 transition-colors">
                      Tiếp →
                    </Link>
                  )}
                </div>

                <p className="hidden sm:block text-xs text-brand-400">
                  {((page - 1) * PAGE_SIZE + 1).toLocaleString("vi-VN")}–{Math.min(page * PAGE_SIZE, total).toLocaleString("vi-VN")} / {total.toLocaleString("vi-VN")}
                </p>
              </div>
            )}
          </div>

          {/* ── Sidebar (1/3) ───────────────────────────────────────────────── */}
          <aside className="lg:col-span-1 space-y-6">

            {/* Tin nổi bật */}
            <div>
              <div className="border-b-2 border-brand-800 pb-2 mb-4">
                <h3 className="font-heading font-bold text-brand-900">Tin nổi bật</h3>
              </div>
              <ul className="space-y-4">
                {featuredNews.map((item, i) => (
                  <li key={item.id}>
                    <Link
                      href={`/tin-tuc/${item.slug}`}
                      className="group flex gap-3 items-start"
                    >
                      <span className="shrink-0 w-7 h-7 rounded-full bg-brand-800 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-brand-900 group-hover:text-brand-700 leading-snug line-clamp-2 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-brand-400 mt-1">{formatDate(item.publishedAt)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Phân trang nhanh — chỉ hiển thị khi có > 1 trang */}
            {totalPages > 1 && (
              <div>
                <div className="border-b-2 border-brand-800 pb-2 mb-4">
                  <h3 className="font-heading font-bold text-brand-900">Chuyển trang nhanh</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: Math.min(totalPages, 20) }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={buildUrl(p, q)}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded border text-xs font-medium transition-colors",
                        p === page
                          ? "bg-brand-800 text-white border-brand-800"
                          : "border-brand-200 text-brand-700 hover:bg-brand-50"
                      )}
                    >
                      {p}
                    </Link>
                  ))}
                  {totalPages > 20 && (
                    <span className="text-xs text-brand-400 self-center ml-1">... {totalPages} trang</span>
                  )}
                </div>
              </div>
            )}

            {/* Subscribe / CTA */}
            <div className="bg-brand-800 rounded-xl p-5 text-white text-center">
              <div className="text-3xl mb-2">🌿</div>
              <p className="text-sm font-medium text-brand-100 leading-snug">
                Tham gia Hội Trầm Hương Việt Nam để nhận tin tức sớm nhất
              </p>
              <Link
                href="/register"
                className="mt-3 inline-block bg-brand-400 text-brand-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-300 transition-colors"
              >
                Đăng ký hội viên
              </Link>
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
