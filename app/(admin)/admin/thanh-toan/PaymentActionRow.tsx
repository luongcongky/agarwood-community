"use client"
import { useState } from "react"

export function PaymentActionRow({ id }: { id: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "confirmed" | "rejected">("idle")

  async function confirm() {
    if (!window.confirm("Xác nhận chuyển khoản này? Membership/chứng nhận sẽ được kích hoạt ngay.")) return
    setStatus("loading")
    const res = await fetch(`/api/admin/payments/${id}/confirm`, { method: "POST" })
    setStatus(res.ok ? "confirmed" : "idle")
    if (!res.ok) alert("Có lỗi xảy ra. Vui lòng thử lại.")
  }

  async function reject() {
    if (!window.confirm("Từ chối yêu cầu này? Thao tác không thể hoàn tác.")) return
    setStatus("loading")
    const res = await fetch(`/api/admin/payments/${id}/reject`, { method: "POST" })
    setStatus(res.ok ? "rejected" : "idle")
    if (!res.ok) alert("Có lỗi xảy ra. Vui lòng thử lại.")
  }

  if (status === "confirmed") return <span className="text-green-700 font-medium text-sm">✓ Đã xác nhận</span>
  if (status === "rejected") return <span className="text-red-600 font-medium text-sm">✗ Đã từ chối</span>

  return (
    <div className="flex gap-2">
      <button
        onClick={reject}
        disabled={status === "loading"}
        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        Từ chối
      </button>
      <button
        onClick={confirm}
        disabled={status === "loading"}
        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "Đang xử lý..." : "✓ Xác nhận CK"}
      </button>
    </div>
  )
}
