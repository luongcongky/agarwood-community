"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

interface Props {
  userId: string
  isMember: boolean
  hasPending: boolean
}

export function CouncilToggle({ userId, isMember, hasPending }: Props) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function toggle() {
    if (isMember && hasPending) {
      alert(
        "Thẩm định viên này đang có đơn chờ vote. Hoàn thành trước, hoặc thay đổi thành viên hội đồng trong đơn đó.",
      )
      return
    }
    if (!window.confirm(isMember ? "Gỡ khỏi hội đồng?" : "Thêm vào hội đồng thẩm định?")) return

    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/council-members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: !isMember }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Lỗi")
        return
      }
      router.refresh()
    } catch {
      setError("Lỗi kết nối")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={loading || readOnly}
        title={readOnly ? READ_ONLY_TOOLTIP : undefined}
        className={
          isMember
            ? "rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            : "rounded-md bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
        }
      >
        {loading ? "..." : isMember ? "Gỡ" : "Thêm vào HĐ"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
