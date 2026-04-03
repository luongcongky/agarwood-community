"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type MembershipHistoryItem = {
  amountPaid: number
  validFrom: string
  validTo: string
  status: string
  year: number
}

type Props = {
  userId: string
  name: string
  email: string
  membershipExpires: string | null
  daysLeft: number
  contributionTotal: number
  displayPriority: number
  history: MembershipHistoryItem[]
}

const FEE_OPTIONS = [
  {
    amount: 5_000_000,
    label: "5.000.000đ / năm",
    description: "Ưu tiên chuẩn",
    priorityNote: "Tăng +50 điểm ưu tiên hiển thị",
  },
  {
    amount: 10_000_000,
    label: "10.000.000đ / năm",
    description: "Ưu tiên cao",
    priorityNote: "Tăng +100 điểm ưu tiên hiển thị — bài đăng được đẩy lên cao hơn",
    recommended: true,
  },
] as const

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "✓ Đã kích hoạt", color: "text-green-700 bg-green-100" },
  EXPIRED: { label: "Hết hạn", color: "text-red-700 bg-red-100" },
  PENDING_PAYMENT: { label: "Chờ thanh toán", color: "text-yellow-700 bg-yellow-100" },
}

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ"
}

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function RenewalClient({
  name,
  membershipExpires,
  daysLeft,
  contributionTotal,
  displayPriority,
  history,
}: Props) {
  const router = useRouter()
  const [selectedAmount, setSelectedAmount] = useState<number>(5_000_000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRenew() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/membership/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Đã xảy ra lỗi. Vui lòng thử lại.")
        return
      }
      router.push(data.paymentUrl)
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const expiryDisplay = membershipExpires
    ? new Date(membershipExpires).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Chưa có"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold text-brand-900">
        Gia hạn hội viên
      </h1>

      {/* Section 1: Current membership status */}
      <div className="bg-white border border-brand-200 rounded-2xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide">
          Trạng thái membership hiện tại
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg font-bold text-brand-900">{name}</span>
          <span className="text-sm bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
            VIP
          </span>
        </div>
        <p className="text-brand-700 text-sm">
          Hết hạn:{" "}
          <span className="font-semibold text-brand-900">{expiryDisplay}</span>
        </p>

        {/* Warning banners */}
        {daysLeft < 0 ? (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <span className="shrink-0 text-base">❌</span>
            <span>
              Membership đã hết hạn. Gia hạn để tiếp tục sử dụng đầy đủ tính
              năng.
            </span>
          </div>
        ) : daysLeft < 30 ? (
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <span className="shrink-0 text-base">⚠️</span>
            <span>Membership sắp hết hạn trong {daysLeft} ngày.</span>
          </div>
        ) : (
          <p className="text-green-700 text-sm font-medium">
            Còn {daysLeft} ngày
          </p>
        )}

        {/* Contribution stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-brand-50 rounded-lg p-3 text-center">
            <p className="text-xs text-brand-500 mb-1">Tổng đóng góp</p>
            <p className="font-bold text-brand-800 text-sm">
              {formatVND(contributionTotal)}
            </p>
          </div>
          <div className="bg-brand-50 rounded-lg p-3 text-center">
            <p className="text-xs text-brand-500 mb-1">Điểm ưu tiên</p>
            <p className="font-bold text-brand-800 text-sm">{displayPriority}</p>
          </div>
        </div>
      </div>

      {/* Section 2: Fee selection */}
      <div className="bg-white border border-brand-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide">
          Chọn mức phí gia hạn
        </h2>
        <div className="space-y-3">
          {FEE_OPTIONS.map((opt) => (
            <label
              key={opt.amount}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                selectedAmount === opt.amount
                  ? "border-brand-600 bg-brand-50"
                  : "border-brand-200 hover:border-brand-400 bg-white"
              )}
            >
              <input
                type="radio"
                name="fee"
                value={opt.amount}
                checked={selectedAmount === opt.amount}
                onChange={() => setSelectedAmount(opt.amount)}
                className="mt-0.5 accent-brand-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-brand-900">
                    {opt.label}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      opt.recommended
                        ? "bg-brand-500 text-white"
                        : "bg-brand-100 text-brand-700"
                    )}
                  >
                    {opt.description}
                  </span>
                </div>
                <p className="text-xs text-brand-500 mt-0.5">{opt.priorityNote}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Section 3: Payment history */}
      {history.length > 0 && (
        <div className="bg-white border border-brand-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide">
            Lịch sử đóng phí
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-brand-500 text-xs border-b border-brand-100">
                <th className="text-left py-2 font-medium">Năm</th>
                <th className="text-left py-2 font-medium">Số tiền</th>
                <th className="text-left py-2 font-medium">Hiệu lực</th>
                <th className="text-left py-2 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {history.map((item, i) => {
                const statusInfo =
                  STATUS_LABELS[item.status] ?? {
                    label: item.status,
                    color: "text-brand-600 bg-brand-100",
                  }
                return (
                  <tr key={i} className="text-brand-800">
                    <td className="py-3 font-medium">{item.year}</td>
                    <td className="py-3">{formatVND(item.amountPaid)}</td>
                    <td className="py-3 text-xs text-brand-500">
                      {formatDate(item.validFrom)} – {formatDate(item.validTo)}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          statusInfo.color
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 4: CTA */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        onClick={handleRenew}
        disabled={loading}
        className="w-full bg-brand-700 text-white rounded-xl py-4 text-base font-semibold hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
      >
        {loading
          ? "Đang xử lý..."
          : `Gia hạn ngay — ${formatVND(selectedAmount)} — Thanh toán PayOS`}
      </button>
      <p className="text-center text-xs text-brand-400">
        Bạn sẽ được chuyển đến trang thanh toán PayOS an toàn.
      </p>
    </div>
  )
}
