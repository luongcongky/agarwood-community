"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { VIETNAM_BANKS } from "@/lib/constants/banks"
import { updateProfile, updateBankInfo } from "./_actions/update-profile"
import { changePassword } from "./_actions/change-password"

// ── Types ────────────────────────────────────────────────────────────────────

type UserProfile = {
  id: string
  name: string
  email: string
  phone: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  bankName: string | null
  role: string
  contributionTotal: number
  membershipExpires: string | null
  displayPriority: number
  company: { id: string; name: string; slug: string } | null
}

type MembershipRow = {
  id: string
  amountPaid: number
  validFrom: string
  validTo: string
  status: string
  paymentStatus: string | null
  createdAt: string
}

type Tab = "personal" | "bank" | "security" | "history"

const TABS: { key: Tab; label: string }[] = [
  { key: "personal", label: "Thông tin cá nhân" },
  { key: "bank",     label: "Ngân hàng" },
  { key: "security", label: "Bảo mật" },
  { key: "history",  label: "Lịch sử" },
]

// ── Shared UI ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-colors"

const selectClass =
  "w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-colors"

function Field({ label, children, required, hint }: {
  label: string
  children: React.ReactNode
  required?: boolean
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-brand-800">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-brand-400">{hint}</p>}
    </div>
  )
}

function Alert({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div className={cn(
      "rounded-lg border px-4 py-3 text-sm",
      type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700",
    )}>
      {message}
    </div>
  )
}

