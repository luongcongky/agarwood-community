import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { DashboardCharts } from "./DashboardCharts"

export const revalidate = 0

const MONTH_NAMES = [
  "Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6",
  "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12",
]

function groupByMonth<T extends { createdAt: Date }>(
  items: T[],
  valueKey?: keyof T
) {
  const map: Record<number, number> = {}
  for (const item of items) {
    const m = new Date(item.createdAt).getMonth()
    if (valueKey) {
      map[m] = (map[m] ?? 0) + (item[valueKey] as unknown as number)
    } else {
      map[m] = (map[m] ?? 0) + 1
    }
  }
  return map
}

export default async function AdminDashboardPage() {
  const now = new Date()
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
  const thirtyDaysLater = new Date(now)
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    totalVIP,
    activeMemberships,
    pendingCerts,
    newMediaOrders,
    monthlyPayments,
    expiringMembers,
    longPendingCerts,
    unhandledReports,
    newVIPUsers,
    allMemberships,
    pendingPayments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "VIP" } }),
    prisma.user.count({
      where: { role: "VIP", membershipExpires: { gt: now } },
    }),
    prisma.certification.count({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    }),
    prisma.mediaOrder.count({ where: { status: "NEW" } }),
    prisma.payment.findMany({
      where: {
        status: "SUCCESS",
        type: "MEMBERSHIP_FEE",
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: {
        role: "VIP",
        membershipExpires: { gt: now, lt: thirtyDaysLater },
      },
      select: { id: true, name: true, membershipExpires: true },
    }),
    prisma.certification.findMany({
      where: { status: "PENDING", createdAt: { lt: sevenDaysAgo } },
      select: { id: true, createdAt: true },
    }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({
      where: { role: "VIP", createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.membership.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { amountPaid: true, createdAt: true },
    }),
    prisma.payment.count({ where: { status: "PENDING" } }),
  ])

  // Build chart data
  const revenueByMonth = groupByMonth(monthlyPayments, "amount")
  const membersByMonth = groupByMonth(newVIPUsers)

  const revenueData = MONTH_NAMES.map((month, i) => ({
    month,
    revenue: Math.round((revenueByMonth[i] ?? 0) / 1_000_000),
  }))

  const membersData = MONTH_NAMES.map((month, i) => ({
    month,
    members: membersByMonth[i] ?? 0,
  }))

  // Fee distribution: bucket by amount (5M = 5_000_000_00 stored *100, 10M = 10_000_000_00)
  // feePaid is stored in đồng *100 per schema comment; treat >=7M threshold as 10M tier
  const fee5m = allMemberships.filter((m) => m.amountPaid < 7_000_000).length
  const fee10m = allMemberships.filter((m) => m.amountPaid >= 7_000_000).length
  const feeDistribution = [
    { name: "5 triệu", value: fee5m },
    { name: "10 triệu", value: fee10m },
  ]

  const activePct =
    totalVIP > 0 ? Math.round((activeMemberships / totalVIP) * 100) : 0

  const hasAlerts =
    pendingPayments > 0 ||
    expiringMembers.length > 0 ||
    longPendingCerts.length > 0 ||
    unhandledReports > 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Tổng quan Quản trị</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total VIP */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tổng hội viên VIP
          </p>
          <p className="mt-2 text-3xl font-bold text-brand-900">{totalVIP}</p>
        </div>

        {/* Active Memberships */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Membership còn hiệu lực
          </p>
          <p className="mt-2 text-3xl font-bold text-brand-900">
            {activeMemberships}
          </p>
          <p className="mt-1 text-sm text-green-600 font-medium">
            {activePct}% hội viên
          </p>
        </div>

        {/* Pending Certifications */}
        <div
          className={`rounded-xl border p-5 shadow-sm ${
            pendingCerts > 0
              ? "border-yellow-300 bg-yellow-50"
              : "bg-white"
          }`}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Chứng nhận chờ duyệt
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${
              pendingCerts > 0 ? "text-yellow-700" : "text-brand-900"
            }`}
          >
            {pendingCerts}
          </p>
          {pendingCerts > 0 && (
            <p className="mt-1 text-xs text-yellow-600">Cần xử lý</p>
          )}
        </div>

        {/* New Media Orders */}
        <div
          className={`rounded-xl border p-5 shadow-sm ${
            newMediaOrders > 0 ? "border-red-300 bg-red-50" : "bg-white"
          }`}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Đơn truyền thông mới
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${
              newMediaOrders > 0 ? "text-red-700" : "text-brand-900"
            }`}
          >
            {newMediaOrders}
          </p>
          {newMediaOrders > 0 && (
            <p className="mt-1 text-xs text-red-600">Chưa xác nhận</p>
          )}
        </div>
      </div>

      {/* Alert Panel */}
      {hasAlerts && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="mb-3 text-sm font-bold text-amber-800">
            Cần chú ý
          </h2>
          <ul className="space-y-2 text-sm text-amber-800">
            {pendingPayments > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                <Link href="/admin/thanh-toan" className="flex items-center gap-2 hover:underline">
                  <span>💳</span>
                  <span>{pendingPayments} yêu cầu chuyển khoản chờ xác nhận</span>
                  <span className="text-amber-600">→</span>
                </Link>
              </li>
            )}
            {expiringMembers.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                <span>
                  <strong>{expiringMembers.length}</strong> hội viên membership
                  hết hạn trong 30 ngày tới —{" "}
                  <Link
                    href="/admin/hoi-vien?status=expiring"
                    className="underline hover:text-amber-900"
                  >
                    Xem danh sách
                  </Link>
                </span>
              </li>
            )}
            {longPendingCerts.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                <span>
                  <strong>{longPendingCerts.length}</strong> đơn chứng nhận
                  chờ xét duyệt &gt; 7 ngày —{" "}
                  <Link
                    href="/admin/chung-nhan?status=pending"
                    className="underline hover:text-amber-900"
                  >
                    Xem đơn
                  </Link>
                </span>
              </li>
            )}
            {unhandledReports > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                <span>
                  <strong>{unhandledReports}</strong> báo cáo bài viết chưa
                  xử lý —{" "}
                  <Link
                    href="/admin/bao-cao"
                    className="underline hover:text-amber-900"
                  >
                    Xử lý ngay
                  </Link>
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Charts */}
      <DashboardCharts
        revenueData={revenueData}
        membersData={membersData}
        feeDistribution={feeDistribution}
      />
    </div>
  )
}
