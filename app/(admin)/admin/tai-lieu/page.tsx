import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DocumentUploadButton } from "./DocumentUploadButton"

export const revalidate = 0

const CATEGORY_LABELS: Record<string, string> = {
  CONG_VAN_DEN: "Công văn đến",
  CONG_VAN_DI: "Công văn đi",
  BIEN_BAN_HOP: "Biên bản họp",
  QUYET_DINH: "Quyết định",
  HOP_DONG: "Hợp đồng",
}

const CATEGORY_BADGE: Record<string, string> = {
  CONG_VAN_DEN: "bg-blue-100 text-blue-700",
  CONG_VAN_DI: "bg-green-100 text-green-700",
  BIEN_BAN_HOP: "bg-purple-100 text-purple-700",
  QUYET_DINH: "bg-yellow-100 text-yellow-700",
  HOP_DONG: "bg-orange-100 text-orange-700",
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") notFound()

  const params = await searchParams
  const categoryFilter = params.category ?? ""
  const page = Math.max(1, Number(params.page ?? 1))
  const PAGE_SIZE = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = categoryFilter ? { category: categoryFilter } : {}

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

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1 w-fit">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={buildUrl({ category: t.key || undefined, page: undefined })}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              categoryFilter === t.key ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-100",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">Tài liệu</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden sm:table-cell">Danh mục</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden md:table-cell">Số hiệu</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden md:table-cell">Ngày ban hành</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden sm:table-cell">Kích thước</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-800">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-200">
            {documents.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-brand-500">
                  Chưa có tài liệu nào
                </td>
              </tr>
            )}
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-brand-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/tai-lieu/${doc.id}`} className="font-medium text-brand-900 hover:text-brand-700 transition-colors">
                    {doc.title}
                  </Link>
                  <p className="text-sm text-brand-500 mt-0.5">{doc.fileName}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={cn("text-sm font-medium px-2 py-1 rounded-full", CATEGORY_BADGE[doc.category])}>
                    {CATEGORY_LABELS[doc.category]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-brand-600 hidden md:table-cell">{doc.documentNumber ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-brand-500 hidden md:table-cell">
                  {doc.issuedDate ? new Date(doc.issuedDate).toLocaleDateString("vi-VN") : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-brand-500 hidden sm:table-cell">{formatFileSize(doc.fileSize)}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-sm font-medium px-2 py-1 rounded-full", doc.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                    {doc.isPublic ? "Công khai" : "Nội bộ"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/tai-lieu/${doc.id}`}
                    className="rounded-md border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                  >
                    Chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-brand-500">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}</p>
          <div className="flex gap-1">
            {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="rounded-md border border-brand-200 px-3 py-1.5 hover:bg-brand-50">&larr;</Link>}
            {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="rounded-md border border-brand-200 px-3 py-1.5 hover:bg-brand-50">&rarr;</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
