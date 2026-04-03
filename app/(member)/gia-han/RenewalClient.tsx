"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type BankInfo = {
  bankName: string
  accountNumber: string
  accountName: string
  amount: number
  description: string
}

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
  const [selectedAmount, setSelectedAmount] = useState<number>(5_000_000)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"select" | "transfer" | "done">("select")
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)

  async function handleShowTransfer() {
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
      setBankInfo(data.bankInfo)
      setStep("transfer")
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  function handleConfirmTransfer() {
    setConfirming(true)
    setStep("done")
    setConfirming(false)
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

      {/* "done" state: full-page success */}
      {step === "done" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-semibold text-green-800">Yêu cầu đã được ghi nhận!</h2>
          <p className="text-sm text-green-700">
            Admin sẽ xác nhận chuyển khoản của bạn trong vòng 1–2 ngày làm việc.
            Membership sẽ được kích hoạt ngay sau khi xác nhận.
          </p>
          <Link href="/thanh-toan/lich-su" className="inline-block bg-green-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-green-800 transition-colors">
            Xem lịch sử thanh toán
          </Link>
        </div>
      )}

      {/* "transfer" state: bank transfer card */}
      {step === "transfer" && bankInfo && (
        <div className="bg-white border-2 border-brand-300 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-brand-800">Hướng dẫn chuyển khoản</h2>

          {/* Transfer info rows */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-brand-100">
              <span className="text-brand-500">Ngân hàng</span>
              <span className="font-semibold text-brand-900">{bankInfo.bankName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-brand-100">
              <span className="text-brand-500">Số tài khoản</span>
              <span className="font-semibold text-brand-900 font-mono">{bankInfo.accountNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-brand-100">
              <span className="text-brand-500">Chủ tài khoản</span>
              <span className="font-semibold text-brand-900">{bankInfo.accountName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-brand-100">
              <span className="text-brand-500">Số tiền</span>
              <span className="font-bold text-brand-700 text-base">{formatVND(bankInfo.amount)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-brand-500">Nội dung CK</span>
              <span className="font-bold text-brand-900 font-mono bg-brand-50 px-2 py-0.5 rounded">{bankInfo.description}</span>
            </div>
          </div>

          {/* Warning about description */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            ⚠️ Vui lòng nhập <strong>đúng nội dung chuyển khoản</strong> để admin có thể xác nhận nhanh nhất. Sau khi chuyển khoản, bấm "Tôi đã chuyển khoản" bên dưới.
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("select")}
              className="flex-1 border border-brand-300 text-brand-700 rounded-xl py-3 text-sm font-medium hover:bg-brand-50 transition-colors"
            >
              ← Quay lại
            </button>
            <button
              onClick={handleConfirmTransfer}
              disabled={confirming}
              className="flex-2 bg-brand-700 text-white rounded-xl py-3 px-6 text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-60"
            >
              {confirming ? "Đang ghi nhận..." : "Tôi đã chuyển khoản ✓"}
            </button>
          </div>
        </div>
      )}

      {/* "select" state: current status + fee selection + history */}
      {step === "select" && (
        <>
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
            onClick={handleShowTransfer}
            disabled={loading}
            className="w-full bg-brand-700 text-white rounded-xl py-4 text-base font-semibold hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? "Đang xử lý..." : "Xem hướng dẫn chuyển khoản →"}
          </button>
        </>
      )}
    </div>
  )
}
