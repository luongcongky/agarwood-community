"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

export function DocumentActions({ documentId, isPublic }: { documentId: string; isPublic: boolean }) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [loading, setLoading] = useState(false)

  async function togglePublic() {
    setLoading(true)
    await fetch(`/api/admin/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !isPublic }),
    })
    router.refresh()
    setLoading(false)
  }

  async function handleDelete() {
    if (!window.confirm("Xóa tài liệu này? File trên Google Drive cũng sẽ bị xóa.")) return
    setLoading(true)
    const res = await fetch(`/api/admin/documents/${documentId}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/admin/tai-lieu")
      router.refresh()
    } else {
      alert("Xóa thất bại")
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={togglePublic}
        disabled={loading || readOnly}
        title={readOnly ? READ_ONLY_TOOLTIP : undefined}
        className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors disabled:opacity-50"
      >
        {isPublic ? "Chuyển nội bộ" : "Công khai cho VIP"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading || readOnly}
        title={readOnly ? READ_ONLY_TOOLTIP : undefined}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        Xóa
      </button>
    </div>
  )
}
