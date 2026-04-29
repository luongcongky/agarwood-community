"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type VoteChoice = "APPROVE" | "REJECT"

interface Props {
  certId: string
  /** Vote đã ghi trước đó — null nếu chưa vote bao giờ. */
  initialVote?: VoteChoice | null
  /** Nhận xét đã ghi trước đó. */
  initialComment?: string
}

export function VoteForm({ certId, initialVote = null, initialComment = "" }: Props) {
  const router = useRouter()
  const [vote, setVote] = useState<VoteChoice | null>(initialVote)
  const [comment, setComment] = useState(initialComment)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isUpdate = initialVote !== null

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
        ? "Vote REJECT sẽ phủ quyết đơn khi đủ 5 phiếu. Bạn vẫn có thể đổi lại trước khi đủ 5/5. Xác nhận?"
        : isUpdate
          ? "Cập nhật vote APPROVE?"
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
        <h2 className="text-base font-bold text-brand-900">
          {isUpdate ? "Cập nhật vote" : "Vote của bạn"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Bắt buộc để lại nhận xét. Có thể đổi vote (kể cả REJECT) trước khi đủ
          5/5 phiếu. Khi đủ 5: chỉ cần 1 REJECT là đơn bị phủ quyết, 5 APPROVE
          mới được duyệt.
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
        {loading ? "Đang gửi..." : isUpdate ? "Cập nhật vote" : "Gửi vote"}
      </button>
    </div>
  )
}
