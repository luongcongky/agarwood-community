import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { CertStatus } from "@prisma/client"

export const revalidate = 0

const PAGE_SIZE = 20

const CERT_STATUS_LABELS: Record<CertStatus, string> = {
  DRAFT: "Nháp",
  PENDING: "Chờ duyệt",
  UNDER_REVIEW: "Đang xét duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  REFUNDED: "Đã hoàn tiền",
}

const CERT_STATUS_CLASSES: Record<CertStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING: "bg-yellow-100 text-yellow-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-700",
}

export default async function AdminCertificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const statusFilter = params.status ?? ""
  const page = Number(params.page ?? 1)
  const skip = (page - 1) * PAGE_SIZE

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = {}

  if (statusFilter === "pending") {
    where = { status: { in: ["PENDING", "UNDER_REVIEW"] } }
  } else if (statusFilter === "approved") {
    where = { status: "APPROVED" }
  } else if (statusFilter === "rejected") {
    where = { status: "REJECTED" }
  }

  const [certs, total] = await Promise.all([
    prisma.certification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
      include: {
        product: { select: { name: true, slug: true } },
        applicant: { select: { name: true, email: true } },
      },
    }),
    prisma.certification.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const statusTabs = [
    { label: "Tất cả", value: "" },
    { label: "Chờ duyệt", value: "pending" },
    { label: "Đã duyệt", value: "approved" },
    { label: "Từ chối", value: "rejected" },
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
    return `/admin/chung-nhan${s ? `?${s}` : ""}`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">
        Quản lý Chứng nhận Sản phẩm
      </h1>

      {/* Status filter */}
      <div className="flex gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1 w-fit">
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
                Sản phẩm
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Người nộp đơn
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Ngày nộp
              </th>
              <th className="px-4 py-3 text-right font-semibold text-brand-800">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {certs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Không có đơn nào
                </td>
              </tr>
            )}
            {certs.map((cert) => (
              <tr
                key={cert.id}
                className="hover:bg-brand-50/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-900">
                    {cert.product.name}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{cert.applicant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cert.applicant.email}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      CERT_STATUS_CLASSES[cert.status]
                    )}
                  >
                    {CERT_STATUS_LABELS[cert.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(cert.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/chung-nhan/${cert.id}`}
                    className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                  >
                    Xem xét
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
