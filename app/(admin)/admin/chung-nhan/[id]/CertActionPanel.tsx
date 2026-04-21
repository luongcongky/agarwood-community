"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CertStatus } from "@prisma/client"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

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

/**
 * Panel dành riêng cho REJECTED / REFUNDED — xác nhận hoàn tiền cho hội viên.
 * Approve/Reject không còn ở đây: toàn bộ quyết định đi qua voting của hội đồng
 * thẩm định (lib/certification-council.ts). Xem AssignCouncilForm + ReviewProgress.
 */
export function CertActionPanel({
  certId,
  status,
  rejectedAt,
  refundBankName,
  refundAccountName,
  refundAccountNo,
  refundedAt,
}: CertActionPanelProps) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleRefund() {
    if (!window.confirm("Xác nhận đã hoàn tiền cho hội viên?")) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/certifications/${certId}/refund`, { method: "POST" })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Có lỗi xảy ra")
        return
      }
      router.refresh()
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-base font-bold text-brand-900">Hoàn tiền</h2>

      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 space-y-2">
        <p className="font-semibold">Đơn đã bị từ chối</p>
        {rejectedAt && (
          <p className="text-xs">{new Date(rejectedAt).toLocaleString("vi-VN")}</p>
        )}

        {status === "REJECTED" && !refundedAt && (
          <div className="pt-2 border-t border-red-200 space-y-1">
            <p className="font-semibold text-xs">Thông tin hoàn tiền</p>
            <p className="text-xs">Ngân hàng: {refundBankName ?? "—"}</p>
            <p className="text-xs">Chủ tài khoản: {refundAccountName ?? "—"}</p>
            <p className="text-xs">Số tài khoản: {refundAccountNo ?? "—"}</p>
            <button
              onClick={handleRefund}
              disabled={loading || readOnly}
              title={readOnly ? READ_ONLY_TOOLTIP : undefined}
              className="mt-2 w-full rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Đang xử lý..." : "Xác nhận đã hoàn tiền"}
            </button>
          </div>
        )}

        {refundedAt && (
          <p className="text-xs text-purple-700 font-medium">
            ✓ Đã hoàn tiền — {new Date(refundedAt).toLocaleDateString("vi-VN")}
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-600 rounded-lg bg-red-50 p-2">{error}</p>}
    </div>
  )
}
