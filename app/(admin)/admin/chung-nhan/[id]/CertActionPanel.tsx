"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CertStatus } from "@prisma/client"

interface CertActionPanelProps {
  certId: string
  status: CertStatus
  approvedAt: Date | null
  rejectedAt: Date | null
  refundBankName: string | null
  refundAccountName: string | null
  refundAccountNo: string | null
  refundedAt: Date | null
}

export function CertActionPanel({
  certId,
  status,
  approvedAt,
  rejectedAt,
  refundBankName,
  refundAccountName,
  refundAccountNo,
  refundedAt,
}: CertActionPanelProps) {
  const router = useRouter()
  const [reviewNote, setReviewNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isLocked = status === "APPROVED" || status === "REJECTED" || status === "REFUNDED"
  const canAct = status === "PENDING" || status === "UNDER_REVIEW"

  async function callAction(endpoint: string, body?: Record<string, unknown>) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/certifications/${certId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Có lỗi xảy ra")
        return false
      }
      return true
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!window.confirm("Bạn có chắc muốn duyệt chứng nhận này?")) return
    const ok = await callAction("approve", { reviewNote })
    if (ok) router.refresh()
  }

  async function handleReject() {
    if (!reviewNote.trim()) {
      setError("Vui lòng nhập ghi chú khi từ chối.")
      return
    }
    if (!window.confirm("Bạn có chắc muốn từ chối đơn này?")) return
    const ok = await callAction("reject", { reviewNote })
    if (ok) router.refresh()
  }

  async function handleRefund() {
    if (!window.confirm("Xác nhận đã hoàn tiền cho hội viên?")) return
    const ok = await callAction("refund")
    if (ok) router.refresh()
  }

  const statusBadge: Record<CertStatus, { label: string; className: string }> = {
    DRAFT: { label: "Nháp", className: "bg-gray-100 text-gray-600" },
    PENDING: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-700" },
    UNDER_REVIEW: { label: "Đang xét duyệt", className: "bg-blue-100 text-blue-700" },
    APPROVED: { label: "Đã duyệt", className: "bg-green-100 text-green-700" },
    REJECTED: { label: "Từ chối", className: "bg-red-100 text-red-700" },
    REFUNDED: { label: "Đã hoàn tiền", className: "bg-purple-100 text-purple-700" },
  }

  const { label, className } = statusBadge[status]

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5 sticky top-6">
      <h2 className="text-base font-bold text-brand-900">Xét duyệt</h2>

      {/* Current status */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Trạng thái hiện tại</p>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${className}`}
        >
          {label}
        </span>
      </div>

      {/* Approved state */}
      {status === "APPROVED" && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          <p className="font-semibold">Đã cấp chứng nhận</p>
          {approvedAt && (
            <p className="text-xs mt-1">
              {new Date(approvedAt).toLocaleString("vi-VN")}
            </p>
          )}
        </div>
      )}

      {/* Rejected state */}
      {(status === "REJECTED" || status === "REFUNDED") && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 space-y-2">
          <p className="font-semibold">Đã từ chối</p>
          {rejectedAt && (
            <p className="text-xs">
              {new Date(rejectedAt).toLocaleString("vi-VN")}
            </p>
          )}

          {/* Refund info */}
          {status === "REJECTED" && !refundedAt && (
            <div className="pt-2 border-t border-red-200 space-y-1">
              <p className="font-semibold text-xs">Thông tin hoàn tiền</p>
              <p className="text-xs">Ngân hàng: {refundBankName ?? "—"}</p>
              <p className="text-xs">Chủ tài khoản: {refundAccountName ?? "—"}</p>
              <p className="text-xs">Số tài khoản: {refundAccountNo ?? "—"}</p>
              <button
                onClick={handleRefund}
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                Xác nhận đã hoàn tiền
              </button>
            </div>
          )}

          {refundedAt && (
            <p className="text-xs text-purple-700 font-medium">
              ✓ Đã hoàn tiền — {new Date(refundedAt).toLocaleDateString("vi-VN")}
            </p>
          )}
        </div>
      )}

      {/* Action form (only if pending/under_review) */}
      {canAct && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-brand-800 mb-1">
              Ghi chú xét duyệt{" "}
              <span className="text-muted-foreground">(bắt buộc khi từ chối)</span>
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={4}
              placeholder="Nhập ghi chú cho hội viên..."
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 rounded-lg bg-red-50 p-2">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading || isLocked}
              className="flex-1 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              Từ chối
            </button>
            <button
              onClick={handleApprove}
              disabled={loading || isLocked}
              className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Duyệt &amp; Cấp Badge
            </button>
          </div>

          {loading && (
            <p className="text-xs text-center text-muted-foreground">
              Đang xử lý...
            </p>
          )}
        </div>
      )}
    </div>
  )
}
