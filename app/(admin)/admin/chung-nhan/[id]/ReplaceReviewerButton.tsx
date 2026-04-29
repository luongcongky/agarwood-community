"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

interface Candidate {
  id: string
  name: string
  email: string
}

interface Props {
  certId: string
  oldReviewerId: string
  oldReviewerName: string
  candidates: Candidate[]
}

export function ReplaceReviewerButton({ certId, oldReviewerId, oldReviewerName, candidates }: Props) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!selected) return
    if (!window.confirm(`Đổi ${oldReviewerName} thành thành viên mới?`)) return

    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/certifications/${certId}/replace-reviewer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldReviewerId, newReviewerId: selected }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Lỗi")
        return
      }
      setOpen(false)
      setSelected(null)
      router.refresh()
    } catch {
      setError("Lỗi kết nối")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={readOnly}
        title={readOnly ? READ_ONLY_TOOLTIP : "Đổi sang thành viên khác"}
        className="text-xs text-brand-600 hover:text-brand-800 underline disabled:opacity-50 disabled:no-underline"
      >
        🔄 Đổi thành viên
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-md border border-brand-200 bg-white p-2">
      <p className="text-xs font-semibold text-brand-900">Chọn người thay thế</p>
      {candidates.length === 0 ? (
        <p className="text-xs text-amber-700 rounded bg-amber-50 p-2">
          Không còn thành viên hội đồng khả dụng. Vào{" "}
          <a href="/admin/hoi-dong-tham-dinh" className="underline font-semibold">
            Hội đồng thẩm định
          </a>{" "}
          để thêm.
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto rounded border">
          {candidates.map((c) => (
            <label
              key={c.id}
              className="flex items-start gap-2 border-b px-2 py-1.5 last:border-b-0 cursor-pointer hover:bg-brand-50/50"
            >
              <input
                type="radio"
                name={`replace-${oldReviewerId}`}
                checked={selected === c.id}
                onChange={() => setSelected(c.id)}
                className="mt-1 accent-brand-600"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-brand-900 truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600 rounded bg-red-50 p-2">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading || !selected || candidates.length === 0}
          className="flex-1 rounded bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang đổi..." : "Xác nhận"}
        </button>
        <button
          onClick={() => {
            setOpen(false)
            setSelected(null)
            setError("")
          }}
          className="rounded border border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
        >
          Huỷ
        </button>
      </div>
    </div>
  )
}
