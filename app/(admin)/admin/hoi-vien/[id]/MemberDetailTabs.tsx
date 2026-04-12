"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

type User = {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  accountType: string
  memberCategory: string
  contributionTotal: number
  displayPriority: number
  membershipExpires: string | null
  bankName: string | null
  bankAccountNumber: string | null
  bankAccountName: string | null
  createdAt: string
  company: {
    id: string
    name: string
    slug: string
    representativeName: string | null
    representativePosition: string | null
  } | null
}

type Membership = {
  id: string
  amountPaid: number
  validFrom: string
  validTo: string
  status: string
  createdAt: string
  paymentStatus: string | null
}

type Payment = {
  id: string
  type: string
  status: string
  amount: number
  createdAt: string
  payosOrderCode: string | null
}

type Post = {
  id: string
  title: string | null
  status: string
  viewCount: number
  createdAt: string
}

type Cert = {
  id: string
  status: string
  createdAt: string
  approvedAt: string | null
  product: { name: string; slug: string }
}

type Tab = "membership" | "payments" | "posts" | "certs" | "info"

const TABS: { key: Tab; label: string }[] = [
  { key: "membership", label: "Membership" },
  { key: "payments",   label: "Thanh toán" },
  { key: "posts",      label: "Bài viết" },
  { key: "certs",      label: "Chứng nhận" },
  { key: "info",       label: "Thông tin" },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}
function fmtVND(n: number) { return n.toLocaleString("vi-VN") + " đ" }

const paymentTypeLabel: Record<string, string> = {
  MEMBERSHIP_FEE: "Phí hội viên",
  CERTIFICATION_FEE: "Phí chứng nhận",
  MEDIA_SERVICE: "Dịch vụ truyền thông",
}

const paymentStatusBadge: Record<string, { text: string; cls: string }> = {
  PENDING:  { text: "Chờ xác nhận", cls: "bg-yellow-100 text-yellow-700" },
  SUCCESS:  { text: "Đã xác nhận",  cls: "bg-green-100 text-green-700" },
  FAILED:   { text: "Từ chối",      cls: "bg-red-100 text-red-700" },
  REFUNDED: { text: "Đã hoàn",      cls: "bg-blue-100 text-blue-700" },
}

const certStatusBadge: Record<string, { text: string; cls: string }> = {
  DRAFT:        { text: "Nháp",         cls: "bg-gray-100 text-gray-600" },
  PENDING:      { text: "Chờ xét duyệt", cls: "bg-yellow-100 text-yellow-700" },
  UNDER_REVIEW: { text: "Đang xét duyệt", cls: "bg-blue-100 text-blue-700" },
  APPROVED:     { text: "Đã duyệt",     cls: "bg-green-100 text-green-700" },
  REJECTED:     { text: "Từ chối",      cls: "bg-red-100 text-red-700" },
}

