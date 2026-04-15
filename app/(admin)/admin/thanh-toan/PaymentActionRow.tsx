"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

export function PaymentActionRow({
  id,
  userName,
  userEmail,
  paymentType,
  userBankInfo,
}: {
  id: string
  userName: string
  userEmail: string
  paymentType: string
  userBankInfo?: { bankName: string | null; accountNumber: string | null; accountName: string | null } | null
}) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [status, setStatus] = useState<"idle" | "loading" | "confirmed" | "rejected" | "rejecting">("idle")
  const [rejectReason, setRejectReason] = useState("")
  const [rejectError, setRejectError] = useState("")

  async function handleConfirm() {
    setStatus("loading")
    const res = await fetch(`/api/admin/payments/${id}/confirm`, { method: "POST" })
    if (res.ok) {
      setStatus("confirmed")
      router.refresh()
    } else {
      setStatus("idle")
      alert("Có lỗi xảy ra. Vui lòng thử lại.")
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setRejectError("Vui lòng nhập lý do từ chối")
      return
    }
    setStatus("loading")
    setRejectError("")
    const res = await fetch(`/api/admin/payments/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    })
    if (res.ok) {
      setStatus("rejected")
      router.refresh()
    } else {
      setStatus("idle")
      alert("Có lỗi xảy ra. Vui lòng thử lại.")
    }
  }

  if (status === "confirmed") {
    return <span className="text-green-700 font-medium text-sm">✓ Đã xác nhận</span>
  }
  if (status === "rejected") {
    return <span className="text-red-600 font-medium text-sm">✗ Đã từ chối</span>
  }

  // Reject modal
  if (status === "rejecting") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3 mt-2">
        <p className="text-sm font-medium text-red-800">Lý do từ chối *</p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ví dụ: Không tìm thấy giao dịch với nội dung này trong bank statement"
          rows={2}
          className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
        />
        {rejectError && <p className="text-xs text-red-600">{rejectError}</p>}

        {/* Show VIP bank info for cert fee refund */}
        {paymentType === "CERTIFICATION_FEE" && userBankInfo?.bankName && (
          <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800">
            <p className="font-medium mb-1">TK hoàn tiền của {userName}:</p>
            <p>{userBankInfo.bankName} · {userBankInfo.accountNumber} · {userBankInfo.accountName}</p>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setStatus("idle"); setRejectReason(""); setRejectError("") }}
            className="px-3 py-1.5 rounded-lg border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleReject}
            disabled={readOnly}
            title={readOnly ? READ_ONLY_TOOLTIP : undefined}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setStatus("rejecting")}
        disabled={status === "loading" || readOnly}
        title={readOnly ? READ_ONLY_TOOLTIP : undefined}
        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        Từ chối ✕
      </button>
      <button
        onClick={handleConfirm}
        disabled={status === "loading" || readOnly}
        title={readOnly ? READ_ONLY_TOOLTIP : undefined}
        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Đang xử lý..." : "Xác nhận ✓"}
      </button>
    </div>
  )
}
