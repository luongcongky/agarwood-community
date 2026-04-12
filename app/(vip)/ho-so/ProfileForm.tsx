"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type UserProfile = {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
  bankName: string | null
  role: string
  contributionTotal: number
  membershipExpires: string | null
  displayPriority: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function roleLabel(role: string): string {
  switch (role) {
    case "ADMIN": return "Quản trị viên"
    case "VIP": return "Hội viên"
    default: return "Tài khoản cơ bản"
  }
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case "ADMIN": return "bg-brand-900 text-brand-100"
    case "VIP": return "bg-brand-400 text-brand-900"
    default: return "bg-muted text-muted-foreground"
  }
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-brand-200 p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-brand-900">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function Field({
  label,
  children,
  required,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-brand-800">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  "w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-colors"

// ─── Alert ───────────────────────────────────────────────────────────────────

function Alert({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        type === "success"
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-red-50 border-red-200 text-red-700"
      )}
    >
      {message}
    </div>
  )
}

// ─── Main Form Component ─────────────────────────────────────────────────────

export function ProfileForm({ user }: { user: UserProfile }) {
  // Personal info state
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? "")
  const [personalLoading, setPersonalLoading] = useState(false)
  const [personalMsg, setPersonalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Bank info state
  const [bankAccountName, setBankAccountName] = useState(user.bankAccountName ?? "")
  const [bankAccountNumber, setBankAccountNumber] = useState(user.bankAccountNumber ?? "")
  const [bankName, setBankName] = useState(user.bankName ?? "")
  const [bankLoading, setBankLoading] = useState(false)
  const [bankMsg, setBankMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // ── Submit helpers ─────────────────────────────────────────────────────────

  async function patchProfile(data: Record<string, unknown>) {
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return res
  }

  async function handlePersonalSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPersonalLoading(true)
    setPersonalMsg(null)
    try {
      const res = await patchProfile({ name, phone })
      if (res.ok) {
        setPersonalMsg({ type: "success", text: "Đã cập nhật thông tin cá nhân." })
      } else {
        const d = await res.json()
        setPersonalMsg({ type: "error", text: d.error ?? "Đã xảy ra lỗi." })
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
      const res = await patchProfile({ bankAccountName, bankAccountNumber, bankName })
      if (res.ok) {
        setBankMsg({ type: "success", text: "Đã cập nhật thông tin ngân hàng." })
      } else {
        const d = await res.json()
        setBankMsg({ type: "error", text: d.error ?? "Đã xảy ra lỗi." })
      }
    } catch {
      setBankMsg({ type: "error", text: "Không thể kết nối máy chủ." })
    } finally {
      setBankLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "Mật khẩu mới không khớp." })
      return
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 8 ký tự." })
      return
    }
    setPwLoading(true)
    try {
      const res = await patchProfile({ currentPassword, newPassword })
      if (res.ok) {
        setPwMsg({ type: "success", text: "Đã đổi mật khẩu thành công." })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const d = await res.json()
        setPwMsg({ type: "error", text: d.error ?? "Đã xảy ra lỗi." })
      }
    } catch {
      setPwMsg({ type: "error", text: "Không thể kết nối máy chủ." })
    } finally {
      setPwLoading(false)
    }
  }

  // ── Membership display ────────────────────────────────────────────────────

  const membershipExpires = user.membershipExpires ? new Date(user.membershipExpires) : null
  const isActive = membershipExpires ? membershipExpires > new Date() : false

  return (
    <div className="space-y-6">
      {/* ── Read-only account info ──────────────────────────────────────── */}
      <SectionCard title="Thông tin tài khoản">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm font-medium text-brand-900">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Vai trò</p>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                roleBadgeClass(user.role)
              )}
            >
              {roleLabel(user.role)}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Trạng thái hội viên</p>
            {user.role === "VIP" || user.role === "ADMIN" ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-700"
                )}
              >
                {isActive ? "Còn hiệu lực" : "Hết hạn"}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
          {membershipExpires && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hết hạn vào</p>
              <p className="text-sm font-medium text-brand-900">
                {membershipExpires.toLocaleDateString("vi-VN")}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Đóng góp tích lũy</p>
            <p className="text-sm font-medium text-brand-900">
              {user.contributionTotal.toLocaleString("vi-VN")} ₫
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Mức ưu tiên hiển thị</p>
            <p className="text-sm font-medium text-brand-900">{user.displayPriority}</p>
          </div>
        </div>
      </SectionCard>

      {/* ── Personal info form ──────────────────────────────────────────── */}
      <SectionCard title="Thông tin cá nhân">
        <form onSubmit={handlePersonalSubmit} className="space-y-4">
          <Field label="Họ và tên" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
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
          {personalMsg && <Alert type={personalMsg.type} message={personalMsg.text} />}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={personalLoading}
              className={cn(
                "rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition-colors",
                personalLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-brand-800"
              )}
            >
              {personalLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Bank info form ──────────────────────────────────────────────── */}
      <SectionCard
        title="Thông tin ngân hàng"
        description="Dùng để hoàn trả phí xét duyệt chứng nhận trong trường hợp hồ sơ không được chấp nhận."
      >
        <form onSubmit={handleBankSubmit} className="space-y-4">
          <Field label="Tên chủ tài khoản">
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              placeholder="NGUYEN VAN A"
              className={inputClass}
            />
          </Field>
          <Field label="Số tài khoản">
            <input
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="0123456789"
              className={inputClass}
            />
          </Field>
          <Field label="Ngân hàng">
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Vietcombank, Techcombank, MB Bank..."
              className={inputClass}
            />
          </Field>
          {bankMsg && <Alert type={bankMsg.type} message={bankMsg.text} />}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={bankLoading}
              className={cn(
                "rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition-colors",
                bankLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-brand-800"
              )}
            >
              {bankLoading ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Change password form ────────────────────────────────────────── */}
      <SectionCard title="Đổi mật khẩu">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Field label="Mật khẩu hiện tại" required>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
              required
            />
          </Field>
          <Field label="Mật khẩu mới" required>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
          <Field label="Xác nhận mật khẩu mới" required>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
              required
            />
          </Field>
          <p className="text-xs text-muted-foreground">Mật khẩu phải có ít nhất 8 ký tự.</p>
          {pwMsg && <Alert type={pwMsg.type} message={pwMsg.text} />}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwLoading}
              className={cn(
                "rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition-colors",
                pwLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-brand-800"
              )}
            >
              {pwLoading ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
