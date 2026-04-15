"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type Props = {
  userId: string
  currentRole: "GUEST" | "VIP" | "INFINITE" | "ADMIN"
}

export function InfiniteToggle({ userId, currentRole }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (currentRole === "ADMIN") return null

  const isInfinite = currentRole === "INFINITE"
  const targetRole = isInfinite ? "VIP" : "INFINITE"
  const label = isInfinite ? "Hủy hạng Infinite" : "Cấp hạng Infinite"
  const confirmMsg = isInfinite
    ? "Hạ hội viên này về hạng VIP thường? Họ sẽ mất quyền admin."
    : "Cấp hạng Infinite cho hội viên này? Họ sẽ có full quyền hạng Vàng + quyền admin."

  function onClick() {
    if (!confirm(confirmMsg)) return
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? "Có lỗi xảy ra")
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={
          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
          (isInfinite
            ? "bg-gray-800 text-amber-200 hover:bg-gray-700"
            : "border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-amber-200") +
          (pending ? " opacity-60 cursor-not-allowed" : "")
        }
      >
        {pending ? "Đang xử lý..." : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
