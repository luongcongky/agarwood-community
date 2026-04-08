"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

type BankInfo = {
  bankName: string
  accountNumber: string
  accountName: string
  amount: number
  description: string
}

type Props = {
  name: string
  initials: string
  accountType: string
  membershipExpires: string | null
  daysLeft: number
  contributionTotal: number
  displayPriority: number
  tierLabel: string
  tierStars: number
  totalVIP: number
  feeMin: number
  feeMax: number
  hasBankInfo: boolean
  history: { amountPaid: number; validFrom: string; validTo: string; status: string }[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(n: number) { return n.toLocaleString("vi-VN") + "đ" }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ACTIVE:          { label: "Đang hiệu lực", cls: "bg-green-100 text-green-700" },
  EXPIRED:         { label: "Hết hạn",        cls: "bg-red-100 text-red-700" },
  PENDING_PAYMENT: { label: "Chờ xác nhận",   cls: "bg-yellow-100 text-yellow-700" },
}

// ── Component ────────────────────────────────────────────────────────────────

export function RenewalClient({
  name,
  initials,
  accountType,
  membershipExpires,
  daysLeft,
  contributionTotal,
  displayPriority,
  tierLabel,
  tierStars,
  totalVIP,
  feeMin,
  feeMax,
  hasBankInfo,
  history,
}: Props) {
  const router = useRouter()
  const [selectedAmount, setSelectedAmount] = useState<number>(feeMax)
  const [step, setStep] = useState<"select" | "transfer" | "note" | "done">("select")
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [noteText, setNoteText] = useState("")

  const expiryDisplay = membershipExpires
    ? formatDate(membershipExpires)
    : "Chưa kích hoạt"

  const isIndividual = accountType === "INDIVIDUAL"

  const feeOptions = isIndividual
    ? [
        {
          amount: feeMin,
          label: `${formatVND(feeMin)} / năm`,
          benefits: ["Duy trì quyền hội viên", "Đăng bài trên Feed", "Truy cập tài liệu Hội"],
          recommended: false,
        },
        {
          amount: feeMax,
          label: `${formatVND(feeMax)} / năm`,
          tag: "Được khuyến nghị",
          benefits: ["Duy trì quyền hội viên", "Ưu tiên feed cao hơn", "Thăng hạng nhanh hơn"],
          recommended: true,
        },
      ]
    : [
        {
          amount: feeMin,
          label: `${formatVND(feeMin)} / năm`,
          benefits: ["Duy trì quyền VIP", "Ưu tiên feed cơ bản", `Hạng tùy tích lũy`],
          recommended: false,
        },
        {
          amount: feeMax,
          label: `${formatVND(feeMax)} / năm`,
          tag: "Được khuyến nghị",
          benefits: ["Duy trì quyền VIP", "Ưu tiên feed cao hơn gấp đôi", "Thăng hạng nhanh hơn"],
          recommended: true,
        },
      ]

  // ── Step 1: Create payment request ─────────────────────────────────

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
        setError(data.error ?? "Đã xảy ra lỗi.")
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

  // ── Copy CK description ───────────────────────────────────────────

  async function handleCopy() {
    if (!bankInfo) return
    try {
      await navigator.clipboard.writeText(bankInfo.description)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }

  // ── Step 2: Confirm transfer + optional note ──────────────────────

  function handleTransferDone() {
    setStep("note")
  }

  async function handleSubmitNote() {
    setSubmitting(true)
    // Note is optional — just redirect to history
    // The payment was already created in step 1
    // If we want to update the note, we'd need an API call
    // For now, redirect immediately
    router.push("/thanh-toan/lich-su")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Gia hạn hội viên</h1>

      {/* ── DONE state ────────────────────────────────────────────────── */}
      {step === "done" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-semibold text-green-800">Yêu cầu đã được ghi nhận!</h2>
          <p className="text-sm text-green-700">
            Admin sẽ xác nhận chuyển khoản của bạn trong vòng 1–2 ngày làm việc.
          </p>
          <Link href="/thanh-toan/lich-su" className="inline-block bg-green-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-green-800 transition-colors">
            Xem lịch sử thanh toán
          </Link>
        </div>
      )}

      {/* ── NOTE state (after clicking "Toi da chuyen khoan") ─────────── */}
      {step === "note" && (
        <div className="bg-white border border-brand-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-brand-800">Ghi chú cho admin (không bắt buộc)</h2>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder='Ví dụ: "Em đã CK sáng nay lúc 9h ạ"'
            rows={3}
            className="w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-colors resize-none"
          />
          <button
            onClick={handleSubmitNote}
            disabled={submitting}
            className="w-full bg-brand-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-60"
          >
            {submitting ? "Đang ghi nhận..." : "Gửi xác nhận"}
          </button>
        </div>
      )}

      {/* ── TRANSFER state ────────────────────────────────────────────── */}
      {step === "transfer" && bankInfo && (
        <div className="bg-white border-2 border-brand-300 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-brand-800">Thông tin chuyển khoản</h2>

          <div className="space-y-0 divide-y divide-brand-100 text-sm">
            <div className="flex justify-between py-3">
              <span className="text-brand-500">Ngân hàng</span>
              <span className="font-semibold text-brand-900">{bankInfo.bankName}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-brand-500">Số tài khoản</span>
              <span className="font-semibold text-brand-900 font-mono">{bankInfo.accountNumber}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-brand-500">Chủ tài khoản</span>
              <span className="font-semibold text-brand-900">{bankInfo.accountName}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-brand-500">Số tiền</span>
              <span className="font-bold text-brand-700 text-base">{formatVND(bankInfo.amount)}</span>
            </div>
          </div>

          {/* CK description with copy */}
          <div>
            <p className="text-xs text-brand-500 mb-2">Nội dung chuyển khoản:</p>
            <div className="flex items-center gap-2 bg-brand-50 rounded-lg px-4 py-3 border border-brand-200">
              <span className="font-mono font-bold text-brand-900 flex-1 text-sm select-all">{bankInfo.description}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-md border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-white transition-colors"
              >
                {copied ? "✓ Đã copy" : "Copy"}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            Vui lòng nhập <strong>đúng nội dung chuyển khoản</strong> để admin có thể xác nhận nhanh nhất.
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("select")}
              className="flex-1 border border-brand-300 text-brand-700 rounded-xl py-3 text-sm font-medium hover:bg-brand-50 transition-colors"
            >
              ← Quay lại
            </button>
            <button
              onClick={handleTransferDone}
              className="flex-2 bg-brand-700 text-white rounded-xl py-3 px-6 text-sm font-semibold hover:bg-brand-800 transition-colors"
            >
              Tôi đã chuyển khoản ✓
            </button>
          </div>
        </div>
      )}

      {/* ── SELECT state ──────────────────────────────────────────────── */}
      {step === "select" && (
        <>
          {/* Membership status card */}
          <div className={cn(
            "rounded-2xl p-6 space-y-3 border",
            daysLeft > 0 ? "bg-white border-brand-200" : "bg-red-50 border-red-200",
          )}>
            <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide">Membership của bạn</h2>
            <p className="text-lg font-bold text-brand-900">
              {"★".repeat(tierStars)} {tierLabel}
            </p>
            <p className="text-sm text-brand-700">
              Hiệu lực đến: <span className="font-semibold">{expiryDisplay}</span>
              {daysLeft > 0 && <span className="text-brand-500"> (còn {daysLeft} ngày)</span>}
            </p>

            {daysLeft <= 0 && (
              <div className="bg-red-100 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                Membership đã hết hạn {Math.abs(daysLeft)} ngày trước. Gia hạn ngay để khôi phục quyền đăng bài và ưu tiên feed.
              </div>
            )}
            {daysLeft > 0 && daysLeft <= 30 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                Membership sắp hết hạn trong {daysLeft} ngày.
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-brand-50 rounded-lg p-3 text-center">
                <p className="text-xs text-brand-500 mb-1">Tổng đóng góp</p>
                <p className="font-bold text-brand-800 text-sm">{formatVND(contributionTotal)}</p>
              </div>
              <div className="bg-brand-50 rounded-lg p-3 text-center">
                <p className="text-xs text-brand-500 mb-1">Ưu tiên feed</p>
                <p className="font-bold text-brand-800 text-sm">#{displayPriority} / {totalVIP}</p>
              </div>
              <div className="bg-brand-50 rounded-lg p-3 text-center">
                <p className="text-xs text-brand-500 mb-1">Hạng</p>
                <p className="font-bold text-brand-800 text-sm">{"★".repeat(tierStars)}</p>
              </div>
            </div>
          </div>

          {/* Bank info warning */}
          {!hasBankInfo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
              Bạn chưa cập nhật thông tin ngân hàng hoàn tiền.{" "}
              <Link href="/ho-so" className="underline font-medium">Cập nhật tại hồ sơ</Link> để nhận hoàn phí khi cần.
            </div>
          )}

          {/* Fee selection cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {feeOptions.map((opt) => (
              <button
                key={opt.amount}
                onClick={() => setSelectedAmount(opt.amount)}
                className={cn(
                  "relative rounded-2xl border-2 p-5 text-left transition-all",
                  selectedAmount === opt.amount
                    ? "border-brand-600 bg-brand-50 shadow-sm"
                    : "border-brand-200 bg-white hover:border-brand-400",
                )}
              >
                {opt.recommended && (
                  <span className="absolute -top-2.5 right-4 bg-brand-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Được khuyến nghị
                  </span>
                )}
                <p className="text-lg font-bold text-brand-900 mb-3">{opt.label}</p>
                <ul className="space-y-1.5">
                  {opt.benefits.map((b, i) => (
                    <li key={i} className="text-sm text-brand-600 flex items-start gap-2">
                      <span className="text-brand-400 shrink-0">·</span>
                      {b}
                    </li>
                  ))}
                </ul>
                {selectedAmount === opt.amount && (
                  <div className="mt-3 text-xs font-semibold text-brand-700">✓ Đã chọn</div>
                )}
              </button>
            ))}
          </div>

          {/* History table */}
          {history.length > 0 && (
            <div className="bg-white border border-brand-200 rounded-2xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide">Lịch sử đóng phí</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-brand-500 text-xs border-b border-brand-200">
                    <th className="text-left py-2 font-medium">Số tiền</th>
                    <th className="text-left py-2 font-medium">Hiệu lực</th>
                    <th className="text-left py-2 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {history.map((h, i) => {
                    const st = STATUS_LABELS[h.status] ?? { label: h.status, cls: "bg-gray-100 text-gray-600" }
                    return (
                      <tr key={i}>
                        <td className="py-3 font-medium text-brand-800">{formatVND(h.amountPaid)}</td>
                        <td className="py-3 text-xs text-brand-500">{formatDate(h.validFrom)} – {formatDate(h.validTo)}</td>
                        <td className="py-3">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", st.cls)}>{st.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* CTA */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
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
