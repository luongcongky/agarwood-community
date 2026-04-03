import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const revalidate = 0

const PAGE_SIZE = 20

function getMembershipStatus(user: {
  isActive: boolean
  membershipExpires: Date | null
  role: string
}): { label: string; className: string; daysLeft?: number } {
  if (!user.isActive) {
    return {
      label: "Vô hiệu hoá",
      className: "bg-gray-100 text-gray-600",
    }
  }
  if (!user.membershipExpires) {
    return { label: "Đã hết hạn", className: "bg-red-100 text-red-700" }
  }
  const now = new Date()
  const expires = new Date(user.membershipExpires)
  const daysLeft = Math.ceil(
    (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysLeft <= 0) {
    return { label: "Đã hết hạn", className: "bg-red-100 text-red-700" }
  }
  if (daysLeft <= 30) {
    return {
      label: `Sắp hết hạn (${daysLeft} ngày)`,
      className: "bg-yellow-100 text-yellow-700",
      daysLeft,
    }
  }
  return {
    label: "Active",
    className: "bg-green-100 text-green-700",
    daysLeft,
  }
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const q = params.q ?? ""
  const status = params.status ?? ""
  const page = Number(params.page ?? 1)

  const now = new Date()
  const thirtyDaysLater = new Date(now)
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = { role: "VIP" }

  if (status === "active") {
    where = { role: "VIP", membershipExpires: { gt: now } }
  } else if (status === "expired") {
    where = {
      role: "VIP",
      OR: [
        { membershipExpires: { lt: now } },
        { membershipExpires: null },
      ],
    }
  } else if (status === "expiring") {
    where = {
      role: "VIP",
      membershipExpires: { gt: now, lt: thirtyDaysLater },
    }
  }

  if (q) {
    where = {
      ...where,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }
  }

  const skip = (page - 1) * PAGE_SIZE

  const [members, total, countVIP] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isActive: true,
        membershipExpires: true,
        contributionTotal: true,
        displayPriority: true,
        role: true,
        company: { select: { name: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: "VIP" } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const statusTabs = [
    { label: "Tất cả", value: "" },
    { label: "Active", value: "active" },
    { label: "Sắp hết hạn", value: "expiring" },
    { label: "Đã hết hạn", value: "expired" },
  ]

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (status) p.set("status", status)
    if (page > 1) p.set("page", String(page))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v !== undefined && v !== "") p.set(k, v)
      else p.delete(k)
    })
    const s = p.toString()
    return `/admin/hoi-vien${s ? `?${s}` : ""}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Quản lý Hội viên</h1>
        <Link
          href="/admin/hoi-vien/tao-moi"
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
        >
          + Tạo tài khoản VIP
        </Link>
      </div>

      {/* Warning banner */}
      {countVIP >= 100 && (
        <div className="rounded-xl border border-yellow-400 bg-yellow-50 p-4 text-sm text-yellow-800 font-medium">
          ⚠️ Đã đạt giới hạn 100 tài khoản VIP
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <form method="GET" className="flex-1">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Tìm kiếm tên, email..."
            className="w-full rounded-lg border border-brand-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </form>

        {/* Status tabs */}
        <div className="flex gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1">
          {statusTabs.map((tab) => (
            <Link
              key={tab.value}
              href={buildUrl({ status: tab.value, page: "1" })}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                status === tab.value
                  ? "bg-brand-700 text-white"
                  : "text-brand-700 hover:bg-brand-100"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Hội viên
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Doanh nghiệp
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Đóng góp
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-800">
                Hết hạn
              </th>
              <th className="px-4 py-3 text-right font-semibold text-brand-800">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Không có hội viên nào
                </td>
              </tr>
            )}
            {members.map((member) => {
              const memberStatus = getMembershipStatus(member)
              const expiresDate = member.membershipExpires
                ? new Date(member.membershipExpires).toLocaleDateString("vi-VN")
                : "—"

              return (
                <tr key={member.id} className="hover:bg-brand-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-200 text-brand-800 text-xs font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-brand-900">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {member.company?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-800">
                    {(member.contributionTotal / 1_000_000).toFixed(1)}M
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        memberStatus.className
                      )}
                    >
                      {memberStatus.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {expiresDate}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/hoi-vien/${member.id}`}
                        className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                      >
                        Chi tiết
                      </Link>
                      {member.isActive && (
                        <form
                          action={`/api/admin/users/${member.id}/toggle-active`}
                          method="POST"
                        >
                          <button
                            type="submit"
                            className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            onClick={(e) => {
                              if (
                                !window.confirm(
                                  `Vô hiệu hoá tài khoản ${member.name}?`
                                )
                              ) {
                                e.preventDefault()
                              }
                            }}
                          >
                            Vô hiệu hóa
                          </button>
                        </form>
                      )}
                      {!member.isActive && (
                        <form
                          action={`/api/admin/users/${member.id}/toggle-active`}
                          method="POST"
                        >
                          <button
                            type="submit"
                            className="rounded-md border border-green-300 px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
                          >
                            Kích hoạt
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Hiển thị {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} / {total} hội viên
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

      <p className="text-xs text-muted-foreground">
        Không có chức năng xoá tài khoản. Chỉ vô hiệu hoá.
      </p>
    </div>
  )
}
