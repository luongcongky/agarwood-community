"use client"

import { useTranslations } from "next-intl"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { cn } from "@/lib/utils"

type Props = {
  categories: string[]
  provinces: string[]
  totalProducts: number
  totalCompanies: number
  lastUpdated: string
}

export function ProductFilters({ categories, provinces, totalProducts, totalCompanies, lastUpdated }: Props) {
  const t = useTranslations("productFilters")

  const router = useRouter()
  const sp = useSearchParams()

  const loai = sp.get("loai") ?? ""
  const vung = sp.get("vung") ?? ""
  const sort = sp.get("sort") ?? "moi-nhat"
  const view = sp.get("view") ?? "grid"
  const q = sp.get("q") ?? ""

  const update = useCallback(
    (patches: Record<string, string>) => {
      const next = new URLSearchParams(sp.toString())
      // Reset page when any filter/sort changes
      next.delete("page")
      for (const [k, v] of Object.entries(patches)) {
        if (v) next.set(k, v)
        else next.delete(k)
      }
      router.push(`/san-pham-chung-nhan?${next.toString()}`)
    },
    [sp, router]
  )

  const chipBase =
    "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap border"
  const chipActive = "bg-brand-800 text-white border-brand-800"
  const chipInactive = "bg-white text-brand-700 border-brand-300 hover:border-brand-500 hover:bg-brand-50"

  return (
    <>
      {/* ── Tầng 2: Bộ lọc (sticky khi scroll) ──────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-brand-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 space-y-2.5">

          {/* Loại */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-brand-500 uppercase tracking-wide w-10 shrink-0">
              {t("typeLabel")}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => update({ loai: "" })}
                className={cn(chipBase, !loai ? chipActive : chipInactive)}
              >
                {t("all")}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => update({ loai: loai === cat ? "" : cat })}
                  className={cn(chipBase, loai === cat ? chipActive : chipInactive)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Vùng + Tìm kiếm */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-brand-500 uppercase tracking-wide w-10 shrink-0">
              {t("regionLabel")}
            </span>
            <div className="flex gap-1.5 flex-wrap flex-1">
              <button
                onClick={() => update({ vung: "" })}
                className={cn(chipBase, !vung ? chipActive : chipInactive)}
              >
                {t("all")}
              </button>
              {provinces.map((p) => (
                <button
                  key={p}
                  onClick={() => update({ vung: vung === p ? "" : p })}
                  className={cn(chipBase, vung === p ? chipActive : chipInactive)}
                >
                  {p}
                </button>
              ))}

              {/* Search inline */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const val = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value
                  update({ q: val })
                }}
                className="flex gap-1 ml-auto"
              >
                <input
                  name="q"
                  defaultValue={q}
                  placeholder={t("searchPlaceholder")}
                  className="rounded-full border border-brand-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent w-36 sm:w-48"
                />
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tầng 3: Sort + View mode ─────────────────────────────────────── */}
      <div className="border-b border-brand-200 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-4 flex-wrap">

          {/* Sort */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm text-brand-500 mr-1">{t("sortLabel")}</span>
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
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
                  sort === opt.value
                    ? "bg-brand-700 text-white border-brand-700"
                    : "bg-white text-brand-600 border-brand-200 hover:border-brand-400"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Trust bar + View toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-brand-500 hidden sm:block">
              <span className="font-semibold text-brand-700">{totalProducts}</span> {t("products")}
              {" · "}
              <span className="font-semibold text-brand-700">{totalCompanies}</span> {t("companies")}
              {" · "}
              {t("updated")} {lastUpdated}
            </span>

            <div className="flex items-center gap-1 border border-brand-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => update({ view: "grid" })}
                title={t("gridView")}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  view !== "list" ? "bg-brand-800 text-white" : "text-brand-600 hover:bg-brand-50"
                )}
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => update({ view: "list" })}
                title={t("listView")}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  view === "list" ? "bg-brand-800 text-white" : "text-brand-600 hover:bg-brand-50"
                )}
              >
                ≡ List
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
