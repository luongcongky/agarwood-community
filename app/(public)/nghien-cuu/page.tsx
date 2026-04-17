import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nghiên cứu khoa học | Hội Trầm Hương Việt Nam",
  description:
    "Các báo cáo nghiên cứu khoa học, bài báo học thuật về cây dó bầu, trầm hương và ngành trầm hương Việt Nam.",
  alternates: { canonical: "/nghien-cuu" },
}

export const revalidate = 3600

const PAGE_SIZE = 12

function buildUrl(p: number, q: string) {
  const params = new URLSearchParams()
  if (p > 1) params.set("page", String(p))
  if (q) params.set("q", q)
  const qs = params.toString()
  return `/nghien-cuu${qs ? `?${qs}` : ""}`
}

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

export default async function ResearchPage({
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
    category: "RESEARCH" as const,
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { excerpt: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  }

  const [total, researchList] = await Promise.all([
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
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-brand-50/60">

      {/* ── Page Banner ─────────────────────────────────────────────────────── */}
      <div className="bg-brand-800 py-14 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">
          Nghiên cứu khoa học
        </h1>
        <p className="mt-2 text-brand-300 text-base max-w-2xl mx-auto">
          Báo cáo khoa học, bài báo học thuật về cây dó bầu, trầm hương và
          ngành trầm hương Việt Nam
        </p>
      </div>

      {/* ── Search bar ───────────────────────────────────────────────────────── */}
      <div className="border-b border-brand-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <form method="GET" action="/nghien-cuu" className="flex gap-2 max-w-lg">
            <input type="hidden" name="page" value="1" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Tìm kiếm nghiên cứu..."
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
                href="/nghien-cuu"
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

      <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-4 sm:p-6 lg:p-8">

        {/* Section heading */}
        <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-brand-800">
          <h2 className="font-bold text-brand-900 text-lg">
            {isSearch ? "Kết quả tìm kiếm" : page === 1 ? "Bài nghiên cứu mới nhất" : `Trang ${page}`}
          </h2>
          {!isSearch && (
            <span className="text-xs text-brand-500">
              {total.toLocaleString("vi-VN")} bài
            </span>
          )}
        </div>

        {researchList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-200 p-16 text-center">
            <AgarwoodPlaceholder className="w-20 h-20 mx-auto mb-4" size="lg" shape="full" tone="light" />
            <p className="text-brand-700 text-lg font-medium">
              {isSearch ? "Không tìm thấy bài nghiên cứu phù hợp" : "Chưa có bài nghiên cứu nào được công bố"}
            </p>
            <p className="text-brand-500 text-sm mt-2">
              Nội dung sẽ được cập nhật bởi Ban Quản trị Hội.
            </p>
            {isSearch && (
              <Link href="/nghien-cuu" className="mt-4 inline-block text-sm text-brand-700 underline">
                Xem tất cả nghiên cứu
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {researchList.map((item) => (
              <Link
                key={item.id}
                href={`/nghien-cuu/${item.slug}`}
                className="group bg-white rounded-xl border border-brand-200 overflow-hidden hover:shadow-lg hover:border-brand-400 transition-all flex flex-col"
              >
                {/* Cover */}
                <div className="relative h-44 bg-brand-100 overflow-hidden">
                  {item.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.coverImageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <AgarwoodPlaceholder className="w-full h-full" size="lg" shape="square" />
                  )}
                  {item.isPinned && (
                    <span className="absolute top-3 left-3 bg-brand-400 text-brand-900 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide shadow">
                      Nổi bật
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-white/90 text-brand-800 text-xs font-medium px-2 py-0.5 rounded border border-brand-200">
                    📚 Nghiên cứu
                  </span>
                </div>

                {/* Text */}
                <div className="p-5 flex flex-col flex-1 gap-2">
                  <h3 className="font-bold text-brand-900 leading-snug group-hover:text-brand-700 transition-colors line-clamp-3">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="text-sm text-brand-600 line-clamp-3 flex-1">
                      {item.excerpt}
                    </p>
                  )}
                  <p className="text-xs text-brand-400 mt-auto pt-1">
                    {formatDate(item.publishedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-between border-t border-brand-200 pt-6">
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
      </div>
    </div>
  )
}
