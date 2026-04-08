import { prisma } from "@/lib/prisma"
import { getTierThresholds } from "@/lib/tier"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { DashboardChartsLoader } from "./DashboardChartsLoader"

export const revalidate = 60 // Alert panel refreshes every 60s

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
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const thirtyDays = new Date(now.getTime() + 30 * 86400000)
  const sevenDays = new Date(now.getTime() - 7 * 86400000)
  const twentyFourHours = new Date(now.getTime() - 24 * 3600000)
  const fortyEightHours = new Date(now.getTime() - 48 * 3600000)
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)

  const [
    activeVIP, maxSlotCfg, monthRevenue, yearRevenue,
    certApproved, certNewThisMonth, mediaActive, mediaProcessing,
    totalPosts, pendingReports,
    expiringMembers, pendingPayments24h, longPendingCerts,
    unhandledReports48h, membershipExpiresToday,
    expiringMembersWeek, pendingCertsWeek, newMediaUnconfirmed48h,
    pendingVIPActivation, newActivatedVIP, certApprovedRecent, mediaCompleted,
    monthlyPayments, newVIPUsers, tierCounts,
    recentPayments, recentCerts, recentMedia, recentUsers,
  ] = await Promise.all([
    // KPI 1: Active VIP
    prisma.user.count({ where: { role: "VIP", isActive: true, membershipExpires: { gt: now } } }),
    prisma.siteConfig.findUnique({ where: { key: "max_vip_accounts" } }),
    // KPI 2: Monthly revenue
    prisma.payment.aggregate({ where: { status: "SUCCESS", createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    // KPI 3: Yearly revenue
    prisma.payment.aggregate({ where: { status: "SUCCESS", createdAt: { gte: yearStart } }, _sum: { amount: true } }),
    // KPI 4: Certified products
    prisma.product.count({ where: { certStatus: "APPROVED" } }),
    prisma.certification.count({ where: { status: "APPROVED", approvedAt: { gte: monthStart } } }),
    // KPI 5: Media orders active
    prisma.mediaOrder.count({ where: { status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.mediaOrder.count({ where: { status: "IN_PROGRESS" } }),
    // KPI 6: Posts
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    // KPI 7: Reports
    prisma.report.count({ where: { status: "PENDING" } }),
    // KPI 8: Expiring memberships
    prisma.user.count({ where: { role: "VIP", membershipExpires: { gt: now, lte: thirtyDays } } }),

    // Alerts — RED (urgent)
    prisma.payment.count({ where: { status: "PENDING", createdAt: { lt: twentyFourHours } } }),
    prisma.certification.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] }, createdAt: { lt: sevenDays } } }),
    prisma.report.count({ where: { status: "PENDING", createdAt: { lt: fortyEightHours } } }),
    prisma.user.count({ where: { role: "VIP", membershipExpires: { gte: new Date(now.toDateString()), lt: new Date(new Date(now).setDate(now.getDate() + 1)) } } }),

    // Alerts — YELLOW (this week)
    prisma.user.count({ where: { role: "VIP", membershipExpires: { gt: now, lte: new Date(now.getTime() + 7 * 86400000) } } }),
    prisma.certification.count({ where: { status: "PENDING", createdAt: { lt: sevenDays } } }),
    prisma.mediaOrder.count({ where: { status: "NEW", createdAt: { lt: fortyEightHours } } }),
    prisma.user.count({ where: { role: "VIP", isActive: false, membershipExpires: null } }),

    // Alerts — GRAY (info)
    prisma.user.findMany({ where: { role: "VIP", isActive: true, createdAt: { gte: sevenDays } }, select: { name: true }, take: 3 }),
    prisma.certification.findMany({ where: { status: "APPROVED", approvedAt: { gte: sevenDays } }, select: { product: { select: { name: true } } }, take: 3 }),
    prisma.mediaOrder.findMany({ where: { status: "COMPLETED", completedAt: { gte: sevenDays } }, select: { id: true }, take: 3 }),

    // Charts
    prisma.payment.findMany({ where: { status: "SUCCESS", createdAt: { gte: twelveMonthsAgo } }, select: { amount: true, type: true, createdAt: true } }),
    prisma.user.findMany({ where: { role: "VIP", createdAt: { gte: twelveMonthsAgo } }, select: { createdAt: true } }),
    prisma.user.groupBy({ by: ["role"], where: { role: "VIP" }, _count: true }),

    // Activity feed
    prisma.payment.findMany({ where: { status: "SUCCESS" }, orderBy: { createdAt: "desc" }, take: 5, select: { amount: true, type: true, createdAt: true, user: { select: { name: true } } } }),
    prisma.certification.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { status: true, createdAt: true, applicant: { select: { name: true } }, product: { select: { name: true } } } }),
    prisma.mediaOrder.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { requesterName: true, serviceType: true, createdAt: true } }),
    prisma.user.findMany({ where: { role: "VIP", isActive: true }, orderBy: { createdAt: "desc" }, take: 5, select: { name: true, createdAt: true } }),
  ])

  const maxSlot = Number(maxSlotCfg?.value ?? 100)
  const monthRevenueTotal = monthRevenue._sum.amount ?? 0
  const yearRevenueTotal = yearRevenue._sum.amount ?? 0

  // Tier distribution for PieChart (respects accountType thresholds)
  const allVIP = await prisma.user.findMany({ where: { role: "VIP" }, select: { contributionTotal: true, accountType: true } })
  const [bizT, indT] = await Promise.all([getTierThresholds("BUSINESS"), getTierThresholds("INDIVIDUAL")])
  function userTier(u: { contributionTotal: number; accountType: string }) {
    const { silver, gold } = u.accountType === "INDIVIDUAL" ? indT : bizT
    if (u.contributionTotal >= gold) return "gold"
    if (u.contributionTotal >= silver) return "silver"
    return "basic"
  }
  const tierData = [
    { name: "★ Cơ bản", value: allVIP.filter(u => userTier(u) === "basic").length },
    { name: "★★ Bạc", value: allVIP.filter(u => userTier(u) === "silver").length },
    { name: "★★★ Vàng", value: allVIP.filter(u => userTier(u) === "gold").length },
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

  // Build alert arrays
  type Alert = { text: string; href: string; level: "red" | "yellow" | "gray" }
  const alerts: Alert[] = []

  // RED alerts
  if (pendingPayments24h > 0) alerts.push({ text: `${pendingPayments24h} payment CK chờ xác nhận quá 24h`, href: "/admin/thanh-toan", level: "red" })
  if (unhandledReports48h > 0) alerts.push({ text: `${unhandledReports48h} báo cáo vi phạm chưa xử lý quá 48h`, href: "/admin/bao-cao", level: "red" })
  if (longPendingCerts > 0) alerts.push({ text: `${longPendingCerts} đơn chứng nhận chờ duyệt quá 7 ngày`, href: "/admin/chung-nhan", level: "red" })
  if (membershipExpiresToday > 0) alerts.push({ text: `${membershipExpiresToday} hội viên membership hết hạn hôm nay`, href: "/admin/hoi-vien?status=expiring", level: "red" })

  // YELLOW alerts
  if (expiringMembersWeek > 0) alerts.push({ text: `${expiringMembersWeek} membership sắp hết hạn trong 7 ngày`, href: "/admin/hoi-vien?status=expiring", level: "yellow" })
  if (newMediaUnconfirmed48h > 0) alerts.push({ text: `${newMediaUnconfirmed48h} đơn truyền thông NEW chưa confirm quá 48h`, href: "/admin/truyen-thong?status=NEW", level: "yellow" })
  if (pendingVIPActivation > 0) alerts.push({ text: `${pendingVIPActivation} tài khoản VIP chờ kích hoạt`, href: "/admin/hoi-vien?status=pending", level: "yellow" })

  // GRAY alerts
  if (newActivatedVIP.length > 0) alerts.push({ text: `${newActivatedVIP.length} hội viên mới được kích hoạt tuần này`, href: "/admin/hoi-vien", level: "gray" })
  if (certApprovedRecent.length > 0) alerts.push({ text: `${certApprovedRecent.length} SP vừa được chứng nhận tuần này`, href: "/admin/chung-nhan", level: "gray" })
  const totalVIP = allVIP.length
  alerts.push({ text: `Slot VIP: ${totalVIP}/${maxSlot}`, href: "/admin/hoi-vien", level: "gray" })

  const alertColors = { red: "border-red-300 bg-red-50 text-red-800", yellow: "border-yellow-300 bg-yellow-50 text-yellow-800", gray: "border-gray-300 bg-gray-50 text-gray-700" }
  const alertLabels = { red: "Cần xử lý ngay", yellow: "Cần chú ý", gray: "Thông tin" }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Tổng quan</h1>

      {/* ── Alert Panel ────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {(["red", "yellow", "gray"] as const).map((level) => {
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

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Hội viên Active" value={`${activeVIP}`} sub={`/${maxSlot} slot`} href="/admin/hoi-vien" />
        <KPI label="Doanh thu tháng" value={formatVND(monthRevenueTotal)} highlight href="/admin/thanh-toan" />
        <KPI label="SP Chứng nhận" value={`${certApproved}`} sub={certNewThisMonth > 0 ? `+${certNewThisMonth} tháng này` : undefined} href="/admin/chung-nhan" />
        <KPI label="Đơn Truyền thông" value={`${mediaActive}`} sub={`${mediaProcessing} đang xử lý`} href="/admin/truyen-thong" />
        <KPI label="Bài viết Feed" value={`${totalPosts}`} />
        <KPI label="Báo cáo vi phạm" value={`${pendingReports}`} alert={pendingReports > 0} href="/admin/bao-cao" />
        <KPI label="Doanh thu năm" value={formatVND(yearRevenueTotal)} />
        <KPI label="Sắp hết hạn" value={`${expiringMembers}`} sub="trong 30 ngày" alert={expiringMembers > 0} href="/admin/hoi-vien?status=expiring" />
      </div>

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

function KPI({ label, value, sub, highlight, alert, href }: {
  label: string; value: string; sub?: string; highlight?: boolean; alert?: boolean; href?: string
}) {
  const content = (
    <div className={cn(
      "rounded-xl border p-4 shadow-sm transition-colors",
      alert ? "border-red-300 bg-red-50" : "border-brand-200 bg-white",
      href && "hover:bg-brand-50 cursor-pointer",
    )}>
      <p className="text-xs font-medium text-brand-400 uppercase tracking-wide">{label}</p>
      <p className={cn("mt-1.5 text-3xl font-bold", alert ? "text-red-700" : highlight ? "text-green-700" : "text-brand-900")}>{value}</p>
      {sub && <p className="text-sm text-brand-500 mt-0.5">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
