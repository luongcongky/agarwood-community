"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function MemberActionCell({
  memberId,
  memberName,
  isActive,
}: {
  memberId: string
  memberName: string
  isActive: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleActive() {
    const action = isActive ? "Vô hiệu hoá" : "Kích hoạt lại"
    if (!window.confirm(`${action} tài khoản ${memberName}?`)) return

    setLoading(true)
    try {
      await fetch(`/api/admin/users/${memberId}/toggle-active`, { method: "POST" })
      router.refresh()
    } catch {
      alert("Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/hoi-vien/${memberId}`}
        className="rounded-md border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
      >
        Chi tiết
      </Link>
      <button
        onClick={toggleActive}
        disabled={loading}
        className={
          isActive
            ? "rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            : "rounded-md border border-green-300 px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
        }
      >
        {loading ? "..." : isActive ? "Vô hiệu hoá" : "Kích hoạt"}
      </button>
    </div>
  )
}
