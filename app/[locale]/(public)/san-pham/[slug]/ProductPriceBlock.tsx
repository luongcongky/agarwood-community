"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export type ProductVariant = {
  name: string
  priceRange?: string
}

interface Props {
  defaultPriceRange: string | null
  variants: ProductVariant[] | null
}

/**
 * Block giá nổi bật + variant selector. Click variant → priceRange hiển thị
 * cập nhật theo variant đó. Nếu variant không có priceRange riêng → fallback
 * `defaultPriceRange`. Nếu không có variants → chỉ hiển thị price block.
 */
export function ProductPriceBlock({ defaultPriceRange, variants }: Props) {
  const validVariants = (variants ?? []).filter((v) => v.name?.trim())
  const [selectedIdx, setSelectedIdx] = useState(0)

  const selectedVariant = validVariants[selectedIdx]
  const displayedPrice =
    validVariants.length > 0
      ? selectedVariant?.priceRange?.trim() || defaultPriceRange
      : defaultPriceRange

  return (
    <div className="space-y-4">
      {/* Price — Lazada style: số to bold đứng riêng, không cần header label */}
      {displayedPrice && (
        <div className="rounded-md bg-amber-50/60 px-4 py-3 border-l-4 border-amber-600">
          <p className="text-2xl sm:text-3xl font-bold text-amber-900 leading-none">
            {displayedPrice}
          </p>
          {validVariants.length > 0 && selectedVariant && (
            <p className="mt-1.5 text-xs text-neutral-600">
              Phân loại: <span className="font-medium text-neutral-800">{selectedVariant.name}</span>
            </p>
          )}
        </div>
      )}

      {/* Variant selector — Lazada-style: label "Phân loại" trái + pills */}
      {validVariants.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          <span className="shrink-0 sm:w-32 text-xs uppercase tracking-wide text-neutral-500 sm:pt-2">
            Phân loại:
          </span>
          <div className="flex flex-wrap gap-2 flex-1">
            {validVariants.map((v, i) => {
              const isSelected = i === selectedIdx
              return (
                <button
                  key={`${v.name}-${i}`}
                  type="button"
                  onClick={() => setSelectedIdx(i)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-all min-w-[60px]",
                    isSelected
                      ? "border-amber-600 bg-white text-amber-800 ring-1 ring-amber-600"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-amber-500 hover:text-amber-700",
                  )}
                >
                  {v.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
