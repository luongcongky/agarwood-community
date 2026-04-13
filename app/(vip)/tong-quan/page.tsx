import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMemberTier } from "@/lib/tier"
import { SurveyBanner } from "@/components/features/survey/SurveyBanner"

export const revalidate = 60

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Chào buổi sáng"
  if (h < 18) return "Chào buổi chiều"
  return "Chào buổi tối"
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function VipDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id

  const [user, postCount, certProducts, recentPayments, recentCerts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        accountType: true,
        contributionTotal: true,
        membershipExpires: true,
        company: { select: { name: true } },
      },
    }),
    prisma.post.count({
      where: { authorId: userId, status: "PUBLISHED" },
    }),
    prisma.product.findMany({
      where: { company: { ownerId: userId } },
      select: { certStatus: true },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        createdAt: true,
      },
    }),
    prisma.certification.findMany({
      where: { applicantId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        approvedAt: true,
        rejectedAt: true,
        product: { select: { name: true } },
      },
    }),
  ])

  if (!user) redirect("/login")

  const greeting = getGreeting()
  const tier = await getMemberTier(user.contributionTotal, user.accountType as "BUSINESS" | "INDIVIDUAL")
  const isBusiness = user.accountType === "BUSINESS"

  // Membership days left
  const daysLeft = user.membershipExpires
    ? Math.max(0, Math.ceil((new Date(user.membershipExpires).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0

  // Certified products count
  const approvedProducts = certProducts.filter((p) => p.certStatus === "APPROVED").length
  const totalProducts = certProducts.length

  // Build notification timeline from payments + certifications
  type Notification = { date: Date; text: string; type: "success" | "info" | "warning" | "error" }

  const notifications: Notification[] = []

  for (const p of recentPayments) {
    const label = p.type === "MEMBERSHIP_FEE" ? "Phí hội viên" : p.type === "CERTIFICATION_FEE" ? "Phí chứng nhận" : "Dịch vụ truyền thông"
    if (p.status === "SUCCESS") {
      notifications.push({ date: p.createdAt, text: `${label} đã được xác nhận — ${(p.amount).toLocaleString("vi-VN")}đ`, type: "success" })
    } else if (p.status === "PENDING") {
      notifications.push({ date: p.createdAt, text: `${label} đang chờ xác nhận — ${(p.amount).toLocaleString("vi-VN")}đ`, type: "info" })
    } else if (p.status === "FAILED") {
      notifications.push({ date: p.createdAt, text: `${label} bị từ chối`, type: "error" })
    }
  }

  for (const c of recentCerts) {
    const productName = c.product.name
    if (c.status === "APPROVED" && c.approvedAt) {
      notifications.push({ date: c.approvedAt, text: `Chứng nhận "${productName}" được duyệt`, type: "success" })
    } else if (c.status === "REJECTED" && c.rejectedAt) {
      notifications.push({ date: c.rejectedAt, text: `Chứng nhận "${productName}" bị từ chối`, type: "error" })
    } else if (c.status === "PENDING" || c.status === "UNDER_REVIEW") {
      notifications.push({ date: c.createdAt, text: `Chứng nhận "${productName}" đang xét duyệt`, type: "info" })
    }
  }

  notifications.sort((a, b) => b.date.getTime() - a.date.getTime())
  const displayNotifications = notifications.slice(0, 6)

  return (
    <div className="space-y-6">

      {/* ── Survey banner (ẩn nếu không có khảo sát pending) ────────────── */}
      <SurveyBanner userId={userId} accountType={user.accountType as "BUSINESS" | "INDIVIDUAL"} />

      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-brand-200 p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-900">
          {greeting}, {user.name ?? "Hội viên"}
        </h1>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {user.company?.name && <span className="text-sm text-brand-500">{user.company.name}</span>}
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">
            {"★".repeat(tier.stars)} {tier.label}
          </span>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Membership */}
        <Link
          href="/gia-han"
          className="group bg-white rounded-xl border border-brand-200 p-5 hover:border-brand-400 transition-colors"
        >
          <p className="text-xs font-medium text-brand-400 uppercase tracking-wide">Membership</p>
          <p className="mt-2 text-2xl font-bold text-brand-900">{daysLeft} <span className="text-base font-normal text-brand-500">ngày</span></p>
          <p className="mt-1 text-xs text-brand-400">
            {user.membershipExpires
              ? `Hết hạn ${formatDate(new Date(user.membershipExpires))}`
              : "Chưa kích hoạt"}
          </p>
        </Link>

        {/* Bài viết */}
        <Link
          href="/feed"
          className="group bg-white rounded-xl border border-brand-200 p-5 hover:border-brand-400 transition-colors"
        >
          <p className="text-xs font-medium text-brand-400 uppercase tracking-wide">Bài viết</p>
          <p className="mt-2 text-2xl font-bold text-brand-900">{postCount} <span className="text-base font-normal text-brand-500">bài viết</span></p>
          <p className="mt-1 text-xs text-brand-400">Đã đăng trên bảng tin</p>
        </Link>

        {/* SP Chứng nhận — only for BUSINESS */}
        {isBusiness ? (
          <Link
            href="/chung-nhan/nop-don"
            className="group bg-white rounded-xl border border-brand-200 p-5 hover:border-brand-400 transition-colors"
          >
            <p className="text-xs font-medium text-brand-400 uppercase tracking-wide">SP Chứng nhận</p>
            <p className="mt-2 text-2xl font-bold text-brand-900">
              {approvedProducts}
              <span className="text-base font-normal text-brand-500">
                {totalProducts > 0 ? ` / ${totalProducts} sản phẩm` : " được duyệt"}
              </span>
            </p>
            <p className="mt-1 text-xs text-brand-400">
              {approvedProducts > 0 ? "Đã được cấp chứng nhận" : "Chưa có sản phẩm nào"}
            </p>
          </Link>
        ) : (
          <Link
            href="/tai-lieu"
            className="group bg-white rounded-xl border border-brand-200 p-5 hover:border-brand-400 transition-colors"
          >
            <p className="text-xs font-medium text-brand-400 uppercase tracking-wide">Tài liệu Hội</p>
            <p className="mt-2 text-2xl font-bold text-brand-900">Xem</p>
            <p className="mt-1 text-xs text-brand-400">Công văn, biên bản, quyết định</p>
          </Link>
        )}
      </div>

      {/* ── Thao tác nhanh ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-brand-200 p-6">
        <h2 className="text-base font-semibold text-brand-900 mb-4">Thao tác nhanh</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/feed/tao-bai"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-800 text-white px-4 py-2.5 text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            + Đăng bài
          </Link>
          {isBusiness && (
            <Link
              href="/chung-nhan/nop-don"
              className="inline-flex items-center gap-2 rounded-lg border border-brand-300 text-brand-700 px-4 py-2.5 text-sm font-medium hover:bg-brand-50 transition-colors"
            >
              Nộp đơn chứng nhận
            </Link>
          )}
          <Link
            href="/gia-han"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-300 text-brand-700 px-4 py-2.5 text-sm font-medium hover:bg-brand-50 transition-colors"
          >
            Gia hạn hội viên
          </Link>
          <Link
            href="/thanh-toan/lich-su"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-300 text-brand-700 px-4 py-2.5 text-sm font-medium hover:bg-brand-50 transition-colors"
          >
            Lịch sử thanh toán
          </Link>
        </div>
      </div>

      {/* ── Thông báo gần đây ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-brand-200 p-6">
        <h2 className="text-base font-semibold text-brand-900 mb-4">Thông báo gần đây</h2>
        {displayNotifications.length === 0 ? (
          <p className="text-sm text-brand-400">Chưa có thông báo nào.</p>
        ) : (
          <ul className="space-y-3">
            {displayNotifications.map((n, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span
                  className={
                    n.type === "success" ? "text-green-600 shrink-0" :
                    n.type === "error"   ? "text-red-600 shrink-0" :
                    n.type === "warning" ? "text-yellow-600 shrink-0" :
                                           "text-brand-400 shrink-0"
                  }
                >
                  {n.type === "success" ? "✓" : n.type === "error" ? "✗" : "●"}
                </span>
                <span className="text-brand-700 flex-1">{n.text}</span>
                <span className="text-brand-400 text-xs shrink-0">{formatDate(n.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
