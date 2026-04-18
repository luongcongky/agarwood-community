import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { CertStatus } from "@prisma/client"

export const revalidate = 0 // per-request — readOnly state phụ thuộc role

const PAGE_SIZE = 20

const CERT_STATUS_LABELS: Record<CertStatus, string> = {
  DRAFT: "Chờ xác nhận TT",
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

/** Unified row shape for both data sources (Certification applications and
 *  already-approved Products) so the table template below doesn't fork. */
type CertRow = {
  id: string
  productName: string
  productSlug: string
  applicantName: string
  applicantEmail: string
  status: CertStatus
  createdAt: Date
  detailHref: string
  detailLabel: string
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

  let rows: CertRow[] = []
  let total = 0

  // Tab "Đã duyệt" reads from Product directly because seeded/legacy products
  // carry certStatus=APPROVED without ever going through the Certification
  // workflow. This keeps the admin list in sync with the viewer's
  // /san-pham-chung-nhan page.
  if (statusFilter === "approved") {
    const [products, count] = await Promise.all([
      prisma.product.findMany({
        where: { certStatus: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip,
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          owner: { select: { name: true, email: true } },
          company: { select: { name: true } },
        },
      }),
      prisma.product.count({ where: { certStatus: "APPROVED" } }),
    ])
    rows = products.map((p) => ({
      id: p.id,
      productName: p.name,
      productSlug: p.slug,
      applicantName: p.company?.name ?? p.owner.name,
      applicantEmail: p.owner.email,
      status: "APPROVED" as const,
      createdAt: p.createdAt,
      detailHref: `/vi/san-pham/${p.slug}`,
      detailLabel: "Xem sản phẩm",
    }))
    total = count
  } else {
    const where: { status?: CertStatus | { in: CertStatus[] } } = {}
    if (statusFilter === "awaiting_payment") {
      where.status = "DRAFT"
    } else if (statusFilter === "pending") {
      where.status = { in: ["PENDING", "UNDER_REVIEW"] }
    } else if (statusFilter === "rejected") {
      where.status = "REJECTED"
    }

    const [certs, count] = await Promise.all([
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
    rows = certs.map((c) => ({
      id: c.id,
      productName: c.product.name,
      productSlug: c.product.slug,
      applicantName: c.applicant.name,
      applicantEmail: c.applicant.email,
      status: c.status,
      createdAt: c.createdAt,
      detailHref: `/admin/chung-nhan/${c.id}`,
      detailLabel: "Xem xét",
    }))
    total = count
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const statusTabs = [
    { label: "Tất cả", value: "" },
    { label: "Chờ xác nhận TT", value: "awaiting_payment" },
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

  const isApprovedTab = statusFilter === "approved"

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

      {isApprovedTab && (
        <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-3 text-xs text-brand-700">
          ℹ️ Tab này liệt kê trực tiếp các sản phẩm đang có trạng thái
          <span className="font-semibold"> Chứng nhận = Đã duyệt</span>, bao gồm
          cả sản phẩm seeded (không qua đơn) và đơn đã duyệt qua workflow. Dùng
          các tab khác (Chờ xác nhận TT / Chờ duyệt / Từ chối) để xem đơn xét duyệt.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Sản phẩm
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                {isApprovedTab ? "Chủ sở hữu" : "Người nộp đơn"}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                {isApprovedTab ? "Ngày tạo SP" : "Ngày nộp"}
              </th>
              <th className="px-4 py-3 text-right font-semibold text-brand-800">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {isApprovedTab ? "Chưa có sản phẩm nào được chứng nhận" : "Không có đơn nào"}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-brand-50/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-900">{row.productName}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{row.applicantName}</p>
                  <p className="text-xs text-muted-foreground">{row.applicantEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium",
                      CERT_STATUS_CLASSES[row.status]
                    )}
                  >
                    {CERT_STATUS_LABELS[row.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {row.createdAt.toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={row.detailHref}
                    target={isApprovedTab ? "_blank" : undefined}
                    rel={isApprovedTab ? "noopener noreferrer" : undefined}
                    className="rounded-md border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                  >
                    {row.detailLabel}
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
            {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} / {total}{" "}
            {isApprovedTab ? "sản phẩm" : "đơn"}
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
