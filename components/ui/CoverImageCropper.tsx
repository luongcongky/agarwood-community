"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"

interface CoverImageCropperProps {
  /** Blob URL hoặc data URL của ảnh gốc */
  imageSrc: string
  /** Tỷ lệ crop — mặc định 16/9 (cover tin tức) */
  aspect?: number
  onCropDone: (croppedBlob: Blob) => void
  onCancel: () => void
}

/**
 * Modal crop ảnh bìa — user kéo/zoom chọn vùng hiển thị,
 * output là Blob đã crop sẵn (canvas client-side).
 */
export function CoverImageCropper({
  imageSrc,
  aspect = 16 / 9,
  onCropDone,
  onCancel,
}: CoverImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      onCropDone(blob)
    } catch {
      // fallback: nếu crop fail thì dùng ảnh gốc
      const res = await fetch(imageSrc)
      const blob = await res.blob()
      onCropDone(blob)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-200">
          <h3 className="text-lg font-bold text-brand-900">Chỉnh sửa ảnh bìa</h3>
          <p className="text-xs text-brand-500 mt-1">
            Kéo để di chuyển, cuộn để phóng to/thu nhỏ. Vùng sáng sẽ được sử dụng làm ảnh bìa.
          </p>
        </div>

        {/* Crop area */}
        <div className="relative w-full" style={{ height: 400 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
          />
        </div>

        {/* Zoom slider */}
        <div className="px-6 py-3 border-t border-brand-100 flex items-center gap-4">
          <span className="text-xs text-brand-500 shrink-0">Thu nhỏ</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-brand-700"
          />
          <span className="text-xs text-brand-500 shrink-0">Phóng to</span>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-brand-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {processing ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Canvas crop helper ──────────────────────────────────────────────────────

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener("load", () => resolve(img))
    img.addEventListener("error", reject)
    img.crossOrigin = "anonymous"
    img.src = url
  })
}

async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  // Output max 1600px width (Cloudinary cũng resize nhưng giảm upload size)
  const maxWidth = 1600
  const scale = Math.min(1, maxWidth / crop.width)

  canvas.width = Math.round(crop.width * scale)
  canvas.height = Math.round(crop.height * scale)

  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, canvas.width, canvas.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.9,
    )
  })
}
