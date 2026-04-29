"use client"

import { useState, type ReactNode } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { BannerSlot } from "@prisma/client"
import { Plus, X } from "lucide-react"
import { BannerSlotPicker } from "@/components/features/admin/BannerSlotPicker"
import { BANNER_SLOT_META } from "@/lib/banner-slots"
import { AdminBannerEditor } from "./AdminBannerEditor"

interface Props {
  /** Slot đang được chọn từ URL `?slot=`, null = chưa chọn. */
  currentSlot: BannerSlot | null
  /** Banner cards đã render ở server (đã filter theo status + slot). */
  bannerCards: ReactNode
  /** Số banner sau filter — dùng để render empty state. */
  bannerCount: number
  /** Status badge đang chọn (để hiển thị label trong heading). */
  currentStatusLabel: string
}

/**
 * 2-cột workbench: bên trái mockup chọn vị trí, bên phải list banner trong
 * vùng đó + form tạo banner mới cho vùng đó. URL state:
 *  - `?slot=...` ↔ ô được highlight trong mockup
 *  - `?status=...` ↔ status badge đang chọn (do parent server page xử lý)
 */
export function BannerWorkbench({
  currentSlot,
  bannerCards,
  bannerCount,
  currentStatusLabel,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Form section default collapsed → nhường chỗ cho list. Admin click toggle
  // để mở khi cần tạo. Sau khi xong (onComplete từ editor) auto-collapse lại.
  const [isCreateExpanded, setIsCreateExpanded] = useState(false)

  function setSelectedSlot(next: BannerSlot) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("slot", next)
    router.replace(`${pathname}?${params.toString()}`)
  }

  function handleCreateSuccess() {
    // Banner mới được tạo thành công → refresh server data → list cập nhật.
    router.refresh()
  }

  function handleCreateComplete() {
    // Admin click "Xong" trong extension UI → collapse form, nhường chỗ list.
    setIsCreateExpanded(false)
  }

  const slotLabel = currentSlot ? BANNER_SLOT_META[currentSlot].label : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left: page selector + layout mockup (sticky desktop). 50/50 với
            cột phải để mockup có không gian render thoáng. ──────────── */}
      <div>
        <div className="lg:sticky lg:top-6">
          <p className="mb-2 text-sm font-semibold text-brand-900">
            Vị trí hiển thị
          </p>
          <BannerSlotPicker value={currentSlot} onChange={setSelectedSlot} />
        </div>
      </div>

      {/* ── Right: create form (top) + filtered banner list (bottom) ─── */}
      <div className="space-y-8 min-w-0">
        {/* Section 1: Form tạo banner — collapsible. Default collapsed,
            click toggle để extend; sau khi save xong auto-collapse. */}
        <section className="rounded-xl border border-brand-200 bg-white">
          <button
            type="button"
            onClick={() => setIsCreateExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-brand-50/40 transition-colors"
            aria-expanded={isCreateExpanded}
          >
            <div className="min-w-0">
              <h2 className="text-base font-bold text-brand-900">
                Tạo banner mới
              </h2>
              {!isCreateExpanded && (
                <p className="mt-0.5 text-xs text-brand-500">
                  Click để mở form tạo banner mới.
                </p>
              )}
            </div>
            <span
              className={`shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                isCreateExpanded
                  ? "bg-brand-100 text-brand-700 hover:bg-brand-200"
                  : "bg-brand-700 text-white hover:bg-brand-800"
              }`}
              aria-hidden
            >
              {isCreateExpanded ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </span>
          </button>

          {isCreateExpanded && (
            <div className="border-t border-brand-200 px-4 pb-5 pt-4">
              {currentSlot ? (
                <AdminBannerEditor
                  controlledSlot={currentSlot}
                  onSuccess={handleCreateSuccess}
                  onComplete={handleCreateComplete}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-brand-300 bg-white p-6 text-center text-sm text-brand-500">
                  Click vào 1 vùng trên mockup bên trái để bắt đầu tạo banner.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Section 2: List banner đang tồn tại ở vùng đã chọn */}
        <section>
          <header className="mb-3 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-brand-900">
                {slotLabel
                  ? `Banner đang tồn tại ở vùng "${slotLabel}"`
                  : "Tất cả banner"}
              </h2>
              <p className="mt-0.5 text-xs text-brand-500">
                Đang lọc theo trạng thái: <strong>{currentStatusLabel}</strong>
              </p>
            </div>
            {bannerCount > 0 && (
              <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                {bannerCount} banner
              </span>
            )}
          </header>

          {!currentSlot && (
            <div className="rounded-lg border border-dashed border-brand-300 bg-amber-50/40 p-4 text-sm text-amber-900">
              💡 Click vào 1 vùng trên mockup bên trái để xem banner đang chạy
              ở vùng đó. Hoặc xem toàn bộ danh sách bên dưới.
            </div>
          )}

          {bannerCount === 0 && currentSlot ? (
            <div className="rounded-xl border border-brand-200 bg-white p-8 text-center text-brand-500 italic">
              Không có banner nào ở vùng này với trạng thái {currentStatusLabel}.
            </div>
          ) : (
            <div className={!currentSlot ? "mt-3" : ""}>{bannerCards}</div>
          )}
        </section>
      </div>
    </div>
  )
}
