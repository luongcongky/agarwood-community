"use client"

import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Search + sort + view toggle cho danh sách SP chứng nhận.
 * Filter loại + vùng đã bỏ theo yêu cầu khách (2026-05) — chỉ còn search
 * (full-text qua name + company.name) + sort + view.
 *
 * Sticky top-0 trong scope của directory wrapper (xem page.tsx).
 */
type Props = {
  totalProducts: number
  totalCompanies: number
  lastUpdated: string
}

export function ProductFilters({ totalProducts, totalCompanies, lastUpdated }: Props) {
  const t = useTranslations("productFilters")
  const router = useRouter()
  const sp = useSearchParams()

  const sort = sp.get("sort") ?? "moi-nhat"
  const view = sp.get("view") ?? "grid"
  const q = sp.get("q") ?? ""

  const update = useCallback(
    (patches: Record<string, string>) => {
      const next = new URLSearchParams(sp.toString())
      // Reset page khi đổi search/sort/view
      next.delete("page")
      for (const [k, v] of Object.entries(patches)) {
        if (v) next.set(k, v)
        else next.delete(k)
      }
      router.push(`/san-pham-chung-nhan?${next.toString()}`, { scroll: false })
    },
    [sp, router],
  )

  return (
    <div className="sticky top-0 z-30 border-b border-stone-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        {/* Search input — pill rounded-full, emerald focus ring */}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            const val = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value
            update({ q: val })
          }}
          className="relative w-full min-w-[200px] sm:w-72 sm:shrink-0"
        >
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          />
          <input
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="w-full rounded-full border border-stone-300 bg-white py-2 pl-10 pr-9 text-sm text-stone-900 placeholder:text-stone-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          {q && (
            <button
              type="button"
              onClick={() => update({ q: "" })}
              aria-label="Xoá tìm kiếm"
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Sort */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="hidden text-xs uppercase tracking-wide text-stone-500 sm:inline">
            {t("sortLabel")}
          </span>
          {[
            { value: "moi-nhat", label: t("sortNewest") },
            { value: "ten-az", label: t("sortName") },
            { value: "cong-ty", label: t("sortCompany") },
            { value: "noi-bat", label: t("sortFeatured") },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ sort: opt.value })}
              className={cn(
                "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                sort === opt.value
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-emerald-400 hover:text-emerald-700",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Trust bar + View toggle — đẩy phải bằng ml-auto */}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className="hidden text-xs text-stone-500 lg:inline">
            <span className="font-semibold text-emerald-700">{totalProducts}</span>{" "}
            {t("products")}
            {" · "}
            <span className="font-semibold text-emerald-700">{totalCompanies}</span>{" "}
            {t("companies")}
            {" · "}
            {t("updated")} {lastUpdated}
          </span>

          <div className="flex items-center overflow-hidden rounded-lg border border-stone-200 bg-white">
            <button
              onClick={() => update({ view: "grid" })}
              title={t("gridView")}
              className={cn(
                "px-3 py-1.5 text-sm transition-colors",
                view !== "list" ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-50",
              )}
            >
              ⊞
            </button>
            <button
              onClick={() => update({ view: "list" })}
              title={t("listView")}
              className={cn(
                "px-3 py-1.5 text-sm transition-colors",
                view === "list" ? "bg-emerald-700 text-white" : "text-stone-600 hover:bg-stone-50",
              )}
            >
              ≡
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
