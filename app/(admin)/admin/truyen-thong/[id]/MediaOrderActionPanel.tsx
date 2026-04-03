"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { MediaOrderStatus } from "@prisma/client"

const STATUS_LABELS: Record<MediaOrderStatus, string> = {
  NEW: "Mới",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã bàn giao",
  REVISION: "Chỉnh sửa",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
}

const STATUS_FLOW: MediaOrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "IN_PROGRESS",
  "DELIVERED",
  "COMPLETED",
]

interface MediaOrderActionPanelProps {
  orderId: string
  initialStatus: MediaOrderStatus
  initialAssignedTo: string | null
  initialQuotedPrice: number | null
  initialInternalNote: string | null
  initialDeliveryFileUrls: string[]
}

export function MediaOrderActionPanel({
  orderId,
  initialStatus,
  initialAssignedTo,
  initialQuotedPrice,
  initialInternalNote,
  initialDeliveryFileUrls,
}: MediaOrderActionPanelProps) {
  const router = useRouter()
  const [status, setStatus] = useState<MediaOrderStatus>(initialStatus)
  const [assignedTo, setAssignedTo] = useState(initialAssignedTo ?? "")
  const [quotedPrice, setQuotedPrice] = useState(
    initialQuotedPrice ? String(initialQuotedPrice) : ""
  )
  const [internalNote, setInternalNote] = useState(initialInternalNote ?? "")
  const [deliveryUrls, setDeliveryUrls] = useState<string[]>(
    initialDeliveryFileUrls.length > 0 ? initialDeliveryFileUrls : [""]
  )
  const [cancelReason, setCancelReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setLoading(true)
    setError("")
    setSaved(false)

    const filteredUrls = deliveryUrls.filter((u) => u.trim() !== "")

    try {
      const res = await fetch(`/api/admin/media-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          assignedTo: assignedTo || null,
          quotedPrice: quotedPrice ? Number(quotedPrice) : null,
          internalNote: internalNote || null,
          deliveryFileUrls: filteredUrls,
          cancelReason: status === "CANCELLED" ? cancelReason : undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Có lỗi xảy ra")
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  function addDeliveryUrl() {
    setDeliveryUrls((prev) => [...prev, ""])
  }

  function updateDeliveryUrl(index: number, value: string) {
    setDeliveryUrls((prev) => prev.map((u, i) => (i === index ? value : u)))
  }

  function removeDeliveryUrl(index: number) {
    setDeliveryUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const currentStatusClass: Record<MediaOrderStatus, string> = {
    NEW: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-brand-100 text-brand-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    DELIVERED: "bg-purple-100 text-purple-700",
    REVISION: "bg-orange-100 text-orange-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-600",
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5 sticky top-6">
      <h2 className="text-base font-bold text-brand-900">Quản lý đơn hàng</h2>

      {/* Current status */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Trạng thái hiện tại</p>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${currentStatusClass[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Status update */}
      <div>
        <label className="block text-xs font-medium text-brand-800 mb-1">
          Cập nhật trạng thái
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MediaOrderStatus)}
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
          <option value="REVISION">{STATUS_LABELS.REVISION}</option>
          <option value="CANCELLED">{STATUS_LABELS.CANCELLED}</option>
        </select>
      </div>

      {/* Cancel reason */}
      {status === "CANCELLED" && (
        <div>
          <label className="block text-xs font-medium text-brand-800 mb-1">
            Lý do huỷ
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
          />
        </div>
      )}

      {/* Assigned to */}
      <div>
        <label className="block text-xs font-medium text-brand-800 mb-1">
          Phân công cho
        </label>
        <input
          type="text"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder="Tên/email nhân sự..."
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
      </div>

      {/* Quoted price */}
      <div>
        <label className="block text-xs font-medium text-brand-800 mb-1">
          Giá báo (VND)
        </label>
        <input
          type="number"
          value={quotedPrice}
          onChange={(e) => setQuotedPrice(e.target.value)}
          placeholder="0"
          min={0}
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
      </div>

      {/* Internal note */}
      <div>
        <label className="block text-xs font-medium text-brand-800 mb-1">
          Ghi chú nội bộ
        </label>
        <textarea
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
        />
      </div>

      {/* Delivery file URLs */}
      <div>
        <label className="block text-xs font-medium text-brand-800 mb-1">
          File bàn giao (URL)
        </label>
        <div className="space-y-2">
          {deliveryUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateDeliveryUrl(i, e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              {deliveryUrls.length > 1 && (
                <button
                  onClick={() => removeDeliveryUrl(i)}
                  className="rounded-lg border border-red-200 px-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                >
                  Xoá
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addDeliveryUrl}
            className="text-xs text-brand-600 hover:text-brand-800 underline"
          >
            + Thêm file
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</p>
      )}

      {saved && (
        <p className="rounded-lg bg-green-50 p-2 text-xs text-green-700">
          Đã lưu thay đổi
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
      >
        {loading ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </div>
  )
}
