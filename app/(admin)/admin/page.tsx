import { prisma } from "@/lib/prisma"
import { getTierThresholds } from "@/lib/tier"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DashboardChartsLoader } from "./DashboardChartsLoader"
import { ActionQueueBadges } from "./ActionQueueBadges"

export const revalidate = 0 // per-request — readOnly state phụ thuộc role

function formatVND(n: number) { return (n / 1_000_000).toFixed(0) + "tr" }
function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export default async function AdminDashboardPage() {
  const now = new Date()
  const sevenDays = new Date(now.getTime() - 7 * 86400000)
  const twentyFourHours = new Date(now.getTime() - 24 * 3600000)
  const fortyEightHours = new Date(now.getTime() - 48 * 3600000)
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)

  const [
    // SLA breach counts — drive RED alert panel
    pendingPayments24h, longPendingCerts,
    unhandledReports48h, membershipExpiresToday,
    // YELLOW — soon-to-be-urgent
    expiringMembersWeek, newMediaUnconfirmed48h, pendingVIPActivation,
    // Charts data
    monthlyPayments, tierCounts,
    // Activity feed
    recentPayments, recentCerts, recentMedia, recentUsers,
  ] = await Promise.all([
    // RED: SLA breach
    prisma.payment.count({ where: { status: "PENDING", createdAt: { lt: twentyFourHours } } }),
    prisma.certification.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] }, createdAt: { lt: sevenDays } } }),
    prisma.report.count({ where: { status: "PENDING", createdAt: { lt: fortyEightHours } } }),
    prisma.user.count({ where: { role: "VIP", membershipExpires: { gte: new Date(now.toDateString()), lt: new Date(new Date(now).setDate(now.getDate() + 1)) } } }),

    // YELLOW: soon-urgent
    prisma.user.count({ where: { role: "VIP", membershipExpires: { gt: now, lte: new Date(now.getTime() + 7 * 86400000) } } }),
    prisma.mediaOrder.count({ where: { status: "NEW", createdAt: { lt: fortyEightHours } } }),
    prisma.user.count({ where: { role: "VIP", isActive: false, membershipExpires: null } }),

    // Charts — 12 months revenue by type + tier snapshot
    prisma.payment.findMany({ where: { status: "SUCCESS", createdAt: { gte: twelveMonthsAgo } }, select: { amount: true, type: true, createdAt: true } }),
    prisma.user.groupBy({ by: ["role"], where: { role: "VIP" }, _count: true }),

    // Activity feed
    prisma.payment.findMany({ where: { status: "SUCCESS" }, orderBy: { createdAt: "desc" }, take: 5, select: { amount: true, type: true, createdAt: true, user: { select: { name: true } } } }),
    prisma.certification.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { status: true, createdAt: true, applicant: { select: { name: true } }, product: { select: { name: true } } } }),
    prisma.mediaOrder.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { requesterName: true, serviceType: true, createdAt: true } }),
    prisma.user.findMany({ where: { role: "VIP", isActive: true }, orderBy: { createdAt: "desc" }, take: 5, select: { name: true, createdAt: true } }),
  ])

  // Tier distribution for PieChart — DB-side count (no JS filter)
  const [bizT, indT] = await Promise.all([getTierThresholds("BUSINESS"), getTierThresholds("INDIVIDUAL")])
  const [bizGold, bizSilver, indGold, indSilver] = await Promise.all([
    prisma.user.count({ where: { role: "VIP", accountType: "BUSINESS", contributionTotal: { gte: bizT.gold } } }),
    prisma.user.count({ where: { role: "VIP", accountType: "BUSINESS", contributionTotal: { gte: bizT.silver, lt: bizT.gold } } }),
    prisma.user.count({ where: { role: "VIP", accountType: "INDIVIDUAL", contributionTotal: { gte: indT.gold } } }),
    prisma.user.count({ where: { role: "VIP", accountType: "INDIVIDUAL", contributionTotal: { gte: indT.silver, lt: indT.gold } } }),
  ])
  const totalGold = bizGold + indGold
  const totalSilver = bizSilver + indSilver
  const totalVIPCount = (tierCounts[0]?._count ?? 0)
  const totalBasic = totalVIPCount - totalGold - totalSilver
  const tierData = [
    { name: "★ Cơ bản", value: totalBasic },
    { name: "★★ Bạc", value: totalSilver },
    { name: "★★★ Vàng", value: totalGold },
  ]

  // Revenue chart data (12 months)
  const MONTH_NAMES = ["Thg 1","Thg 2","Thg 3","Thg 4","Thg 5","Thg 6","Thg 7","Thg 8","Thg 9","Thg 10","Thg 11","Thg 12"]
  const revByMonth: Record<number, { membership: number; cert: number }> = {}
  for (const p of monthlyPayments) {
    const m = new Date(p.createdAt).getMonth()
    if (!revByMonth[m]) revByMonth[m] = { membership: 0, cert: 0 }
    if (p.type === "MEMBERSHIP_FEE") revByMonth[m].membership += p.amount
    else revByMonth[m].cert += p.amount
  }
  const revenueData = MONTH_NAMES.map((month, i) => ({
    month,
    membership: Math.round((revByMonth[i]?.membership ?? 0) / 1_000_000),
    cert: Math.round((revByMonth[i]?.cert ?? 0) / 1_000_000),
  }))
  // Activity feed — merge 4 sources
  type Activity = { icon: string; text: string; time: Date; href?: string }
  const activities: Activity[] = []
  for (const p of recentPayments) {
    const label = p.type === "MEMBERSHIP_FEE" ? "phí hội viên" : "phí chứng nhận"
    activities.push({ icon: "💳", text: `${p.user.name} xác nhận CK ${formatVND(p.amount)} ${label}`, time: p.createdAt, href: "/admin/thanh-toan" })
  }
  for (const c of recentCerts) {
    const action = c.status === "APPROVED" ? "được duyệt CN" : "nộp đơn CN"
    activities.push({ icon: "📋", text: `${c.applicant.name} ${action} SP "${c.product.name}"`, time: c.createdAt, href: "/admin/chung-nhan" })
  }
  for (const m of recentMedia) {
    activities.push({ icon: "📰", text: `Đơn truyền thông từ ${m.requesterName}`, time: m.createdAt, href: "/admin/truyen-thong" })
  }
  for (const u of recentUsers) {
    activities.push({ icon: "👤", text: `${u.name} được kích hoạt tài khoản VIP`, time: u.createdAt, href: "/admin/hoi-vien" })
  }
  activities.sort((a, b) => b.time.getTime() - a.time.getTime())
  const topActivities = activities.slice(0, 10)

  // SLA breach alerts — chỉ hiện những gì CẦN chú ý, không dùng dashboard làm
  // bảng thông tin. RED = quá SLA → vào thẳng queue. YELLOW = sắp tới SLA.
  type Alert = { text: string; href: string; level: "red" | "yellow" }
  const alerts: Alert[] = []

  if (pendingPayments24h > 0) alerts.push({ text: `${pendingPayments24h} payment CK chờ xác nhận quá 24h`, href: "/admin/thanh-toan", level: "red" })
  if (unhandledReports48h > 0) alerts.push({ text: `${unhandledReports48h} báo cáo vi phạm chưa xử lý quá 48h`, href: "/admin/bao-cao", level: "red" })
  if (longPendingCerts > 0) alerts.push({ text: `${longPendingCerts} đơn chứng nhận chờ duyệt quá 7 ngày`, href: "/admin/chung-nhan", level: "red" })
  if (membershipExpiresToday > 0) alerts.push({ text: `${membershipExpiresToday} hội viên membership hết hạn hôm nay`, href: "/admin/hoi-vien?status=expiring", level: "red" })

  if (expiringMembersWeek > 0) alerts.push({ text: `${expiringMembersWeek} membership sắp hết hạn trong 7 ngày`, href: "/admin/hoi-vien?status=expiring", level: "yellow" })
  if (newMediaUnconfirmed48h > 0) alerts.push({ text: `${newMediaUnconfirmed48h} đơn truyền thông NEW chưa confirm quá 48h`, href: "/admin/truyen-thong?status=NEW", level: "yellow" })
  if (pendingVIPActivation > 0) alerts.push({ text: `${pendingVIPActivation} tài khoản hội viên chờ kích hoạt`, href: "/admin/hoi-vien?status=pending", level: "yellow" })

  const alertColors = {
    red: "border-red-300 bg-red-50 text-red-800",
    yellow: "border-yellow-300 bg-yellow-50 text-yellow-800",
  }
  const alertLabels = { red: "Quá hạn — xử lý ngay", yellow: "Sắp quá hạn — cần chú ý" }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Tổng quan</h1>

      {/* ── SLA breach panel (RED/YELLOW) ─────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {(["red", "yellow"] as const).map((level) => {
            const items = alerts.filter((a) => a.level === level)
            if (items.length === 0) return null
            return (
              <div key={level} className={cn("rounded-xl border px-5 py-3 space-y-1.5", alertColors[level])}>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{alertLabels[level]}</p>
                {items.map((a, i) => (
                  <Link key={i} href={a.href} className="flex items-center justify-between text-sm hover:underline">
                    <span>{a.text}</span>
                    <span className="text-xs opacity-60">Xử lý →</span>
                  </Link>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Action queue badges (live từ PendingCountsContext) ────────── */}
      <ActionQueueBadges />

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <DashboardChartsLoader revenueData={revenueData} tierData={tierData} />

      {/* ── Activity Feed ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-brand-200 p-6">
        <h2 className="text-sm font-semibold text-brand-900 mb-4">Hoạt động gần đây</h2>
        {topActivities.length === 0 ? (
          <p className="text-sm text-brand-400">Chưa có hoạt động nào.</p>
        ) : (
          <ul className="space-y-3">
            {topActivities.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="shrink-0">{a.icon}</span>
                <span className="flex-1 text-brand-700">{a.text}</span>
                <span className="text-xs text-brand-400 shrink-0">{timeAgo(a.time)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
