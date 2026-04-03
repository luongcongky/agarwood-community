"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function DeleteNewsButton({ newsId }: { newsId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!window.confirm("Xoá tin tức này?")) return
    setLoading(true)
    try {
      await fetch(`/api/admin/news/${newsId}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "..." : "Xoá"}
    </button>
  )
}
