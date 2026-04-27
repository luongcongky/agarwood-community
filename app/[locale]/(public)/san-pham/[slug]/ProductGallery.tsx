"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

type Props = {
  imageUrls: string[]
  productName: string
}

export function ProductGallery({ imageUrls, productName }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (imageUrls.length === 0) {
    return (
      <div className="aspect-square w-full rounded-xl bg-linear-to-br from-brand-200 to-brand-400 flex items-center justify-center">
        <span className="text-brand-700 font-semibold text-lg text-center px-4">
          {productName}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image — priority cho initial render (ảnh LCP candidate
          của product detail page). Khi user click thumbnail khác, ảnh mới
          load bình thường, priority không còn tác dụng. */}
      <div className="aspect-square w-full rounded-xl overflow-hidden bg-brand-100 border border-brand-200 relative">
        <Image
          src={imageUrls[selectedIndex]}
          alt={`${productName} - ảnh ${selectedIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedIndex === 0}
        />
      </div>

      {/* Thumbnails */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {imageUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 relative",
                i === selectedIndex
                  ? "border-brand-600 ring-2 ring-brand-400 ring-offset-1"
                  : "border-brand-200 hover:border-brand-400"
              )}
            >
              <Image
                src={url}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
