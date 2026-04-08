import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { MediaOrderStatus } from "@prisma/client"

export const revalidate = 0
const PAGE_SIZE = 20

const STATUS_LABELS: Record<MediaOrderStatus, string> = {
  NEW: "Mới", CONFIRMED: "Đã xác nhận", IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã bàn giao", REVISION: "Chỉnh sửa", COMPLETED: "Hoàn tất", CANCELLED: "Đã huỷ",
}
const STATUS_CLASSES: Record<MediaOrderStatus, string> = {
  NEW: "bg-blue-100 text-blue-700", CONFIRMED: "bg-brand-100 text-brand-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700", DELIVERED: "bg-purple-100 text-purple-700",
  REVISION: "bg-orange-100 text-orange-700", COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-600",
}
const SERVICE_LABELS: Record<string, string> = {
  ARTICLE_COMPANY: "Bài DN", ARTICLE_PRODUCT: "Bài SP", PRESS_RELEASE: "TCBC", SOCIAL_CONTENT: "MXH",
}
const SERVICE_BADGE: Record<string, string> = {
  ARTICLE_COMPANY: "bg-blue-100 text-blue-700", ARTICLE_PRODUCT: "bg-green-100 text-green-700",
  PRESS_RELEASE: "bg-purple-100 text-purple-700", SOCIAL_CONTENT: "bg-orange-100 text-orange-700",
}

export default async function AdminMediaOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const statusFilter = (params.status ?? "") as MediaOrderStatus | ""
  const page = Math.max(1, Number(params.page ?? 1))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = statusFilter ? { status: statusFilter } : {}

  const [orders, total, cNew, cInProgress, cDelivered, cCompleted, cCancelled] = await Promise.all([
    prisma.mediaOrder.findMany({
      where, orderBy: { createdAt: "desc" }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, requesterName: true, requesterEmail: true,
        serviceType: true, status: true, budget: true, deadline: true,
        assignedTo: true, createdAt: true,
      },
    }),
    prisma.mediaOrder.count({ where }),
    prisma.mediaOrder.count({ where: { status: "NEW" } }),
    prisma.mediaOrder.count({ where: { status: "IN_PROGRESS" } }),
    prisma.mediaOrder.count({ where: { status: "DELIVERED" } }),
    prisma.mediaOrder.count({ where: { status: "COMPLETED" } }),
    prisma.mediaOrder.count({ where: { status: "CANCELLED" } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const summaryCards = [
    { label: "Mới", count: cNew, cls: "text-blue-700 border-blue-200 bg-blue-50" },
    { label: "Đang làm", count: cInProgress, cls: "text-yellow-700 border-yellow-200 bg-yellow-50" },
    { label: "Chờ duyệt", count: cDelivered, cls: "text-purple-700 border-purple-200 bg-purple-50" },
    { label: "Hoàn tất", count: cCompleted, cls: "text-green-700 border-green-200 bg-green-50" },
    { label: "Huỷ", count: cCancelled, cls: "text-gray-600 border-gray-200 bg-gray-50" },
  ]

  const statusTabs: { label: string; value: MediaOrderStatus | "" }[] = [
    { label: "Tất cả", value: "" }, { label: "Mới", value: "NEW" },
    { label: "Xác nhận", value: "CONFIRMED" }, { label: "Đang làm", value: "IN_PROGRESS" },
    { label: "Bàn giao", value: "DELIVERED" }, { label: "Hoàn tất", value: "COMPLETED" },
    { label: "Huỷ", value: "CANCELLED" },
  ]

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (statusFilter) p.set("status", statusFilter)
    if (page > 1) p.set("page", String(page))
    for (const [k, v] of Object.entries(overrides)) {
      if (v) p.set(k, v); else p.delete(k)
    }
    return `/admin/truyen-thong${p.toString() ? `?${p}` : ""}`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Quản lý Đơn Truyền thông</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className={cn("rounded-xl border p-4 text-center", c.cls)}>
            <p className="text-2xl font-bold">{c.count}</p>
            <p className="text-xs font-medium mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1 w-fit">
        {statusTabs.map((tab) => (
          <Link key={tab.value} href={buildUrl({ status: tab.value || undefined, page: undefined })}
            className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === tab.value ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-100")}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">Người đặt</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">Dịch vụ</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden sm:table-cell">Ngân sách</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden md:table-cell">Deadline</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden md:table-cell">Phụ trách</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">Trạng thái</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800 hidden sm:table-cell">Ngày đặt</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-800">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {orders.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-brand-400">Không có đơn nào</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-brand-50/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-900 text-xs">{o.requesterName}</p>
                  <p className="text-brand-400 text-xs">{o.requesterEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", SERVICE_BADGE[o.serviceType] ?? "bg-gray-100 text-gray-600")}>
                    {SERVICE_LABELS[o.serviceType] ?? o.serviceType}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-brand-500 hidden sm:table-cell">{o.budget ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-brand-500 hidden md:table-cell">
                  {o.deadline ? new Date(o.deadline).toLocaleDateString("vi-VN") : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-brand-500 hidden md:table-cell">{o.assignedTo ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex text-xs font-medium px-2 py-0.5 rounded-full", STATUS_CLASSES[o.status])}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-brand-500 hidden sm:table-cell">
                  {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/truyen-thong/${o.id}`}
                    className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors">
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
          <p className="text-brand-400">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}</p>
          <div className="flex gap-1">
            {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="rounded-md border border-brand-200 px-3 py-1.5 hover:bg-brand-50">&larr;</Link>}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
              .map((p) => (
                <Link key={p} href={buildUrl({ page: String(p) })}
                  className={cn("rounded-md border px-3 py-1.5 transition-colors",
                    p === page ? "bg-brand-700 text-white border-brand-700" : "border-brand-200 hover:bg-brand-50")}>
                  {p}
                </Link>
              ))}
            {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="rounded-md border border-brand-200 px-3 py-1.5 hover:bg-brand-50">&rarr;</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
