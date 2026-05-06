"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

/**
 * Admin-only quick-toggle "Sản phẩm tiêu biểu" trên trang
 * `/san-pham-chung-nhan`. Mirror pattern của FeatureToggleBtn (company).
 * Gọi PATCH /api/admin/products/[id]/featured (đã validate owner phải là
 * VIP). Optimistic update + router.refresh() sau khi API ok để re-fetch
 * fresh data.
 */
export function ProductFeatureToggleBtn({
  productId,
  initialFeatured,
}: {
  productId: string
  initialFeatured: boolean
}) {
  const t = useTranslations("certProducts")
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
    const ok = window.confirm(
      next ? t("toggleConfirmOn") : t("toggleConfirmOff"),
    )
    if (!ok) return
    setSaving(true)
    setError(null)
    setFeatured(next) // optimistic
    try {
      const res = await fetch(`/api/admin/products/${productId}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFeatured(!next) // rollback
        setError(data.error ?? t("toggleSaveFailed"))
        return
      }
      setSavedFlash(true)
      setTimeout(() => {
        setSavedFlash(false)
        startTransition(() => router.refresh())
      }, 900)
    } catch {
      setFeatured(!next) // rollback
      setError(t("toggleNetworkError"))
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
            ? t("toggleTitleOff")
            : t("toggleTitleOn")
      }
      aria-label={featured ? t("toggleAriaOff") : t("toggleAriaOn")}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border text-base leading-none shadow-sm transition-colors",
        savedFlash
          ? "border-emerald-500 bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300"
          : featured
            ? "border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "border-stone-300 bg-white/95 text-stone-500 hover:bg-white hover:text-amber-700",
        saving && !savedFlash && "cursor-wait opacity-60",
        error && "border-red-400 bg-red-50 text-red-700",
      )}
    >
      <span aria-hidden="true">{savedFlash ? "✓" : featured ? "★" : "☆"}</span>
    </button>
  )
}
