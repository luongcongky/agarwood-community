"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

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

type Honorary = {
  id: string
  creditAmount: number
  reason: string
  category: "RESEARCH" | "LOGISTICS" | "EXTERNAL_RELATIONS" | "OTHER"
  extendMonths: number
  createdAt: string
  createdBy: { name: string } | null
}

type Tab = "membership" | "payments" | "honorary" | "posts" | "certs" | "info"

const TABS: { key: Tab; label: string }[] = [
  { key: "membership", label: "Membership" },
  { key: "payments",   label: "Thanh toán" },
  { key: "honorary",   label: "Đóng góp danh dự" },
  { key: "posts",      label: "Bài viết" },
  { key: "certs",      label: "Chứng nhận" },
  { key: "info",       label: "Thông tin" },
]

const honoraryCategoryLabel: Record<Honorary["category"], string> = {
  RESEARCH:           "Nghiên cứu khoa học",
  LOGISTICS:          "Hậu cần sự kiện",
  EXTERNAL_RELATIONS: "Đối ngoại",
  OTHER:              "Khác",
}

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
  honoraries,
  posts,
  certifications,
  tierSilver,
  tierGold,
}: {
  user: User
  memberships: Membership[]
  payments: Payment[]
  honoraries: Honorary[]
  posts: Post[]
  certifications: Cert[]
  tierSilver?: number
  tierGold?: number
}) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [activeTab, setActiveTab] = useState<Tab>("membership")
  const [actionLoading, setActionLoading] = useState(false)
  const [showHonoraryModal, setShowHonoraryModal] = useState(false)
  const [honoraryForm, setHonoraryForm] = useState({
    creditAmount: "",
    reason: "",
    category: "RESEARCH" as Honorary["category"],
    extendMonths: "12",
  })
  const [honoraryError, setHonoraryError] = useState<string | null>(null)

  async function handleSubmitHonorary() {
    setHonoraryError(null)
    const creditAmount = Number(honoraryForm.creditAmount)
    const extendMonths = Number(honoraryForm.extendMonths)
    if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
      setHonoraryError("Số tiền quy đổi phải lớn hơn 0")
      return
    }
    if (honoraryForm.reason.trim().length < 10) {
      setHonoraryError("Lý do phải ít nhất 10 ký tự")
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/honorary-contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          creditAmount,
          reason: honoraryForm.reason.trim(),
          category: honoraryForm.category,
          extendMonths: Number.isFinite(extendMonths) ? extendMonths : 12,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setHonoraryError(j.error ?? "Có lỗi xảy ra")
        return
      }
      setShowHonoraryModal(false)
      setHonoraryForm({ creditAmount: "", reason: "", category: "RESEARCH", extendMonths: "12" })
      router.refresh()
    } catch {
      setHonoraryError("Có lỗi xảy ra")
    } finally {
      setActionLoading(false)
    }
  }

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
          disabled={actionLoading || readOnly}
          title={readOnly ? READ_ONLY_TOOLTIP : undefined}
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
            disabled={actionLoading || readOnly}
            title={readOnly ? READ_ONLY_TOOLTIP : undefined}
            className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            Gửi lại email mời
          </button>
        )}
        <button
          onClick={handleResetPassword}
          disabled={actionLoading || readOnly}
          title={readOnly ? READ_ONLY_TOOLTIP : undefined}
          className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
        >
          Đặt lại mật khẩu
        </button>
        <button
          onClick={() => setShowHonoraryModal(true)}
          disabled={actionLoading || readOnly}
          title={readOnly ? READ_ONLY_TOOLTIP : undefined}
          className="rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-50"
        >
          Ghi nhận đóng góp phi tài chính
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

        {/* ── Honorary contributions ───────────────────────────────────── */}
        {activeTab === "honorary" && (
          <div className="space-y-4">
            <p className="text-sm text-brand-500">
              Ghi nhận đóng góp phi tài chính (nghiên cứu, hậu cần, đối ngoại...) — cộng vào tổng đóng góp để thăng hạng hội viên.
            </p>
            {honoraries.length === 0 ? (
              <p className="text-sm text-brand-400 py-4 text-center">Chưa có ghi nhận đóng góp danh dự nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-200 text-left">
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Ngày</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Danh mục</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Quy đổi</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Gia hạn</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Lý do</th>
                      <th className="py-2.5 font-medium text-brand-500">Ghi bởi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {honoraries.map((h) => (
                      <tr key={h.id}>
                        <td className="py-3 pr-4 text-brand-700 whitespace-nowrap">{fmtDate(h.createdAt)}</td>
                        <td className="py-3 pr-4 text-brand-600">{honoraryCategoryLabel[h.category]}</td>
                        <td className="py-3 pr-4 text-brand-900 font-medium whitespace-nowrap">{fmtVND(h.creditAmount)}</td>
                        <td className="py-3 pr-4 text-brand-600 whitespace-nowrap">{h.extendMonths > 0 ? `+${h.extendMonths} tháng` : "—"}</td>
                        <td className="py-3 pr-4 text-brand-700 max-w-sm whitespace-pre-wrap wrap-break-word">{h.reason}</td>
                        <td className="py-3 text-brand-500 text-xs whitespace-nowrap">{h.createdBy?.name ?? "—"}</td>
                      </tr>
                    ))}
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

      {/* ── Honorary modal ────────────────────────────────────────────── */}
      {showHonoraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-brand-200">
              <h3 className="text-lg font-bold text-brand-900">Ghi nhận đóng góp phi tài chính</h3>
              <p className="text-xs text-brand-500 mt-1">Cộng vào tổng đóng góp của {user.name} để thăng hạng.</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Danh mục</label>
                <select
                  value={honoraryForm.category}
                  onChange={(e) => setHonoraryForm((f) => ({ ...f, category: e.target.value as Honorary["category"] }))}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="RESEARCH">Nghiên cứu khoa học</option>
                  <option value="LOGISTICS">Hậu cần sự kiện</option>
                  <option value="EXTERNAL_RELATIONS">Đối ngoại</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Số tiền quy đổi (VND)</label>
                <input
                  type="number"
                  min={0}
                  step={100000}
                  value={honoraryForm.creditAmount}
                  onChange={(e) => setHonoraryForm((f) => ({ ...f, creditAmount: e.target.value }))}
                  placeholder="Ví dụ: 5000000"
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100"
                />
                <p className="text-xs text-brand-400 mt-1">Mức quy đổi này sẽ cộng vào tổng đóng góp để tính hạng Bạc/Vàng.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Số tháng gia hạn membership</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={honoraryForm.extendMonths}
                  onChange={(e) => setHonoraryForm((f) => ({ ...f, extendMonths: e.target.value }))}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100"
                />
                <p className="text-xs text-brand-400 mt-1">Mặc định 12 tháng. Đặt 0 nếu chỉ muốn cộng đóng góp mà không gia hạn.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">Lý do <span className="text-red-500">*</span></label>
                <textarea
                  value={honoraryForm.reason}
                  onChange={(e) => setHonoraryForm((f) => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  placeholder="Mô tả cụ thể đóng góp của hội viên..."
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-100 resize-none"
                />
              </div>
              {honoraryError && <p className="text-sm text-red-600">{honoraryError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-brand-200 flex justify-end gap-2">
              <button
                onClick={() => { setShowHonoraryModal(false); setHonoraryError(null) }}
                disabled={actionLoading}
                className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleSubmitHonorary}
                disabled={actionLoading}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? "Đang lưu..." : "Ghi nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
