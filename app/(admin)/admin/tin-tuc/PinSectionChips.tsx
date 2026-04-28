"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useHasAdminPerm } from "@/components/features/admin/AdminReadOnlyContext"
import type { NewsCategory } from "@prisma/client"

type PinSection = "GENERAL" | "RESEARCH" | "BUSINESS" | "PRODUCT" | "AGRICULTURE"

const SECTIONS: { value: PinSection; short: string; full: string }[] = [
  { value: "GENERAL", short: "TH", full: "Tin Hội (Tin tức)" },
  { value: "RESEARCH", short: "NC", full: "Nghiên cứu khoa học" },
  { value: "BUSINESS", short: "DN", full: "Tin doanh nghiệp" },
  { value: "PRODUCT", short: "SP", full: "Tin sản phẩm" },
  { value: "AGRICULTURE", short: "KN", full: "Tin khuyến nông" },
]

/**
 * Inline editor cho `News.pinnedInCategories` — Phase 3.7 round 4 (2026-04).
 * 5 chip tương ứng 5 section trên trang chủ. Click chip = toggle pin cho
 * section đó. PATCH /api/admin/news/[id] gửi mảng mới + revalidate cache
 * homepage qua tag (server route đã handle), router.refresh() để reload list.
 *
 * Admin-only (admin:full): non-admin thấy chip read-only (chỉ hiển thị state).
 */
export function PinSectionChips({
  newsId,
  pinnedInCategories,
}: {
  newsId: string
  pinnedInCategories: NewsCategory[]
}) {
  const router = useRouter()
  const isAdmin = useHasAdminPerm("admin:full")
  const [pinned, setPinned] = useState<Set<PinSection>>(
    () =>
      new Set(
        pinnedInCategories.filter((c): c is PinSection =>
          SECTIONS.some((s) => s.value === c),
        ),
      ),
  )
  const [pending, setPending] = useState<PinSection | null>(null)

  async function toggle(section: PinSection) {
    if (!isAdmin || pending) return
    const next = new Set(pinned)
    const willPin = !next.has(section)
    if (willPin) next.add(section)
    else next.delete(section)
    // Optimistic flip — rollback nếu API lỗi.
    setPinned(new Set(next))
    setPending(section)
    try {
      const res = await fetch(`/api/admin/news/${newsId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinnedInCategories: [...next] }),
      })
      if (!res.ok) {
        // Rollback
        const rollback = new Set(next)
        if (willPin) rollback.delete(section)
        else rollback.add(section)
        setPinned(rollback)
      } else {
        router.refresh()
      }
    } catch {
      const rollback = new Set(next)
      if (willPin) rollback.delete(section)
      else rollback.add(section)
      setPinned(rollback)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {SECTIONS.map((s) => {
        const isPinned = pinned.has(s.value)
        const isLoading = pending === s.value
        const tooltip = !isAdmin
          ? "Chỉ admin được ghim"
          : isPinned
            ? `Click để bỏ ghim khỏi "${s.full}"`
            : `Click để ghim lên "${s.full}"`
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => toggle(s.value)}
            disabled={!isAdmin || pending !== null}
            title={tooltip}
            className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold border transition-all min-w-[24px] ${
              isPinned
                ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                : "bg-white text-gray-400 border-gray-200 border-dashed hover:border-gray-400 hover:text-gray-600"
            } ${!isAdmin || pending !== null ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isLoading ? "…" : s.short}
          </button>
        )
      })}
    </div>
  )
}
