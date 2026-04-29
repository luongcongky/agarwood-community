"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { BannerSlot } from "@prisma/client"
import { BANNER_SLOT_META, getSlotShape } from "@/lib/banner-slots"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

interface Props {
  bannerId: string
  currentPositions: BannerSlot[]
}

/**
 * Inline editor cho `banner.positions` — admin sửa vị trí của banner đã tồn
 * tại để áp dụng sang slot khác (cùng shape) hoặc bỏ slot cũ.
 *
 * Default collapsed → 1 button "Vị trí (N)". Click expand → list checkbox
 * tất cả slot cùng shape, pre-check positions hiện tại. Lưu → PATCH endpoint
 * → refresh list.
 */
export function BannerSlotsEditor({ bannerId, currentPositions }: Props) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<Set<BannerSlot>>(new Set(currentPositions))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Shape của banner — derive từ slot đầu tiên. Tất cả compatible slots phải
  // cùng shape (đảm bảo aspect khớp với ảnh đã upload).
  const primarySlot = currentPositions[0]
  if (!primarySlot) return null
  const shape = getSlotShape(primarySlot)
  const compatibleSlots = (Object.keys(BANNER_SLOT_META) as BannerSlot[]).filter(
    (s) => getSlotShape(s) === shape,
  )

  function toggle(s: BannerSlot) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  async function save() {
    if (selected.size === 0) {
      setError("Banner phải nằm ở ít nhất 1 vị trí.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/banner/${bannerId}/positions`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slots: Array.from(selected) }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? "Cập nhật vị trí thất bại.")
      }
      setExpanded(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi.")
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setSelected(new Set(currentPositions))
    setError(null)
    setExpanded(false)
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        disabled={readOnly}
        title={readOnly ? READ_ONLY_TOOLTIP : "Áp dụng banner này cho slot khác cùng shape"}
        className="text-xs text-brand-600 hover:text-brand-800 underline underline-offset-2 disabled:opacity-50 disabled:no-underline"
      >
        🔗 Sửa vị trí ({currentPositions.length})
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-brand-300 bg-brand-50/30 p-3 space-y-3">
      <div>
        <p className="text-sm font-semibold text-brand-900">Vị trí hiển thị banner</p>
        <p className="text-[11px] text-brand-500 mt-0.5">
          Tích chọn các slot cùng aspect ratio để banner hiện thị ở đó. Bỏ tích
          để gỡ banner khỏi slot.
        </p>
      </div>

      <div className="max-h-60 overflow-y-auto rounded border border-neutral-200 bg-white">
        {compatibleSlots.map((s) => {
          const checked = selected.has(s)
          const wasOriginal = currentPositions.includes(s)
          return (
            <label
              key={s}
              className="flex items-start gap-2 border-b border-neutral-100 px-3 py-2 last:border-b-0 cursor-pointer hover:bg-brand-50/40"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(s)}
                className="mt-0.5 accent-brand-700"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <p className="text-sm font-medium text-brand-900">
                    {BANNER_SLOT_META[s].label}
                  </p>
                  {wasOriginal && (
                    <span className="text-[10px] text-brand-500 italic">
                      (hiện đang dùng)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 truncate">
                  {BANNER_SLOT_META[s].description}
                </p>
              </div>
            </label>
          )
        })}
      </div>

      {error && (
        <p className="text-xs text-red-600 rounded bg-red-50 p-2">{error}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-neutral-600">
          Đã chọn {selected.size} slot
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || selected.size === 0}
            className="rounded bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {saving ? "Đang lưu…" : "Lưu vị trí"}
          </button>
        </div>
      </div>
    </div>
  )
}
