import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DeleteNewsButton } from "./DeleteNewsButton"
import { NewsListToggle } from "./NewsListToggles"
import { PinSectionChips } from "./PinSectionChips"
import { Prisma, NewsCategory, NewsTemplate } from "@prisma/client"

/** Label + style cho từng NewsCategory — dùng ở badge cột "Phân loại" và
 *  filter dropdown. Phase 3.3 (2026-04) mở rộng thêm BUSINESS + PRODUCT. */
const CATEGORY_BADGE: Record<NewsCategory, { label: string; cls: string }> = {
  GENERAL: {
    label: "📰 Tin tức",
    cls: "bg-blue-50 text-blue-700 border border-blue-100",
  },
  RESEARCH: {
    label: "📚 Nghiên cứu",
    cls: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  },
  BUSINESS: {
    label: "🏢 Doanh nghiệp",
    cls: "bg-purple-50 text-purple-700 border border-purple-100",
  },
  PRODUCT: {
    label: "📦 Sản phẩm",
    cls: "bg-teal-50 text-teal-700 border border-teal-100",
  },
  LEGAL: {
    label: "⚖️ Pháp lý",
    cls: "bg-amber-50 text-amber-700 border border-amber-100",
  },
  SPONSORED_PRODUCT: {
    label: "💰 Bài SP (legacy)",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  // Phase 3.5 (2026-04)
  EXTERNAL_NEWS: {
    label: "📰 Tin báo chí",
    cls: "bg-sky-50 text-sky-700 border border-sky-100",
  },
  AGRICULTURE: {
    label: "🌾 Khuyến nông",
    cls: "bg-lime-50 text-lime-700 border border-lime-100",
  },
}

/** Map category + slug → URL public tương ứng. Trả null nếu category không
 *  có public route (vd LEGAL với slug khác 2 slug đặc biệt). LEGAL có 2 slug
 *  mapping thẳng tới /privacy + /terms (xem lib/legal-pages.ts). */
function publicPathFor(category: NewsCategory, slug: string): string | null {
  if (category === "LEGAL") {
    if (slug === "chinh-sach-bao-mat") return "/vi/privacy"
    if (slug === "dieu-khoan-su-dung") return "/vi/terms"
    return null
  }
  if (category === "RESEARCH") return `/vi/nghien-cuu/${slug}`
  // Phase 3.5 (2026-04)
  if (category === "EXTERNAL_NEWS") return `/vi/tin-bao-chi/${slug}`
  if (category === "AGRICULTURE") return `/vi/khuyen-nong/${slug}`
  // GENERAL, BUSINESS, PRODUCT, SPONSORED_PRODUCT → /tin-tuc
  return `/vi/tin-tuc/${slug}`
}

// Admin list không cần real-time — mỗi POST/PATCH/DELETE news đã gọi
// `revalidatePath("/admin/tin-tuc")` nên sau khi admin tạo/sửa/xóa quay về
// là đã fresh. 30s là fallback cho phòng trường hợp CRUD bên ngoài (seed
// script, Prisma Studio).
export const revalidate = 30

type Props = {
  searchParams: Promise<{
    q?: string
    cat?: string
    tpl?: string
    from?: string
    to?: string
    page?: string
    /** Filter theo bài đang được ghim ở section trang chủ nào (Phase 3.7
     *  round 4, 2026-04). Value = NewsCategory enum string. */
    pin?: string
  }>
}

/** Parse `YYYY-MM-DD` từ <input type="date"> → Date hoặc null. Tham số phụ
 *  `endOfDay=true` set 23:59:59.999 (cho upper bound). */
function parseDateInput(s: string | undefined, endOfDay = false): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(d.getTime())) return null
  if (endOfDay) d.setHours(23, 59, 59, 999)
  return d
}

/** Label cho NewsTemplate filter — Phase 3.7 round 4 (2026-04). Customer
 *  cần tìm nhanh tin Multimedia (PHOTO/VIDEO) trong list. */
const TEMPLATE_LABEL: Record<NewsTemplate, string> = {
  NORMAL: "📝 Tin thường",
  PHOTO: "📷 Tin ảnh",
  VIDEO: "🎬 Tin video",
}

