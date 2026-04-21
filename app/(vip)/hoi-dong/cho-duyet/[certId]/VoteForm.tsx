"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  certId: string
}

type VoteChoice = "APPROVE" | "REJECT"

export function VoteForm({ certId }: Props) {
  const router = useRouter()
  const [vote, setVote] = useState<VoteChoice | null>(null)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!vote) {
      setError("Chọn APPROVE hoặc REJECT")
      return
    }
    if (!comment.trim()) {
      setError("Bắt buộc phải để lại nhận xét")
      return
    }
    const confirmMsg =
      vote === "REJECT"
        ? "Vote REJECT sẽ tự động từ chối toàn bộ đơn (veto). Xác nhận?"
        : "Xác nhận vote APPROVE?"
    if (!window.confirm(confirmMsg)) return

    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/certifications/${certId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote, comment }),
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
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-900">Vote của bạn</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Bắt buộc để lại nhận xét. Đây là vote cuối cùng — không thể thay đổi sau khi gửi.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setVote("APPROVE")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors border-2 ${
            vote === "APPROVE"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-green-700 border-green-300 hover:bg-green-50"
          }`}
        >
          ✓ APPROVE
        </button>
        <button
          onClick={() => setVote("REJECT")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors border-2 ${
            vote === "REJECT"
              ? "bg-red-600 text-white border-red-600"
              : "bg-white text-red-700 border-red-300 hover:bg-red-50"
          }`}
        >
          ✗ REJECT
        </button>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        placeholder="Nhận xét của bạn (bắt buộc)..."
        className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
      />

      {error && <p className="text-xs text-red-600 rounded-lg bg-red-50 p-2">{error}</p>}

      <button
        onClick={submit}
        disabled={loading || !vote || !comment.trim()}
        className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
      >
        {loading ? "Đang gửi..." : "Gửi vote"}
      </button>
    </div>
  )
}
