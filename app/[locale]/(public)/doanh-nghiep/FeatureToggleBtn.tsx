"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

/**
 * Admin-only quick-toggle "DN tiêu biểu" ngay trên `/doanh-nghiep` list.
 * Phase 3.7 round 4 (2026-04). Gọi PATCH /api/admin/companies/[id]/featured
 * (đã validate VIP|INFINITE owner). Optimistic update + router.refresh()
 * sau khi API trả về để revalidate cache.
 */
export function FeatureToggleBtn({
  companyId,
  initialFeatured,
}: {
  companyId: string
  initialFeatured: boolean
}) {
  const [featured, setFeatured] = useState(initialFeatured)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (saving) return
    const next = !featured
    // Confirm trước khi thực hiện — tránh lỡ tay bấm nhầm. Phase 3.7 round 4
    // (2026-04). Native window.confirm đủ dùng cho thao tác đơn lẻ này.
    const ok = window.confirm(
      next
        ? "Chọn doanh nghiệp này làm DN tiêu biểu?"
        : "Bỏ DN tiêu biểu? DN sẽ không còn highlight ở danh sách + landing page.",
    )
    if (!ok) return
    setSaving(true)
    setError(null)
    setFeatured(next) // optimistic
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFeatured(!next) // rollback
        setError(data.error ?? "Lưu thất bại")
        return
      }
      // Saved feedback (✓ xanh ~900ms) rồi router.refresh(). Page giờ
      // dynamic (force-dynamic) nên refresh = re-fetch fresh DB data.
      setSavedFlash(true)
      setTimeout(() => {
        setSavedFlash(false)
        startTransition(() => router.refresh())
      }, 900)
    } catch {
      setFeatured(!next) // rollback
      setError("Lỗi mạng")
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      title={
        error
          ? error
          : featured
            ? "Click để bỏ tiêu biểu"
            : "Click để chọn DN tiêu biểu"
      }
      aria-label={featured ? "Bỏ tiêu biểu" : "Chọn DN tiêu biểu"}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border text-base leading-none transition-colors",
        savedFlash
          ? "border-emerald-500 bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300"
          : featured
            ? "border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "border-brand-300 bg-white text-brand-500 hover:bg-brand-50 hover:text-brand-700",
        saving && !savedFlash && "opacity-60 cursor-wait",
        error && "border-red-400 bg-red-50 text-red-700",
      )}
    >
      <span aria-hidden="true">{savedFlash ? "✓" : featured ? "★" : "☆"}</span>
    </button>
  )
}