export default async function AdminNewsPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params.q?.trim() || ""
  const category = params.cat || ""
  const template = params.tpl || ""
  const from = params.from || ""
  const to = params.to || ""
  const pin = params.pin || ""
  const page = Math.max(1, Number(params.page ?? 1))
  const PAGE_SIZE = 20

  // Phase 3.7 round 4 (2026-04): filter theo Ngày đăng (publishedAt).
  // Bài draft (publishedAt=null) không xuất hiện khi có range — đúng vì
  // user chọn ngày đăng = chỉ quan tâm bài đã publish.
  const fromDate = parseDateInput(from, false)
  const toDate = parseDateInput(to, true)
  const publishedAtFilter =
    fromDate || toDate
      ? {
          publishedAt: {
            ...(fromDate && { gte: fromDate }),
            ...(toDate && { lte: toDate }),
          },
        }
      : {}

  const where: Prisma.NewsWhereInput = {
    ...(query && {
      title: { contains: query, mode: "insensitive" },
    }),
    ...(category && {
      category: category as NewsCategory,
    }),
    ...(template && {
      template: template as NewsTemplate,
    }),
    ...(pin && {
      pinnedInCategories: { has: pin as NewsCategory },
    }),
    ...publishedAtFilter,
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
        template: true,
        isPublished: true,
        isPinned: true,
        // Phase 3.7 round 4 (2026-04): per-section pin trên trang chủ —
        // dùng cho cột "Ghim trang chủ" với 5 chip toggle.
        pinnedInCategories: true,
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
    if (template) p.set("tpl", template)
    if (from) p.set("from", from)
    if (to) p.set("to", to)
    if (pin) p.set("pin", pin)
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
              <option value="BUSINESS">🏢 Doanh nghiệp</option>
              <option value="PRODUCT">📦 Sản phẩm</option>
              {/* Phase 3.5 (2026-04) */}
              <option value="EXTERNAL_NEWS">📰 Tin báo chí</option>
              <option value="AGRICULTURE">🌾 Khuyến nông</option>
              <option value="LEGAL">⚖️ Pháp lý</option>
              <option value="SPONSORED_PRODUCT">💰 Bài SP (legacy)</option>
            </select>
          </div>

          {/* Template filter — Phase 3.7 round 4 (2026-04). Khách cần tìm
              nhanh tin Multimedia (PHOTO + VIDEO) trong list. */}
          <div className="w-[160px] space-y-1.5">
            <label htmlFor="tpl" className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Loại bài
            </label>
            <select
              id="tpl"
              name="tpl"
              defaultValue={template}
              className="w-full rounded-lg border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none"
            >
              <option value="">Tất cả</option>
              <option value="NORMAL">📝 Tin thường</option>
              <option value="PHOTO">📷 Tin ảnh</option>
              <option value="VIDEO">🎬 Tin video</option>
            </select>
          </div>

          {/* Pin filter — Phase 3.7 round 4 (2026-04). Filter bài đang được
              ghim ở section trang chủ nào (admin curate quick view). */}
          <div className="w-[180px] space-y-1.5">
            <label htmlFor="pin" className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Ghim section
            </label>
            <select
              id="pin"
              name="pin"
              defaultValue={pin}
              className="w-full rounded-lg border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none"
            >
              <option value="">Tất cả</option>
              <option value="GENERAL">📌 Tin Hội</option>
              <option value="RESEARCH">📌 Nghiên cứu KH</option>
              <option value="BUSINESS">📌 Tin doanh nghiệp</option>
              <option value="PRODUCT">📌 Tin sản phẩm</option>
              <option value="AGRICULTURE">📌 Tin khuyến nông</option>
            </select>
          </div>

          {/* Date range filter — publishedAt. Phase 3.7 round 4 (2026-04). */}
          <div className="w-[160px] space-y-1.5">
            <label htmlFor="from" className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Ngày đăng từ
            </label>
            <input
              type="date"
              id="from"
              name="from"
              defaultValue={from}
              max={to || undefined}
              className="w-full rounded-lg border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <div className="w-[160px] space-y-1.5">
            <label htmlFor="to" className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Đến
            </label>
            <input
              type="date"
              id="to"
              name="to"
              defaultValue={to}
              min={from || undefined}
              className="w-full rounded-lg border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-800 text-white rounded-lg text-sm font-medium hover:bg-brand-900 transition-colors"
            >
              Lọc
            </button>
            {(query || category || template || pin || from || to) && (
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
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[60px] whitespace-nowrap">
                No
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 whitespace-nowrap">
                Tiêu đề
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[140px] whitespace-nowrap">
                Phân loại
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[110px] whitespace-nowrap">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[110px] whitespace-nowrap" title="isPinned global — bài hiện badge 'Nổi bật' ở list page sidebar">
                Nổi bật
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[170px] whitespace-nowrap" title="pinnedInCategories — admin pin bài lên TOP các section trang chủ. Click chip để toggle.">
                Ghim trang chủ
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[80px] whitespace-nowrap">
                SEO
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[100px] whitespace-nowrap">
                Ngày đăng
              </th>
              <th className="px-4 py-3 text-right font-semibold text-brand-800 w-[230px] whitespace-nowrap">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {newsList.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center"
                >
                  <div className="text-brand-300 text-4xl mb-2">🔍</div>
                  <p className="text-brand-700 font-medium">Không tìm thấy tin tức nào</p>
                  <p className="text-xs text-brand-400 mt-1">
                    {(query || category || template || pin || from || to) ? "Hãy thử thay đổi từ khóa hoặc bộ lọc" : "Hệ thống chưa có dữ liệu tin tức"}
                  </p>
                </td>
              </tr>
            )}
            {newsList.map((news, idx) => (
              <tr
                key={news.id}
                className="hover:bg-brand-50/50 transition-colors"
              >
                <td className="px-4 py-3 text-xs font-mono text-brand-500 tabular-nums">
                  {(page - 1) * PAGE_SIZE + idx + 1}
                </td>
                <td className="px-4 py-3 min-w-[300px]">
                  <p className="font-semibold text-brand-900 line-clamp-1 leading-relaxed" title={news.title}>
                    {/* Template marker — chỉ show khi PHOTO/VIDEO để khỏi
                        làm rối list (NORMAL chiếm đa số). */}
                    {news.template !== "NORMAL" && (
                      <span
                        className="mr-1.5 inline-flex items-center rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200 align-middle"
                        title={TEMPLATE_LABEL[news.template]}
                      >
                        {news.template === "PHOTO" ? "📷 Ảnh" : "🎬 Video"}
                      </span>
                    )}
                    {news.title}
                  </p>
                  <p className="text-[10px] text-brand-400 font-mono mt-0.5 truncate max-w-[200px]">{news.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-tight whitespace-nowrap",
                      CATEGORY_BADGE[news.category]?.cls ??
                        "bg-blue-50 text-blue-700 border border-blue-100",
                    )}
                  >
                    {CATEGORY_BADGE[news.category]?.label ?? "📰 Tin tức"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <NewsListToggle
                    newsId={news.id}
                    field="isPublished"
                    value={news.isPublished}
                  />
                </td>
                <td className="px-4 py-3">
                  <NewsListToggle
                    newsId={news.id}
                    field="isPinned"
                    value={news.isPinned}
                  />
                </td>
                <td className="px-4 py-3">
                  <PinSectionChips
                    newsId={news.id}
                    pinnedInCategories={news.pinnedInCategories}
                  />
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
                    {/* Xem — link tới public page tương ứng category. Disable
                        nếu chưa xuất bản (public route trả 404). */}
                    {(() => {
                      const publicHref = publicPathFor(news.category, news.slug)
                      if (!news.isPublished || !publicHref) {
                        return (
                          <span
                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-400 cursor-not-allowed"
                            title={
                              !news.isPublished
                                ? "Bài chưa xuất bản — không có URL công khai"
                                : "Loại bài này không có trang công khai"
                            }
                          >
                            Xem
                          </span>
                        )
                      }
                      return (
                        <a
                          href={publicHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50 hover:border-brand-300 transition-all shadow-sm"
                          title="Xem trên trang công khai (mở tab mới)"
                        >
                          Xem ↗
                        </a>
                      )
                    })()}
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
