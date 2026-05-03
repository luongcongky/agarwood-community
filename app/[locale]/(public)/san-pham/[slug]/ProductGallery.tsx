"use client"

import { useState, type MouseEvent as ReactMouseEvent } from "react"
import { cn } from "@/lib/utils"
import { CloudinaryImage } from "@/components/ui/CloudinaryImage"

type Props = {
  imageUrls: string[]
  productName: string
}

const ZOOM_SCALE = 2.5
// Lens = vùng vuông trên ảnh chính, kích thước = 1/ZOOM_SCALE = 40%.
const LENS_PCT = 100 / ZOOM_SCALE

/**
 * Gallery e-commerce style:
 *  - Main image flush, không border
 *  - Hover desktop: lens vuông + zoom panel bên phải hiện vùng đang focus
 *  - Mobile: bỏ zoom (no hover); chỉ click thumbnail đổi ảnh
 *  - Thumbnails: border-2 amber-600 đầy đủ 4 góc khi active
 */
export function ProductGallery({ imageUrls, productName }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [hasError, setHasError] = useState(false)
  // Mouse position normalized 0-100 % của main image
  const [pos, setPos] = useState({ x: 50, y: 50 })

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    // Clamp 0-100 cho an toàn
    setPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    })
  }

  if (imageUrls.length === 0) {
    return (
      <div className="aspect-square w-full bg-linear-to-br from-brand-200 to-brand-400 flex items-center justify-center">
        <span className="text-brand-700 font-semibold text-lg text-center px-4">
          {productName}
        </span>
      </div>
    )
  }

  // Lens position — clamp để lens không tràn ra ngoài image edges.
  // lensCenterX in [LENS_PCT/2, 100-LENS_PCT/2] → lens left in [0, 100-LENS_PCT]
  const lensLeft = Math.max(0, Math.min(100 - LENS_PCT, pos.x - LENS_PCT / 2))
  const lensTop = Math.max(0, Math.min(100 - LENS_PCT, pos.y - LENS_PCT / 2))
  // Bg position cho zoom panel: dùng cùng % với lens để khớp.
  // Convert lens-left [0, 100-LENS_PCT] → bg-position-x [0, 100].
  const bgX = LENS_PCT < 100 ? (lensLeft / (100 - LENS_PCT)) * 100 : 50
  const bgY = LENS_PCT < 100 ? (lensTop / (100 - LENS_PCT)) * 100 : 50

  const currentImage = imageUrls[selectedIndex]

  return (
    <div className="space-y-3">
      {/* Relative wrapper để zoom panel có thể absolute-position bên phải
          (overflow ra info column khi đang zoom). */}
      <div className="relative">
        {/* Main image — flush, no border, mouse tracking */}
        <div
          className="relative aspect-square w-full overflow-hidden bg-neutral-50 cursor-crosshair select-none"
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
        >
          <CloudinaryImage
            src={currentImage}
            alt={`${productName} - ảnh ${selectedIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
            priority={selectedIndex === 0}
            draggable={false}
            onError={() => setHasError(true)}
          />
          {/* Lens — chỉ desktop, hiện khi đang hover */}
          {isZooming && (
            <div
              className="pointer-events-none absolute hidden md:block border-2 border-amber-600 bg-amber-100/40 mix-blend-multiply"
              style={{
                width: `${LENS_PCT}%`,
                height: `${LENS_PCT}%`,
                left: `${lensLeft}%`,
                top: `${lensTop}%`,
              }}
            />
          )}
        </div>

        {/* Zoom panel — desktop only, absolute fill phải gallery, width 150%
            (≈ info column 3/5) × height = gallery height (qua h-full + relative
            wrapper aspect-square). KH yêu cầu (2026-04-29): panel full width
            của info column, không square nhỏ. */}
        {isZooming && !hasError && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-full top-0 ml-4 hidden md:block h-full bg-white shadow-2xl ring-1 ring-neutral-200 z-40 overflow-hidden"
            style={{
              width: "150%",
              backgroundImage: `url(${currentImage})`,
              backgroundSize: `${ZOOM_SCALE * 100}%`,
              backgroundPosition: `${bgX}% ${bgY}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
      </div>

      {/* Thumbnails — flush squares, border-2 amber-600 đầy đủ 4 góc khi active */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSelectedIndex(i)
                setHasError(false)
              }}
              aria-label={`Xem ảnh ${i + 1}`}
              aria-pressed={i === selectedIndex}
              className={cn(
                "relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden bg-neutral-50 transition-colors",
                "border-2",
                i === selectedIndex
                  ? "border-amber-600"
                  : "border-neutral-200 hover:border-amber-400",
              )}
            >
              <CloudinaryImage
                src={url}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                maxWidth={200}
                fallbackSize="xs"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
