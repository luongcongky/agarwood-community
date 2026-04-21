"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"
import { COUNCIL_SIZE } from "@/lib/certification-council"

interface Candidate {
  id: string
  name: string
  email: string
}

interface Props {
  certId: string
  candidates: Candidate[]
}

export function AssignCouncilForm({ certId, candidates }: Props) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else if (next.size < COUNCIL_SIZE) next.add(id)
    setSelected(next)
  }

  async function submit() {
    if (selected.size !== COUNCIL_SIZE) return
    if (!window.confirm(`Chỉ định ${COUNCIL_SIZE} thẩm định viên cho đơn này?`)) return

    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/certifications/${certId}/assign-council`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerIds: Array.from(selected) }),
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
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4 sticky top-6">
      <div>
        <h2 className="text-base font-bold text-brand-900">Chỉ định Hội đồng</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Chọn đúng {COUNCIL_SIZE} thẩm định viên. Đủ {COUNCIL_SIZE}/{COUNCIL_SIZE} APPROVE → duyệt. 1 REJECT → tự động từ chối.
        </p>
      </div>

      {candidates.length < COUNCIL_SIZE ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Chưa đủ {COUNCIL_SIZE} thành viên hội đồng khả dụng (có {candidates.length}).
          Vào <a href="/admin/hoi-dong-tham-dinh" className="underline font-semibold">Hội đồng thẩm định</a> để thêm.
        </div>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto rounded-lg border">
            {candidates.map((c) => {
              const isSelected = selected.has(c.id)
              const disabled = !isSelected && selected.size >= COUNCIL_SIZE
              return (
                <label
                  key={c.id}
                  className={`flex items-start gap-2 border-b px-3 py-2 last:border-b-0 ${
                    disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-brand-50/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={disabled}
                    onChange={() => toggle(c.id)}
                    className="mt-1 accent-brand-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-900 truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                </label>
              )
            })}
          </div>

          <p className="text-xs text-center font-medium text-brand-700">
            Đã chọn {selected.size}/{COUNCIL_SIZE}
          </p>

          {error && <p className="text-xs text-red-600 rounded-lg bg-red-50 p-2">{error}</p>}

          <button
            onClick={submit}
            disabled={loading || readOnly || selected.size !== COUNCIL_SIZE}
            title={readOnly ? READ_ONLY_TOOLTIP : undefined}
            className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang chỉ định..." : "Chỉ định & Chuyển sang xét duyệt"}
          </button>
        </>
      )}
    </div>
  )
}
