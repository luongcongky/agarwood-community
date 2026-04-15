"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

export function AdminBannerActions({ bannerId, status }: { bannerId: string; status: string }) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [working, setWorking] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    if (!confirm("Duyệt banner này? Banner sẽ chuyển sang ACTIVE và hiển thị trên trang chủ.")) return
    setWorking(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/banner/${bannerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Có lỗi xảy ra")
        return
      }
      router.refresh()
    } finally {
      setWorking(false)
    }
  }

  async function handleReject() {
    if (reason.trim().length < 10) {
      setError("Lý do từ chối tối thiểu 10 ký tự")
      return
    }
    setWorking(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/banner/${bannerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Có lỗi xảy ra")
        return
      }
      setShowRejectModal(false)
      setReason("")
      router.refresh()
    } finally {
      setWorking(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Xóa banner này vĩnh viễn? Không thể khôi phục.")) return
    setWorking(true)
    try {
      const res = await fetch(`/api/admin/banner/${bannerId}`, { method: "DELETE" })
      if (res.ok) router.refresh()
    } finally {
      setWorking(false)
    }
  }

  return (
    <>
      {status === "PENDING_APPROVAL" && (
        <>
          <button
            type="button"
            onClick={handleApprove}
            disabled={working || readOnly}
            title={readOnly ? READ_ONLY_TOOLTIP : undefined}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            ✓ Duyệt
          </button>
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            disabled={working || readOnly}
            title={readOnly ? READ_ONLY_TOOLTIP : undefined}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            ✗ Từ chối
          </button>
        </>
      )}

      {status === "PENDING_PAYMENT" && (
        <span className="text-xs text-amber-700 italic">Chờ user CK + admin xác nhận tại /admin/thanh-toan</span>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={working || readOnly}
        title={readOnly ? READ_ONLY_TOOLTIP : undefined}
        className="ml-auto rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Xóa
      </button>

      {error && (
        <div className="basis-full rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-brand-900">Từ chối banner</h3>
            <p className="text-sm text-brand-500">
              Lý do sẽ được gửi qua email cho user. Phí đã CK sẽ được hoàn lại.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Hình ảnh không rõ nét, không liên quan đến ngành trầm hương..."
              rows={4}
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            />
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-lg border border-brand-300 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={working || readOnly}
                title={readOnly ? READ_ONLY_TOOLTIP : undefined}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {working ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
