"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Committee } from "@prisma/client"
import { cn } from "@/lib/utils"

/**
 * Admin card phân bổ hội viên vào các ban Hội.
 *
 * UX:
 *  - Checkbox cho từng ban — tick/untick → đưa vào danh sách pending change
 *  - Input "Vai trò" tự do text (Trưởng ban / Phó / Thành viên…)
 *  - Nhấn "Lưu" → PUT /api/admin/hoi-vien/[id]/committees với toàn bộ state mới
 *  - Server diff + batch insert/update/delete trong 1 transaction
 *
 * Hiện tại `server` chỉ lưu theo cấu trúc full-replace (thay thế toàn bộ
 * committees của user bằng state mới). Đơn giản hơn là delta tracking.
 */

type Membership = {
  committee: Committee
  position: string | null
}

type CommitteeOption = {
  key: Committee
  label: string
  description: string
}

type Props = {
  userId: string
  userName: string
  currentMemberships: Membership[]
  committeeOptions: CommitteeOption[]
}

type DraftRow = { committee: Committee; checked: boolean; position: string }

export function CommitteeAssignment({
  userId,
  userName,
  currentMemberships,
  committeeOptions,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  // Mặc định collapse — admin chỉ bung khi cần sửa. Hội viên không thuộc
  // ban nào phổ biến nên card thường không cần chiếm chỗ trên viewport.
  const [expanded, setExpanded] = useState(false)

  // Khởi tạo state từ currentMemberships — committee nào đang có = checked.
  const initialRows: DraftRow[] = committeeOptions.map((opt) => {
    const existing = currentMemberships.find((m) => m.committee === opt.key)
    return {
      committee: opt.key,
      checked: !!existing,
      position: existing?.position ?? "",
    }
  })
  const [rows, setRows] = useState<DraftRow[]>(initialRows)

  function toggleChecked(committee: Committee) {
    setRows((prev) =>
      prev.map((r) =>
        r.committee === committee ? { ...r, checked: !r.checked } : r,
      ),
    )
    setSaved(false)
  }

  function updatePosition(committee: Committee, position: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.committee === committee ? { ...r, position } : r,
      ),
    )
    setSaved(false)
  }

  async function handleSave() {
    setError(null)
    setSaved(false)
    const payload = {
      memberships: rows
        .filter((r) => r.checked)
        .map((r) => ({
          committee: r.committee,
          position: r.position.trim() || null,
        })),
    }
    try {
      const res = await fetch(`/api/admin/hoi-vien/${userId}/committees`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
      }
      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại")
        return
      }
      setSaved(true)
      startTransition(() => router.refresh())
    } catch {
      setError("Lỗi mạng. Vui lòng thử lại.")
    }
  }

  const hasChanges =
    rows.some((r, i) => {
      const initial = initialRows[i]
      return (
        r.checked !== initial.checked ||
        r.position.trim() !== initial.position.trim()
      )
    })

  // Summary các ban user đang thuộc — hiển thị khi collapsed để admin
  // thấy ngay trạng thái mà không cần mở card.
  const activeRows = rows.filter((r) => r.checked)
  const summary =
    activeRows.length === 0
      ? "Chưa thuộc ban nào"
      : activeRows
          .map((r) => {
            const label = committeeOptions.find((o) => o.key === r.committee)?.label ?? r.committee
            return r.position ? `${label} (${r.position})` : label
          })
          .join(" · ")

  return (
    <div className="rounded-xl border border-brand-200 bg-white shadow-sm overflow-hidden">
      {/* Header click toàn bộ để toggle. `button` cho a11y + keyboard. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-start justify-between gap-4 px-6 py-4 text-left hover:bg-brand-50/40 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-brand-900">
            Phân bổ vào các ban Hội
          </h2>
          <p className="mt-1 text-xs text-brand-500 truncate">
            <span
              className={cn(
                activeRows.length === 0 ? "italic text-brand-400" : "text-brand-700 font-medium",
              )}
            >
              {summary}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasChanges && !expanded && (
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              Chưa lưu
            </span>
          )}
          <span className="text-[11px] text-brand-500">
            {expanded ? "Thu gọn" : "Mở rộng"}
          </span>
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={cn(
              "h-4 w-4 text-brand-500 transition-transform",
              expanded && "rotate-180",
            )}
          >
            <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-brand-100 px-6 pb-5 pt-4 space-y-4">
          <p className="text-xs text-brand-500">
            Hội viên thuộc ban nào sẽ có thêm quyền quản trị tương ứng. Xem{" "}
            <code className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700">
              lib/permissions.ts
            </code>{" "}
            để biết mapping ban → quyền.
          </p>

          <div className="space-y-3">
            {rows.map((row) => {
              const opt = committeeOptions.find((o) => o.key === row.committee)!
              return (
                <div
                  key={row.committee}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:gap-4",
                    row.checked
                      ? "border-brand-300 bg-brand-50/40"
                      : "border-brand-100 bg-white",
                  )}
                >
                  <label className="flex flex-1 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
                      checked={row.checked}
                      onChange={() => toggleChecked(row.committee)}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-900">{opt.label}</p>
                      <p className="text-xs text-brand-500 leading-snug mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={row.position}
                    onChange={(e) => updatePosition(row.committee, e.target.value)}
                    disabled={!row.checked}
                    placeholder="Vai trò (Trưởng ban, Phó, Thành viên…)"
                    className="w-full rounded-md border border-brand-200 bg-white px-3 py-1.5 text-sm disabled:bg-brand-50/40 disabled:text-brand-300 sm:w-64"
                  />
                </div>
              )
            })}
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {saved && !error && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Đã lưu phân bổ ban cho {userName}.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-100">
            <button
              type="button"
              disabled={!hasChanges || isPending}
              onClick={handleSave}
              className="rounded-md bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40"
            >
              {isPending ? "Đang lưu…" : "Lưu phân bổ"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
