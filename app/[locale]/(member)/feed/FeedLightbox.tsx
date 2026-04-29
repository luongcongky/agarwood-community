"use client"

import { useCallback, useEffect, useState } from "react"
import { cloudinaryResize } from "@/lib/cloudinary"

type Props = {
  images: string[]
  startIndex: number
  onClose: () => void
}

/**
 * Full-screen lightbox modal cho feed post images. Tách file để lazy-load
 * qua `next/dynamic` trong FeedClient — chỉ load chunk khi user click ảnh.
 * Tiết kiệm ~5 kB JS + tránh hydrate arrow navigation + preload listener
 * mà đa số user không dùng.
 *
 * Preload adjacent images để pressing arrow keys feels instant.
 */
export function FeedLightbox({ images, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length],
  )
  const next = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, prev, next])

  useEffect(() => {
    if (images.length < 2) return
    const nextIdx = (index + 1) % images.length
    const prevIdx = (index - 1 + images.length) % images.length
    const uniqueIdx = [...new Set([nextIdx, prevIdx])].filter((i) => i !== index)
    const links = uniqueIdx.map((i) => {
      const link = document.createElement("link")
      link.rel = "preload"
      link.as = "image"
      link.href = cloudinaryResize(images[i], 1920)
      document.head.appendChild(link)
      return link
    })
    return () => {
      links.forEach((l) => l.remove())
    }
  }, [index, images])

  const multi = images.length > 1

  return (
    <div
      className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        // top/right dùng safe-area-inset để không bị notch/status bar mobile che.
        // Touch target 48×48 cho dễ bấm (cũ 40×40 sát giới hạn iOS).
        style={{
          top: "max(1rem, env(safe-area-inset-top))",
          right: "max(1rem, env(safe-area-inset-right))",
        }}
        className="absolute w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/35 text-white text-2xl flex items-center justify-center transition-colors"
        aria-label="Đóng"
      >
        ✕
      </button>

      {multi && (
        <div
          style={{ top: "max(1rem, env(safe-area-inset-top))" }}
          className="absolute left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium tabular-nums bg-black/40 rounded-full px-3 py-1"
        >
          {index + 1} / {images.length}
        </div>
      )}

      {multi && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); prev() }}
          className="absolute left-4 sm:left-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center transition-colors"
          aria-label="Ảnh trước"
        >
          ‹
        </button>
      )}

      <div
        className="relative w-full h-full max-w-[92vw] max-h-[88vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cloudinaryResize(images[index], 1920)}
          alt=""
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {multi && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); next() }}
          className="absolute right-4 sm:right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center transition-colors"
          aria-label="Ảnh sau"
        >
          ›
        </button>
      )}
    </div>
  )
}
