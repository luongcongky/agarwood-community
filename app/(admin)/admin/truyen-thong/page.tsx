import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { MediaOrderStatus } from "@prisma/client"

export const revalidate = 0

const PAGE_SIZE = 20

const STATUS_LABELS: Record<MediaOrderStatus, string> = {
  NEW: "Mới",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã bàn giao",
  REVISION: "Chỉnh sửa",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
}

const STATUS_CLASSES: Record<MediaOrderStatus, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-brand-100 text-brand-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  DELIVERED: "bg-purple-100 text-purple-700",
  REVISION: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-600",
}

const SERVICE_LABELS: Record<string, string> = {
  ARTICLE_COMPANY: "Bài doanh nghiệp",
  ARTICLE_PRODUCT: "Bài sản phẩm",
  PRESS_RELEASE: "Thông cáo báo chí",
  SOCIAL_CONTENT: "Nội dung MXH",
}

export default async function AdminMediaOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const statusFilter = (params.status ?? "") as MediaOrderStatus | ""
  const page = Number(params.page ?? 1)
  const skip = (page - 1) * PAGE_SIZE

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = statusFilter ? { status: statusFilter } : {}

  const [orders, total] = await Promise.all([
    prisma.mediaOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
      select: {
        id: true,
        requesterName: true,
        requesterEmail: true,
        serviceType: true,
        status: true,
        budget: true,
        createdAt: true,
      },
    }),
    prisma.mediaOrder.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const statusTabs: { label: string; value: MediaOrderStatus | "" }[] = [
    { label: "Tất cả", value: "" },
    { label: "Mới", value: "NEW" },
    { label: "Xác nhận", value: "CONFIRMED" },
    { label: "Đang thực hiện", value: "IN_PROGRESS" },
    { label: "Hoàn tất", value: "COMPLETED" },
    { label: "Đã huỷ", value: "CANCELLED" },
  ]

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (statusFilter) p.set("status", statusFilter)
    if (page > 1) p.set("page", String(page))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v !== undefined && v !== "") p.set(k, v)
      else p.delete(k)
    })
    const s = p.toString()
    return `/admin/truyen-thong${s ? `?${s}` : ""}`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">
        Quản lý Đơn Truyền thông
      </h1>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1 w-fit">
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={buildUrl({ status: tab.value, page: "1" })}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === tab.value
                ? "bg-brand-700 text-white"
                : "text-brand-700 hover:bg-brand-100"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Người đặt
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Dịch vụ
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Ngân sách
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Ngày đặt
              </th>
              <th className="px-4 py-3 text-right font-semibold text-brand-800">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Không có đơn nào
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-brand-50/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-900">
                    {order.requesterName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.requesterEmail}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {SERVICE_LABELS[order.serviceType] ?? order.serviceType}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {order.budget ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_CLASSES[order.status]
                    )}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/truyen-thong/${order.id}`}
                    className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
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
          <p className="text-muted-foreground">
            {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} / {total} đơn
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-md border px-3 py-1.5 hover:bg-brand-50 transition-colors"
              >
                &larr;
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <Link
                  key={p}
                  href={buildUrl({ page: String(p) })}
                  className={cn(
                    "rounded-md border px-3 py-1.5 transition-colors",
                    p === page
                      ? "bg-brand-700 text-white border-brand-700"
                      : "hover:bg-brand-50"
                  )}
                >
                  {p}
                </Link>
              ))}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-md border px-3 py-1.5 hover:bg-brand-50 transition-colors"
              >
                &rarr;
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
