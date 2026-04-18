import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { notFound } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DocumentUploadButton } from "./DocumentUploadButton"
import { CopyDriveUrlButton } from "./CopyDriveUrlButton"
import { Prisma, DocumentCategory } from "@prisma/client"

export const revalidate = 0

const CATEGORY_LABELS: Record<string, string> = {
  CONG_VAN_DEN: "Công văn đến",
  CONG_VAN_DI: "Công văn đi",
  BIEN_BAN_HOP: "Biên bản họp",
  QUYET_DINH: "Quyết định",
  HOP_DONG: "Hợp đồng",
  DIEU_LE: "Điều lệ",
  QUY_CHE: "Quy chế",
  GIAY_PHEP: "Giấy phép",
}

const CATEGORY_BADGE: Record<string, string> = {
  CONG_VAN_DEN: "bg-blue-100 text-blue-700",
  CONG_VAN_DI: "bg-green-100 text-green-700",
  BIEN_BAN_HOP: "bg-purple-100 text-purple-700",
  QUYET_DINH: "bg-yellow-100 text-yellow-700",
  HOP_DONG: "bg-orange-100 text-orange-700",
  DIEU_LE: "bg-gray-100 text-gray-700",
  QUY_CHE: "bg-gray-100 text-gray-700",
  GIAY_PHEP: "bg-gray-100 text-gray-700",
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string; q?: string }>
}) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) notFound()

  const params = await searchParams
  const categoryFilter = params.category ?? ""
  const query = (params.q || "").trim()
  const page = Math.max(1, Number(params.page ?? 1))
  const PAGE_SIZE = 20

  const where: Prisma.DocumentWhereInput = {
    ...(categoryFilter && { category: categoryFilter as DocumentCategory }),
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { documentNumber: { contains: query, mode: "insensitive" } },
      ],
    }),
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        title: true,
        category: true,
        documentNumber: true,
        issuedDate: true,
        isPublic: true,
        fileName: true,
        fileSize: true,
        downloadCount: true,
        createdAt: true,
        driveFileId: true,
      },
    }),
    prisma.document.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const tabs = [
    { key: "", label: "Tất cả" },
    { key: "CONG_VAN_DEN", label: "CV Đến" },
    { key: "CONG_VAN_DI", label: "CV Đi" },
    { key: "BIEN_BAN_HOP", label: "Biên bản" },
    { key: "QUYET_DINH", label: "Quyết định" },
    { key: "HOP_DONG", label: "Hợp đồng" },
  ]

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (categoryFilter) p.set("category", categoryFilter)
    if (query) p.set("q", query)
    if (page > 1) p.set("page", String(page))
    for (const [k, v] of Object.entries(overrides)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    return `/admin/tai-lieu${p.toString() ? `?${p}` : ""}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Quản lý Tài liệu</h1>
          <p className="text-sm text-brand-500 mt-1">{total} tài liệu trên Google Drive</p>
        </div>
        <DocumentUploadButton />
      </div>

      <div className="bg-white p-4 rounded-xl border border-brand-200 shadow-sm space-y-4">
        <form method="GET" action="/admin/tai-lieu" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="category" value={categoryFilter} />
          
          <div className="flex-1 min-w-[280px] space-y-1.5">
            <label htmlFor="q" className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
              Tìm theo tiêu đề hoặc số hiệu
            </label>
            <div className="relative">
              <input
                type="text"
                id="q"
                name="q"
                defaultValue={query}
                placeholder="Nhập tên tài liệu, số hiệu công văn..."
                className="w-full rounded-lg border border-brand-200 bg-brand-50/30 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600">
                🔍
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-800 text-white rounded-lg text-sm font-medium hover:bg-brand-900 transition-colors"
            >
              Tìm kiếm
            </button>
            {(query) && (
              <Link
                href={buildUrl({ q: undefined, page: undefined })}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Xóa tìm kiếm
              </Link>
            )}
          </div>
        </form>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-brand-100 bg-brand-50/50 p-1 w-fit">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={buildUrl({ category: t.key || undefined, page: undefined })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                categoryFilter === t.key ? "bg-brand-700 text-white shadow-sm" : "text-brand-600 hover:bg-brand-100/80",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 whitespace-nowrap">Tài liệu</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden sm:table-cell w-[140px] whitespace-nowrap">Danh mục</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden md:table-cell w-[140px] whitespace-nowrap">Số hiệu</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden md:table-cell w-[110px] whitespace-nowrap">Ngày ban hành</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden sm:table-cell w-[90px] whitespace-nowrap">Kích cỡ</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 w-[100px] whitespace-nowrap">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-800 w-[200px] whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {documents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="text-brand-200 text-5xl mb-3">📂</div>
                  <p className="text-brand-700 font-medium">Không tìm thấy tài liệu nào</p>
                  <p className="text-xs text-brand-400 mt-1">
                    {query ? "Hãy thử thay đổi từ khóa tìm kiếm" : "Chưa có tài liệu nào trong danh mục này"}
                  </p>
                </td>
              </tr>
            )}
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-brand-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/tai-lieu/${doc.id}`} className="font-bold text-brand-900 hover:text-brand-700 transition-colors block line-clamp-1">
                    {doc.title}
                  </Link>
                  <p className="text-[10px] text-brand-400 mt-0.5 font-mono truncate max-w-xs">{doc.fileName}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={cn("text-[11px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full border whitespace-nowrap", (CATEGORY_BADGE[doc.category] || "bg-gray-100 text-gray-700").replace("bg-", "bg-opacity-10 border-"))}>
                    {CATEGORY_LABELS[doc.category] || "Tài liệu"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-brand-700 font-medium hidden md:table-cell whitespace-nowrap">{doc.documentNumber ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-brand-500 whitespace-nowrap hidden md:table-cell">
                  {doc.issuedDate ? new Date(doc.issuedDate).toLocaleDateString("vi-VN") : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-brand-400 hidden sm:table-cell whitespace-nowrap">{formatFileSize(doc.fileSize)}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border whitespace-nowrap", doc.isPublic ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200")}>
                    {doc.isPublic ? "Công khai" : "Nội bộ"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <CopyDriveUrlButton driveFileId={doc.driveFileId} />
                    <Link
                      href={`/admin/tai-lieu/${doc.id}`}
                      className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50 shadow-sm transition-all whitespace-nowrap"
                    >
                      Chi tiết
                    </Link>
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
