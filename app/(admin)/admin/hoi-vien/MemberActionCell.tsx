"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function MemberActionCell({
  memberId,
  memberName,
  isActive,
  isRegistration,
}: {
  memberId: string
  memberName: string
  isActive: boolean
  isRegistration?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)

  async function toggleActive() {
    const action = isActive ? "Vô hiệu hoá" : "Kích hoạt lại"
    if (!window.confirm(`${action} tài khoản ${memberName}?`)) return
    setLoading(true)
    try {
      await fetch(`/api/admin/users/${memberId}/toggle-active`, { method: "POST" })
      router.refresh()
    } catch { alert("Có lỗi xảy ra") }
    finally { setLoading(false) }
  }

  async function handleApprove() {
    if (!window.confirm(`Chấp thuận đơn đăng ký của ${memberName}?`)) return
    setLoading(true)
    try {
      await fetch(`/api/admin/registrations/${memberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      router.refresh()
    } catch { alert("Có lỗi xảy ra") }
    finally { setLoading(false) }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return
    setLoading(true)
    try {
      await fetch(`/api/admin/registrations/${memberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      })
      router.refresh()
    } catch { alert("Có lỗi xảy ra") }
    finally { setLoading(false) }
  }

  // Registration pending — show approve/reject
  if (isRegistration) {
    if (showReject) {
      return (
        <div className="space-y-2">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Lý do từ chối..."
            rows={2}
            className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-red-100"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowReject(false)} className="rounded-md border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">Huỷ</button>
            <button onClick={handleReject} disabled={loading || !rejectReason.trim()} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">Xác nhận từ chối</button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setShowReject(true)} disabled={loading} className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
          Từ chối
        </button>
        <button onClick={handleApprove} disabled={loading} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
          {loading ? "..." : "Duyệt"}
        </button>
      </div>
    )
  }

  // Normal VIP — show detail + toggle
  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/hoi-vien/${memberId}`} className="rounded-md border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors">
        Chi tiết
      </Link>
      <button
        onClick={toggleActive}
        disabled={loading}
        className={isActive
          ? "rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          : "rounded-md border border-green-300 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
        }
      >
        {loading ? "..." : isActive ? "Vô hiệu hoá" : "Kích hoạt"}
      </button>
    </div>
  )
}
