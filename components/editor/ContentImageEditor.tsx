"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"

const MAX_OUTPUT_DIM = 1000
const CROP_ASPECT = 16 / 9

type Mode = "crop" | "resize"

export interface ContentImageEditorProps {
  /** Blob URL / data URL / Cloudinary URL của ảnh gốc. */
  imageSrc: string
  /** Caption hiện tại (truyền khi edit ảnh có sẵn). */
  initialCaption?: string
  /** Trả về Blob mới (đã crop hoặc resize + clamp 1000px) + caption đã nhập. */
  onDone: (result: { blob: Blob; caption: string }) => void
  onCancel: () => void
}

/**
 * Modal chèn / chỉnh sửa ảnh trong nội dung bài viết.
 * - Tab "Cắt ảnh 16:9": crop vùng cố định, user pan + zoom.
 * - Tab "Resize": uniform scale (giữ tỉ lệ gốc) — 1 input width, height tự tính.
 * - Output luôn clamp ≤ 1000px ở cạnh dài nhất.
 * - Caption: textarea dưới preview, lưu thành <figcaption>.
 */
export function ContentImageEditor({
  imageSrc,
  initialCaption = "",
  onDone,
  onCancel,
}: ContentImageEditorProps) {
  const [mode, setMode] = useState<Mode>("crop")
  const [caption, setCaption] = useState(initialCaption)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Crop tab state
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  // ── Resize tab state (uniform scale — giữ aspect gốc)
  const [origDims, setOrigDims] = useState<{ w: number; h: number } | null>(
    null,
  )
  const aspectRef = useRef<number>(1)
  const [resizeWidth, setResizeWidth] = useState<number>(0)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight || 1
      aspectRef.current = ratio
      const defaultW = Math.min(img.naturalWidth, MAX_OUTPUT_DIM)
      setResizeWidth(defaultW)
      setOrigDims({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.onerror = () => setError("Không đọc được ảnh gốc.")
    img.src = imageSrc
  }, [imageSrc])

  async function handleConfirm() {
    setProcessing(true)
    setError(null)
    try {
      let blob: Blob
      if (mode === "crop") {
        if (!croppedAreaPixels) {
          setError("Chưa xác định vùng cắt.")
          setProcessing(false)
          return
        }
        blob = await renderCroppedBlob(imageSrc, croppedAreaPixels)
      } else {
        const width = clampWidth(resizeWidth)
        const height = Math.max(1, Math.round(width / aspectRef.current))
        blob = await renderResizedBlob(imageSrc, width, height)
      }
      onDone({ blob, caption: caption.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xử lý ảnh thất bại.")
    } finally {
      setProcessing(false)
    }
  }

  const resizeHeight = Math.max(
    1,
    Math.round(clampWidth(resizeWidth) / aspectRef.current),
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Close button góc phải — quick close khi user lỡ mở modal. */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Đóng"
          className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M4.28 4.28a.75.75 0 011.06 0L10 8.94l4.66-4.66a.75.75 0 111.06 1.06L11.06 10l4.66 4.66a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.66a.75.75 0 11-1.06-1.06L8.94 10 4.28 5.34a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="border-b border-brand-200 px-6 py-4 pr-14">
          <h3 className="text-lg font-bold text-brand-900">Chèn / chỉnh sửa ảnh</h3>
          <p className="mt-1 text-xs text-brand-500">
            Tối đa {MAX_OUTPUT_DIM}px ở cạnh dài nhất. Chú thích (nếu có) sẽ
            hiển thị dưới ảnh trên trang bài viết.
          </p>
          <div className="mt-3 flex gap-1 text-sm">
            <TabButton active={mode === "crop"} onClick={() => setMode("crop")}>
              Cắt ảnh 16:9
            </TabButton>
            <TabButton
              active={mode === "resize"}
              onClick={() => setMode("resize")}
            >
              Resize giữ tỉ lệ
            </TabButton>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded border border-red-300 bg-red-50 p-2 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="p-6">
          {mode === "crop" ? (
            <>
              <div className="relative h-[360px] w-full bg-neutral-100">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={CROP_ASPECT}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid
                />
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-brand-500">
                <span className="shrink-0">Thu nhỏ</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-brand-700"
                />
                <span className="shrink-0">Phóng to</span>
              </div>
            </>
          ) : (
            <ResizePanel
              src={imageSrc}
              width={resizeWidth}
              onWidthChange={setResizeWidth}
              origDims={origDims}
              computedHeight={resizeHeight}
            />
          )}

          <div className="mt-5">
            <label className="mb-1 block text-sm font-semibold text-brand-900">
              Chú thích ảnh{" "}
              <span className="text-xs font-normal text-brand-500">
                (tùy chọn — hiển thị dưới ảnh)
              </span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              placeholder="Ví dụ: Toàn cảnh hội thảo trầm hương tại TP.HCM, 04/2026."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-200 px-6 py-4">
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "border-b-2 border-brand-700 text-brand-900"
          : "border-b-2 border-transparent text-neutral-500 hover:text-brand-700"
      }`}
    >
      {children}
    </button>
  )
}

function ResizePanel({
  src,
  width,
  onWidthChange,
  origDims,
  computedHeight,
}: {
  src: string
  width: number
  onWidthChange: (w: number) => void
  origDims: { w: number; h: number } | null
  computedHeight: number
}) {
  if (!origDims) {
    return (
      <div className="flex h-[320px] items-center justify-center bg-neutral-100 text-sm text-neutral-500">
        Đang tải ảnh…
      </div>
    )
  }

  const displayW = Math.min(width, 640)
  const clamped = clampWidth(width)
  const exceeds = width > MAX_OUTPUT_DIM

  return (
    <div>
      <div className="flex min-h-[280px] items-center justify-center bg-neutral-100 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Preview"
          style={{ width: `${displayW}px`, height: "auto" }}
          className="max-h-[280px] object-contain"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-600">
            Chiều rộng (px)
          </label>
          <input
            type="number"
            value={width}
            min={50}
            max={MAX_OUTPUT_DIM}
            onChange={(e) =>
              onWidthChange(Math.max(50, Number(e.target.value) || 50))
            }
            className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-600">
            Chiều cao (tự tính)
          </label>
          <input
            type="number"
            value={computedHeight}
            disabled
            className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-500"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Giữ tỷ lệ gốc {origDims.w}×{origDims.h}. Tối đa {MAX_OUTPUT_DIM}px.
        {exceeds && (
          <span className="ml-1 text-amber-700">
            (Giá trị {width}px sẽ clamp về {clamped}px khi lưu.)
          </span>
        )}
      </p>
    </div>
  )
}

// ── Canvas helpers ──────────────────────────────────────────────────────────

function clampWidth(w: number): number {
  if (!Number.isFinite(w) || w <= 0) return 1
  return Math.min(Math.round(w), MAX_OUTPUT_DIM)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Load ảnh thất bại"))
    img.src = url
  })
}

async function renderCroppedBlob(
  imageSrc: string,
  crop: Area,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Không tạo được canvas context")

  // Clamp cạnh dài về MAX_OUTPUT_DIM
  let targetW = crop.width
  let targetH = crop.height
  const longSide = Math.max(targetW, targetH)
  if (longSide > MAX_OUTPUT_DIM) {
    const scale = MAX_OUTPUT_DIM / longSide
    targetW = Math.round(targetW * scale)
    targetH = Math.round(targetH * scale)
  } else {
    targetW = Math.round(targetW)
    targetH = Math.round(targetH)
  }

  canvas.width = Math.max(1, targetW)
  canvas.height = Math.max(1, targetH)
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob thất bại"))),
      "image/jpeg",
      0.9,
    )
  })
}

async function renderResizedBlob(
  imageSrc: string,
  width: number,
  height: number,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Không tạo được canvas context")

  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob thất bại"))),
      "image/jpeg",
      0.9,
    )
  })
}