function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors",
        loading ? "opacity-60 cursor-not-allowed" : "hover:bg-brand-800",
      )}
    >
      {loading ? loadingLabel : label}
    </button>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ProfileTabs({
  user,
  memberships,
  hasBankInfo,
}: {
  user: UserProfile
  memberships: MembershipRow[]
  hasBankInfo: boolean
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>(hasBankInfo ? "personal" : "bank")

  // ── Personal info state ──────────────────────────────────────────────
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? "")
  const [personalLoading, setPersonalLoading] = useState(false)
  const [personalMsg, setPersonalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // ── Bank info state ──────────────────────────────────────────────────
  const [bankName, setBankName] = useState(user.bankName ?? "")
  const [bankAccountNumber, setBankAccountNumber] = useState(user.bankAccountNumber ?? "")
  const [bankAccountName, setBankAccountName] = useState(user.bankAccountName ?? "")
  const [bankLoading, setBankLoading] = useState(false)
  const [bankMsg, setBankMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // ── Password state ───────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // ── Handlers ─────────────────────────────────────────────────────────

  async function handlePersonalSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPersonalLoading(true)
    setPersonalMsg(null)
    try {
      const result = await updateProfile({ name, phone })
      if (result.error) {
        setPersonalMsg({ type: "error", text: result.error })
      } else {
        setPersonalMsg({ type: "success", text: "Đã cập nhật thông tin cá nhân." })
        router.refresh()
      }
    } catch {
      setPersonalMsg({ type: "error", text: "Không thể kết nối máy chủ." })
    } finally {
      setPersonalLoading(false)
    }
  }

  async function handleBankSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBankLoading(true)
    setBankMsg(null)
    try {
      const result = await updateBankInfo({ bankName, bankAccountNumber, bankAccountName })
      if (result.error) {
        setBankMsg({ type: "error", text: result.error })
      } else {
        setBankMsg({ type: "success", text: "Đã cập nhật thông tin ngân hàng." })
        router.refresh()
      }
    } catch {
      setBankMsg({ type: "error", text: "Không thể kết nối máy chủ." })
    } finally {
      setBankLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwLoading(true)
    setPwMsg(null)
    try {
      const result = await changePassword({ currentPassword, newPassword, confirmPassword })
      if (result.error) {
        setPwMsg({ type: "error", text: result.error })
      } else {
        setPwMsg({ type: "success", text: "Đã đổi mật khẩu thành công." })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      setPwMsg({ type: "error", text: "Không thể kết nối máy chủ." })
    } finally {
      setPwLoading(false)
    }
  }

  // ── Membership helpers ───────────────────────────────────────────────

  const daysLeft = user.membershipExpires
    ? Math.max(0, Math.ceil((new Date(user.membershipExpires).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function formatVND(amount: number) {
    return amount.toLocaleString("vi-VN") + " đ"
  }

  function membershipStatusLabel(status: string) {
    switch (status) {
      case "ACTIVE":          return { text: "Đang hiệu lực", cls: "bg-green-100 text-green-800" }
      case "EXPIRED":         return { text: "Hết hạn",        cls: "bg-brand-100 text-brand-600" }
      case "PENDING_PAYMENT": return { text: "Chờ thanh toán", cls: "bg-yellow-100 text-yellow-800" }
      default:                return { text: status,           cls: "bg-brand-100 text-brand-600" }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-brand-200 overflow-hidden">
      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-brand-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
              activeTab === tab.key
                ? "text-brand-800"
                : "text-brand-400 hover:text-brand-600",
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-700" />
            )}
            {/* Badge on bank tab if missing */}
            {tab.key === "bank" && !hasBankInfo && (
              <span className="ml-1.5 inline-flex w-2 h-2 rounded-full bg-yellow-500" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="p-6">

        {/* ── Tab 1: Thông tin cá nhân ──────────────────────────────────── */}
        {activeTab === "personal" && (
          <form onSubmit={handlePersonalSubmit} className="space-y-5">
            <Field label="Email" hint="Email không thể thay đổi. Liên hệ ban quản trị nếu cần.">
              <input type="email" value={user.email} disabled className={cn(inputClass, "bg-brand-50 cursor-not-allowed")} />
            </Field>

            <Field label="Họ và tên" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                minLength={2}
              />
            </Field>

            <Field label="Số điện thoại">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className={inputClass}
              />
            </Field>

            {/* Company link */}
            {user.company && (
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <p className="text-xs font-medium text-brand-400 uppercase tracking-wide mb-1">Doanh nghiệp đại diện</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-brand-900">{user.company.name}</p>
                  <Link
                    href={`/doanh-nghiep/${user.company.slug}/chinh-sua`}
                    className="text-xs text-brand-600 hover:text-brand-800 underline"
                  >
                    Chỉnh sửa
                  </Link>
                </div>
              </div>
            )}

            {personalMsg && <Alert type={personalMsg.type} message={personalMsg.text} />}
            <div className="flex justify-end">
              <SubmitButton loading={personalLoading} label="Lưu thay đổi" loadingLabel="Đang lưu..." />
            </div>
          </form>
        )}

        {/* ── Tab 2: Ngân hàng ──────────────────────────────────────────── */}
        {activeTab === "bank" && (
          <form onSubmit={handleBankSubmit} className="space-y-5">
            {!hasBankInfo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
                Thông tin ngân hàng dùng để hoàn trả phí chứng nhận khi hồ sơ không được chấp nhận. Vui lòng điền đầy đủ.
              </div>
            )}

            <Field label="Ngân hàng" required>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className={selectClass}
              >
                <option value="">-- Chọn ngân hàng --</option>
                {VIETNAM_BANKS.map((b) => (
                  <option key={b.code} value={b.name}>{b.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Số tài khoản" required hint="Chỉ bao gồm chữ số, từ 6-20 ký tự.">
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="0123456789"
                className={inputClass}
                inputMode="numeric"
              />
            </Field>

            <Field label="Tên chủ tài khoản" required hint="Viết IN HOA không dấu, ví dụ: NGUYEN VAN A">
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                placeholder="NGUYEN VAN A"
                className={inputClass}
              />
            </Field>

            {bankMsg && <Alert type={bankMsg.type} message={bankMsg.text} />}
            <div className="flex justify-end">
              <SubmitButton loading={bankLoading} label="Lưu thông tin" loadingLabel="Đang lưu..." />
            </div>
          </form>
        )}

        {/* ── Tab 3: Bảo mật ────────────────────────────────────────────── */}
        {activeTab === "security" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <Field label="Mật khẩu hiện tại" required>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </Field>

            <Field label="Mật khẩu mới" required hint="Tối thiểu 8 ký tự.">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </Field>

            <Field label="Xác nhận mật khẩu mới" required>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </Field>

            {pwMsg && <Alert type={pwMsg.type} message={pwMsg.text} />}
            <div className="flex justify-end">
              <SubmitButton loading={pwLoading} label="Đổi mật khẩu" loadingLabel="Đang đổi..." />
            </div>
          </form>
        )}

        {/* ── Tab 4: Lịch sử membership ─────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <p className="text-xs text-brand-400 mb-1">Tổng đóng góp</p>
                <p className="text-lg font-bold text-brand-900">{formatVND(user.contributionTotal)}</p>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <p className="text-xs text-brand-400 mb-1">Mức ưu tiên</p>
                <p className="text-lg font-bold text-brand-900">{user.displayPriority}</p>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 col-span-2 sm:col-span-1">
                <p className="text-xs text-brand-400 mb-1">Còn lại</p>
                <p className="text-lg font-bold text-brand-900">
                  {daysLeft > 0 ? `${daysLeft} ngày` : "Hết hạn"}
                </p>
              </div>
            </div>

            {/* Renew CTA */}
            {daysLeft > 0 && daysLeft <= 30 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <p className="text-sm text-yellow-800">
                  Membership sắp hết hạn trong <span className="font-semibold">{daysLeft} ngày</span>.
                </p>
                <Link
                  href="/gia-han"
                  className="shrink-0 rounded-lg bg-brand-700 text-white text-sm font-semibold px-4 py-2 hover:bg-brand-800 transition-colors"
                >
                  Gia hạn ngay
                </Link>
              </div>
            )}

            {/* Table */}
            {memberships.length === 0 ? (
              <p className="text-sm text-brand-400 py-6 text-center">Chưa có lịch sử đóng phí.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-200 text-left">
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Ngày nộp</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Hiệu lực</th>
                      <th className="py-2.5 pr-4 font-medium text-brand-500">Số tiền</th>
                      <th className="py-2.5 font-medium text-brand-500">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {memberships.map((m) => {
                      const st = membershipStatusLabel(m.status)
                      return (
                        <tr key={m.id}>
                          <td className="py-3 pr-4 text-brand-700 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                          <td className="py-3 pr-4 text-brand-600 whitespace-nowrap">
                            {formatDate(m.validFrom)} – {formatDate(m.validTo)}
                          </td>
                          <td className="py-3 pr-4 text-brand-900 font-medium whitespace-nowrap">{formatVND(m.amountPaid)}</td>
                          <td className="py-3">
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", st.cls)}>
                              {st.text}
                            </span>
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
      </div>
    </div>
  )
}
