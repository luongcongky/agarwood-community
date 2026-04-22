"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"

export function MultimediaLightbox({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const close = useCallback(() => setOpenIdx(null), [])
  const prev = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length],
  )
  const next = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  )

  useEffect(() => {
    if (openIdx === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [openIdx, close, prev, next])

  if (images.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setOpenIdx(i)}
            className="group relative aspect-square overflow-hidden bg-neutral-100"
            aria-label={`Mở ảnh ${i + 1}`}
          >
            <Image
              src={url}
              alt={`${alt} — ${i + 1}`}
              fill
              className="object-cover transition-opacity group-hover:opacity-85"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      {openIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center bg-white/10 text-3xl text-white hover:bg-white/20"
          >
            ×
          </button>
          <span className="absolute top-4 left-4 text-sm text-white/70">
            {openIdx + 1} / {images.length}
          </span>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                aria-label="Ảnh trước"
                className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center bg-white/10 text-3xl text-white hover:bg-white/20"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                aria-label="Ảnh sau"
                className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center bg-white/10 text-3xl text-white hover:bg-white/20"
              >
                ›
              </button>
            </>
          )}

          <div
            className="relative h-[85vh] w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[openIdx]}
              alt={`${alt} — ${openIdx + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>
        </div>
      )}
    </>
  )
}