const membershipStatusBadge: Record<string, { text: string; cls: string }> = {
  ACTIVE:          { text: "Đang hiệu lực", cls: "bg-green-100 text-green-700" },
  EXPIRED:         { text: "Hết hạn",        cls: "bg-red-100 text-red-700" },
  PENDING_PAYMENT: { text: "Chờ thanh toán", cls: "bg-yellow-100 text-yellow-700" },
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-brand-200 last:border-0">
      <span className="text-sm text-brand-400 sm:w-44 shrink-0">{label}</span>
      <span className="text-sm text-brand-900">{value ?? "—"}</span>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function MemberDetailTabs({
  user,
  memberships,
  payments,
  posts,
  certifications,
  tierSilver,
  tierGold,
}: {
  user: User
  memberships: Membership[]
  payments: Payment[]
  posts: Post[]
  certifications: Cert[]
  tierSilver?: number
  tierGold?: number
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("membership")
  const [actionLoading, setActionLoading] = useState(false)

  const daysLeft = user.membershipExpires
    ? Math.max(0, Math.ceil((new Date(user.membershipExpires).getTime() - Date.now()) / 86400000))
    : 0

  async function handleToggleActive() {
    const action = user.isActive ? "Vô hiệu hoá" : "Kích hoạt lại"
    if (!window.confirm(`${action} tài khoản ${user.name}?`)) return
    setActionLoading(true)
    try {
      await fetch(`/api/admin/users/${user.id}/toggle-active`, { method: "POST" })
      router.refresh()
    } catch {
      alert("Có lỗi xảy ra")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleResendInvite() {
    if (!window.confirm(`Gửi lại email mời đến ${user.email}?`)) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/resend-invite`, { method: "POST" })
      if (res.ok) alert("Đã gửi lại email mời")
      else alert("Không thể gửi email")
    } catch {
      alert("Có lỗi xảy ra")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleResetPassword() {
    if (!window.confirm(`Gửi email đặt lại mật khẩu cho ${user.name} (${user.email})?`)) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" })
      if (res.ok) alert("Đã gửi email đặt lại mật khẩu thành công")
      else {
        const data = await res.json()
        alert(data.error ?? "Không thể gửi email")
      }
    } catch {
      alert("Có lỗi xảy ra")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-brand-200 overflow-hidden">
      {/* ── Action buttons ──────────────────────────────────────────────── */}
      <div className="px-6 pt-4 flex gap-2 flex-wrap">
        <button
          onClick={handleToggleActive}
          disabled={actionLoading}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
            user.isActive
              ? "border-red-300 text-red-600 hover:bg-red-50"
              : "border-green-300 text-green-600 hover:bg-green-50",
          )}
        >
          {user.isActive ? "Vô hiệu hoá" : "Kích hoạt lại"}
        </button>
        {!user.isActive && !user.membershipExpires && (
          <button
            onClick={handleResendInvite}
            disabled={actionLoading}
            className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            Gửi lại email mời
          </button>
        )}
        <button
          onClick={handleResetPassword}
          disabled={actionLoading}
          className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
        >
          Đặt lại mật khẩu
        </button>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-brand-200 overflow-x-auto mt-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
              activeTab === tab.key ? "text-brand-800" : "text-brand-400 hover:text-brand-600",
            )}
          >
            {tab.label}
            {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-700" />}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="p-6">

        {/* ── Membership ────────────────────────────────────────────────── */}
        {activeTab === "membership" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <p className="text-xs text-brand-400 mb-1">Tổng đóng góp</p>
                <p className="text-lg font-bold text-brand-900">{fmtVND(user.contributionTotal)}</p>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <p className="text-xs text-brand-400 mb-1">Hạng</p>
                <p className="text-lg font-bold text-brand-900">
                  {user.contributionTotal >= (tierGold ?? 20_000_000) ? "Vàng" : user.contributionTotal >= (tierSilver ?? 10_000_000) ? "Bạc" : "Cơ bản"}
                </p>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <p className="text-xs text-brand-400 mb-1">Ưu tiên</p>
                <p className="text-lg font-bold text-brand-900">#{user.displayPriority}</p>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <p className="text-xs text-brand-400 mb-1">Còn lại</p>
                <p className="text-lg font-bold text-brand-900">
                  {daysLeft > 0 ? `${daysLeft} ngày` : "Hết hạn"}
                </p>
              </div>
            </div>

            {memberships.length === 0 ? (
              <p className="text-sm text-brand-400 py-4 text-center">Chưa có lịch sử membership.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-200 text-left">
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Ngày</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Hiệu lực</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Số tiền</th>
                      <th className="py-2.5 font-medium text-brand-500">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {memberships.map((m) => {
                      const st = membershipStatusBadge[m.status] ?? { text: m.status, cls: "bg-gray-100 text-gray-600" }
                      return (
                        <tr key={m.id}>
                          <td className="py-3 pr-4 text-brand-700 whitespace-nowrap">{fmtDate(m.createdAt)}</td>
                          <td className="py-3 pr-4 text-brand-600 whitespace-nowrap">{fmtDate(m.validFrom)} – {fmtDate(m.validTo)}</td>
                          <td className="py-3 pr-4 text-brand-900 font-medium">{fmtVND(m.amountPaid)}</td>
                          <td className="py-3">
                            <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-sm font-medium", st.cls)}>{st.text}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Payments ──────────────────────────────────────────────────── */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {/* Bank info */}
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
              <p className="text-xs font-medium text-brand-400 uppercase tracking-wide mb-2">Thông tin ngân hàng hoàn tiền</p>
              {user.bankName ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div><span className="text-brand-400">Ngân hàng:</span> <span className="text-brand-900 font-medium">{user.bankName}</span></div>
                  <div><span className="text-brand-400">Số TK:</span> <span className="text-brand-900 font-medium">{user.bankAccountNumber}</span></div>
                  <div><span className="text-brand-400">Chủ TK:</span> <span className="text-brand-900 font-medium">{user.bankAccountName}</span></div>
                </div>
              ) : (
                <p className="text-sm text-yellow-700">Hội viên chưa cập nhật thông tin ngân hàng.</p>
              )}
            </div>

            {payments.length === 0 ? (
              <p className="text-sm text-brand-400 py-4 text-center">Chưa có giao dịch nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-200 text-left">
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Ngày</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Loại</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Số tiền</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Mã GD</th>
                      <th className="py-2.5 font-medium text-brand-500">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {payments.map((p) => {
                      const st = paymentStatusBadge[p.status] ?? { text: p.status, cls: "bg-gray-100 text-gray-600" }
                      return (
                        <tr key={p.id}>
                          <td className="py-3 pr-4 text-brand-700 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                          <td className="py-3 pr-4 text-brand-600">{paymentTypeLabel[p.type] ?? p.type}</td>
                          <td className="py-3 pr-4 text-brand-900 font-medium">{fmtVND(p.amount)}</td>
                          <td className="py-3 pr-4 text-brand-400 text-xs font-mono">{p.payosOrderCode ?? "—"}</td>
                          <td className="py-3">
                            <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-sm font-medium", st.cls)}>{st.text}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Posts ──────────────────────────────────────────────────────── */}
        {activeTab === "posts" && (
          <div>
            {posts.length === 0 ? (
              <p className="text-sm text-brand-400 py-4 text-center">Chưa có bài viết nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-200 text-left">
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Tiêu đề</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Ngày đăng</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Lượt xem</th>
                      <th className="py-2.5 font-medium text-brand-500">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {posts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 pr-4 text-brand-900 max-w-xs truncate">{p.title ?? "(Không có tiêu đề)"}</td>
                        <td className="py-3 pr-4 text-brand-600 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                        <td className="py-3 pr-4 text-brand-600">{p.viewCount}</td>
                        <td className="py-3">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-sm font-medium",
                            p.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                            p.status === "LOCKED" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-600",
                          )}>
                            {p.status === "PUBLISHED" ? "Đã đăng" : p.status === "LOCKED" ? "Đã khoá" : p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Certifications ────────────────────────────────────────────── */}
        {activeTab === "certs" && (
          <div>
            {certifications.length === 0 ? (
              <p className="text-sm text-brand-400 py-4 text-center">Chưa có đơn chứng nhận nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-200 text-left">
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Sản phẩm</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Ngày nộp</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Ngày duyệt</th>
                      <th className="py-2.5 font-medium text-brand-500">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {certifications.map((c) => {
                      const st = certStatusBadge[c.status] ?? { text: c.status, cls: "bg-gray-100 text-gray-600" }
                      return (
                        <tr key={c.id}>
                          <td className="py-3 pr-4 text-brand-900 font-medium">{c.product.name}</td>
                          <td className="py-3 pr-4 text-brand-600 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                          <td className="py-3 pr-4 text-brand-600 whitespace-nowrap">{c.approvedAt ? fmtDate(c.approvedAt) : "—"}</td>
                          <td className="py-3">
                            <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-sm font-medium", st.cls)}>{st.text}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Info ──────────────────────────────────────────────────────── */}
        {activeTab === "info" && (
          <div>
            <InfoRow label="Họ tên" value={user.name} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Số điện thoại" value={user.phone} />
            <InfoRow
              label="Loại tài khoản"
              value={user.accountType === "INDIVIDUAL" ? "Cá nhân" : "Doanh nghiệp"}
            />
            <InfoRow
              label="Hạng Hội viên (Điều lệ)"
              value={
                user.memberCategory === "OFFICIAL"
                  ? "Chính thức"
                  : user.memberCategory === "AFFILIATE"
                    ? "Liên kết"
                    : "Danh dự"
              }
            />
            <InfoRow label="Doanh nghiệp" value={user.company?.name} />
            {user.company && (
              <>
                <InfoRow label="Người đại diện" value={user.company.representativeName} />
                <InfoRow label="Chức vụ" value={user.company.representativePosition} />
              </>
            )}
            <InfoRow label="Ngày tạo tài khoản" value={fmtDate(user.createdAt)} />
            <InfoRow
              label="Hết hạn membership"
              value={user.membershipExpires ? fmtDate(user.membershipExpires) : "Chưa kích hoạt"}
            />
            <InfoRow label="Ngân hàng" value={user.bankName} />
            <InfoRow label="Số TK" value={user.bankAccountNumber} />
            <InfoRow label="Chủ TK" value={user.bankAccountName} />
          </div>
        )}
      </div>
    </div>
  )
}
