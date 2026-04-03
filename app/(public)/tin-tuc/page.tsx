import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

export const revalidate = 3600

const PAGE_SIZE = 9

function buildUrl(p: number, q: string, category: string) {
  const params = new URLSearchParams()
  if (p > 1) params.set("page", String(p))
  if (q) params.set("q", q)
  if (category) params.set("category", category)
  const qs = params.toString()
  return `/tin-tuc${qs ? `?${qs}` : ""}`
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; q?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const category = params.category ?? ""
  const q = params.q ?? ""

  const where = {
    isPublished: true,
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { excerpt: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  }

  const [total, newsList] = await Promise.all([
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
    <div>
      {/* Page Banner */}
      <section className="bg-brand-800 py-16 px-4 text-center">
        <h1 className="font-heading text-4xl font-bold text-brand-100">Tin tức</h1>
        <p className="mt-2 text-brand-300 text-lg">
          Thông tin &amp; Cập nhật từ Hội Trầm Hương Việt Nam
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search Bar */}
        <form method="GET" action="/tin-tuc" className="mb-8 flex gap-2 max-w-lg mx-auto">
          <input type="hidden" name="page" value="1" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Tìm kiếm tin tức..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-700 text-brand-100 px-5 py-2.5 text-sm font-medium hover:bg-brand-800 transition-colors"
          >
            Tìm kiếm
          </button>
        </form>

        {/* News Grid */}
        {newsList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground font-medium">
              Không tìm thấy tin tức nào
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {q
                ? `Không có kết quả cho "${q}". Thử từ khóa khác nhé.`
                : "Chưa có tin tức nào được đăng."}
            </p>
            {q && (
              <Link
                href="/tin-tuc"
                className="mt-4 inline-block text-brand-700 underline text-sm"
              >
                Xem tất cả tin tức
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsList.map((item) => (
              <Link
                key={item.id}
                href={`/tin-tuc/${item.slug}`}
                className="group block bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border"
              >
                {/* Cover Image */}
                {item.coverImageUrl ? (
                  <img
                    src={item.coverImageUrl}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-brand-700 flex items-center justify-center">
                    <span className="text-4xl">🌿</span>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  {/* Pinned Badge */}
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-800 bg-brand-100 px-2 py-0.5 rounded-full">
                      📌 Ghim
                    </span>
                  )}

                  {/* Title */}
                  <h2 className="font-heading font-semibold text-foreground text-base leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                    {item.title}
                  </h2>

                  {/* Excerpt */}
                  {item.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-2">{item.excerpt}</p>
                  )}

                  {/* Date & Read more */}
                  <div className="flex items-center justify-between pt-1">
                    {item.publishedAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.publishedAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <span className="text-xs text-brand-700 font-medium">Đọc tiếp →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2 flex-wrap">
            {/* Previous */}
            {page > 1 ? (
              <Link
                href={buildUrl(page - 1, q, category)}
                className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                ← Trước
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground opacity-50 cursor-not-allowed">
                ← Trước
              </span>
            )}

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl(p, q, category)}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm transition-colors",
                  p === page
                    ? "bg-brand-700 text-brand-100 border-brand-700 font-semibold"
                    : "border-border hover:bg-muted"
                )}
              >
                {p}
              </Link>
            ))}

            {/* Next */}
            {page < totalPages ? (
              <Link
                href={buildUrl(page + 1, q, category)}
                className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                Tiếp →
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground opacity-50 cursor-not-allowed">
                Tiếp →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
