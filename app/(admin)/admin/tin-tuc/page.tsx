import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DeleteNewsButton } from "./DeleteNewsButton"
import { Prisma, NewsCategory } from "@prisma/client"

// Admin list không cần real-time — mỗi POST/PATCH/DELETE news đã gọi
// `revalidatePath("/admin/tin-tuc")` nên sau khi admin tạo/sửa/xóa quay về
// là đã fresh. 30s là fallback cho phòng trường hợp CRUD bên ngoài (seed
// script, Prisma Studio).
export const revalidate = 30

type Props = {
  searchParams: Promise<{
    q?: string
    cat?: string
    page?: string
  }>
}

export default async function AdminNewsPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params.q?.trim() || ""
  const category = params.cat || ""
  const page = Math.max(1, Number(params.page ?? 1))
  const PAGE_SIZE = 20

  const where: Prisma.NewsWhereInput = {
    ...(query && {
      title: { contains: query, mode: "insensitive" },
    }),
    ...(category && {
      category: category as NewsCategory,
    }),
  }

  const [newsList, total] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        isPublished: true,
        isPinned: true,
        publishedAt: true,
        createdAt: true,
        seoScore: true,
      },
    }),
    prisma.news.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (query) p.set("q", query)
    if (category) p.set("cat", category)
    if (page > 1) p.set("page", String(page))
    for (const [k, v] of Object.entries(overrides)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    const search = p.toString()
    return `/admin/tin-tuc${search ? `?${search}` : ""}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Quản lý Tin tức</h1>
        <Link
          href="/admin/tin-tuc/moi"
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
        >
          + Tạo tin tức mới
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-brand-200 shadow-sm">
        <form method="GET" action="/admin/tin-tuc" className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[240px] space-y-1.5">
            <label htmlFor="q" className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Tìm theo tiêu đề
            </label>
            <input
              type="text"
              id="q"
              name="q"
              defaultValue={query}
              placeholder="Nhập tiêu đề tin tức..."
              className="w-full rounded-lg border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="w-[180px] space-y-1.5">
            <label htmlFor="cat" className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Phân loại
            </label>
            <select
              id="cat"
              name="cat"
              defaultValue={category}
              className="w-full rounded-lg border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none"
            >
              <option value="">Tất cả</option>
              <option value="GENERAL">📰 Tin tức</option>
              <option value="RESEARCH">📚 Nghiên cứu</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-800 text-white rounded-lg text-sm font-medium hover:bg-brand-900 transition-colors"
            >
              Lọc
            </button>
            {(query || category) && (
              <Link
                href="/admin/tin-tuc"
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Xóa lọc
              </Link>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 whitespace-nowrap">
                Tiêu đề
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[140px] whitespace-nowrap">
                Phân loại
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[110px] whitespace-nowrap">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[80px] whitespace-nowrap">
                Ghim
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[80px] whitespace-nowrap">
                SEO
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[100px] whitespace-nowrap">
                Ngày đăng
              </th>
              <th className="px-4 py-3 text-right font-semibold text-brand-800 w-[180px] whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {newsList.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center"
                >
                  <div className="text-brand-300 text-4xl mb-2">🔍</div>
                  <p className="text-brand-700 font-medium">Không tìm thấy tin tức nào</p>
                  <p className="text-xs text-brand-400 mt-1">
                    {(query || category) ? "Hãy thử thay đổi từ khóa hoặc bộ lọc" : "Hệ thống chưa có dữ liệu tin tức"}
                  </p>
                </td>
              </tr>
            )}
            {newsList.map((news) => (
              <tr
                key={news.id}
                className="hover:bg-brand-50/50 transition-colors"
              >
                <td className="px-4 py-3 min-w-[300px]">
                  <p className="font-semibold text-brand-900 line-clamp-1 leading-relaxed" title={news.title}>
                    {news.title}
                  </p>
                  <p className="text-[10px] text-brand-400 font-mono mt-0.5 truncate max-w-[200px]">{news.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-tight whitespace-nowrap",
                      news.category === "RESEARCH"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        : news.category === "LEGAL"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : news.category === "SPONSORED_PRODUCT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100",
                    )}
                  >
                    {news.category === "RESEARCH"
                      ? "📚 Nghiên cứu"
                      : news.category === "LEGAL"
                        ? "⚖️ Pháp lý"
                        : news.category === "SPONSORED_PRODUCT"
                          ? "💰 Bài SP"
                          : "📰 Tin tức"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                      news.isPublished
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-gray-50 text-gray-500 border border-gray-200"
                    )}
                  >
                    {news.isPublished ? "Đã xuất bản" : "Nháp"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {news.isPinned ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700">
                      📌
                    </span>
                  ) : "-"}
                </td>
                <td className="px-4 py-3">
                  {news.seoScore == null ? (
                    <span className="text-[11px] text-brand-300 italic">Chưa chấm</span>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold border whitespace-nowrap",
                        news.seoScore >= 80
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : news.seoScore >= 50
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200",
                      )}
                      title={`Điểm SEO ${news.seoScore}/100`}
                    >
                      {news.seoScore}/100
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-brand-500 whitespace-nowrap">
                  {news.publishedAt
                    ? new Date(news.publishedAt).toLocaleDateString("vi-VN")
                    : new Date(news.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                    <Link
                      href={`/admin/tin-tuc/${news.id}`}
                      className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50 hover:border-brand-300 transition-all shadow-sm"
                    >
                      Chỉnh sửa
                    </Link>
                    <DeleteNewsButton newsId={news.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs px-2 pt-2 border-t border-brand-100">
          <p className="text-brand-400 italic">Hiển thị từ {(page - 1) * PAGE_SIZE + 1} đến {Math.min(page * PAGE_SIZE, total)} trong tổng số {total} kết quả</p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-700 hover:bg-brand-50 transition-colors">
                ← Trước
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-700 hover:bg-brand-50 transition-colors">
                Tiếp →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
