"use client"

import { useState } from "react"

interface ReportActionsProps {
  reportId: string
  postId: string
  postStatus: string
}

export function ReportActions({
  reportId,
  postId,
  postStatus,
}: ReportActionsProps) {
  const [loading, setLoading] = useState(false)
  const [handled, setHandled] = useState(false)
  const [currentPostStatus, setCurrentPostStatus] = useState(postStatus)
  const [error, setError] = useState("")

  async function callAction(action: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, postId }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Có lỗi xảy ra")
        return
      }
      if (action === "dismiss") {
        setHandled(true)
      } else if (action === "lock") {
        setCurrentPostStatus("LOCKED")
        setHandled(true)
      } else if (action === "unlock") {
        setCurrentPostStatus("PUBLISHED")
        setHandled(true)
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  if (handled) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
          Đã xử lý
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}

      <button
        onClick={() => callAction("dismiss")}
        disabled={loading}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        Bỏ qua
      </button>

      {currentPostStatus !== "LOCKED" && (
        <button
          onClick={() => callAction("lock")}
          disabled={loading}
          className="rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50 transition-colors"
        >
          Khoá bài
        </button>
      )}

      {currentPostStatus === "LOCKED" && (
        <button
          onClick={() => callAction("unlock")}
          disabled={loading}
          className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          Mở khoá
        </button>
      )}
    </div>
  )
}
