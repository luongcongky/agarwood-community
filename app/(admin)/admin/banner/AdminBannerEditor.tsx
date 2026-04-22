"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { BannerPosition } from "@prisma/client"
import { BANNER_POSITION_CONFIG } from "@/lib/banner-positions"
import { CoverImageCropper } from "@/components/ui/CoverImageCropper"

const POSITIONS: BannerPosition[] = ["TOP", "MID", "SIDEBAR"]

function todayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function addDaysIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export function AdminBannerEditor() {
  const router = useRouter()

  const [position, setPosition] = useState<BannerPosition>("TOP")
  const [title, setTitle] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(addDaysIso(30))

  // Crop flow state
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = BANNER_POSITION_CONFIG[position]

  function onPositionChange(p: BannerPosition) {
    if (p === position) return
    setPosition(p)
    // Khi đổi position, aspect đổi → invalidate ảnh đã upload
    // user cần upload + crop lại theo tỉ lệ mới
    if (uploadedUrl) {
      setUploadedUrl(null)
      setError(
        "Đã đổi vị trí banner. Vui lòng upload + crop lại ảnh theo tỷ lệ mới.",
      )
    }
  }

  function onFilePick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setRawImageUrl(blobUrl)
    setShowCropper(true)
    setError(null)
    e.target.value = ""
  }

  async function onCropDone(blob: Blob) {
    setShowCropper(false)
    setUploading(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append("file", blob, "banner.jpg")
      fd.append("folder", "banner")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? "Upload thất bại.")
      }
      const j = (await res.json()) as { secure_url?: string }
      if (!j.secure_url) throw new Error("Upload không trả về URL.")
      setUploadedUrl(j.secure_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại.")
    } finally {
      setUploading(false)
      // Dọn blob URL sau khi upload xong
      if (rawImageUrl) URL.revokeObjectURL(rawImageUrl)
      setRawImageUrl(null)
    }
  }

  function onCropCancel() {
    setShowCropper(false)
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl)
    setRawImageUrl(null)
  }

  async function onSave() {
    setError(null)

    if (!uploadedUrl) {
      setError("Cần upload ảnh banner trước khi lưu.")
      return
    }
    if (title.trim().length < 5 || title.trim().length > 100) {
      setError("Tiêu đề phải từ 5 đến 100 ký tự.")
      return
    }
    if (targetUrl.trim() && !/^https:\/\//.test(targetUrl.trim())) {
      setError("Nếu nhập URL đích, phải bắt đầu bằng https://")
      return
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("Ngày kết thúc phải sau ngày bắt đầu.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/banner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          position,
          imageUrl: uploadedUrl,
          targetUrl: targetUrl.trim() || null,
          title: title.trim(),
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? "Lưu thất bại.")
      }
      router.push("/admin/banner")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tạo banner quảng cáo</h1>
        <Link
          href="/admin/banner"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Quay lại danh sách
        </Link>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Position selector */}
      <section>
        <label className="mb-2 block text-sm font-semibold">Vị trí banner</label>
        <div className="grid gap-2 sm:grid-cols-3">
          {POSITIONS.map((p) => {
            const cfg = BANNER_POSITION_CONFIG[p]
            const active = position === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPositionChange(p)}
                className={`rounded border p-3 text-left transition-colors ${
                  active
                    ? "border-brand-700 bg-brand-50"
                    : "border-neutral-300 hover:border-brand-300"
                }`}
              >
                <div className="text-sm font-semibold text-brand-900">
                  {cfg.label}
                </div>
                <div className="mt-1 text-[11px] text-neutral-500">
                  {cfg.targetWidth}×{cfg.targetHeight}
                </div>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-neutral-600">{config.description}</p>
      </section>

      {/* Image upload + crop */}
      <section>
        <label className="mb-2 block text-sm font-semibold">
          Ảnh banner ({config.targetWidth}×{config.targetHeight})
        </label>

        {uploadedUrl ? (
          <div className="space-y-3">
            <div
              className={`relative overflow-hidden border border-neutral-200 bg-neutral-100 ${config.previewClassName} ${config.previewMaxWidthClass}`}
            >
              <Image
                src={uploadedUrl}
                alt="Banner preview"
                fill
                className="object-cover"
                sizes="800px"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                Chọn ảnh khác
              </button>
              <button
                type="button"
                onClick={() => setUploadedUrl(null)}
                className="text-sm text-red-600 hover:underline"
              >
                Xóa ảnh
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`flex w-full items-center justify-center border-2 border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-brand-500 hover:text-brand-700 disabled:opacity-50 ${config.previewClassName} ${config.previewMaxWidthClass}`}
          >
            {uploading ? "Đang upload…" : "+ Chọn ảnh để upload và crop"}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFilePick}
          className="hidden"
        />

        <p className="mt-2 text-xs text-neutral-500">
          Ảnh sẽ được crop theo tỷ lệ {config.targetWidth}:{config.targetHeight}{" "}
          trước khi upload lên Cloudinary.
        </p>
      </section>

      {/* Title */}
      <section>
        <label className="mb-1 block text-sm font-semibold">
          Tiêu đề (5–100 ký tự)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Tên thương hiệu / khẩu hiệu banner"
        />
      </section>

      {/* Target URL */}
      <section>
        <label className="mb-1 block text-sm font-semibold">
          URL đích{" "}
          <span className="text-xs font-normal text-neutral-500">
            (tùy chọn — để trống nếu banner không clickable)
          </span>
        </label>
        <input
          type="url"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm"
          placeholder="https://example.com/landing-page"
        />
      </section>

      {/* Dates */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold">Ngày bắt đầu</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Ngày kết thúc</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
        <Link
          href="/admin/banner"
          className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Hủy
        </Link>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || uploading || !uploadedUrl}
          className="rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : "Tạo banner ACTIVE"}
        </button>
      </div>

      {/* Crop modal */}
      {showCropper && rawImageUrl && (
        <CoverImageCropper
          imageSrc={rawImageUrl}
          aspect={config.aspectRatio}
          onCropDone={onCropDone}
          onCancel={onCropCancel}
        />
      )}
    </div>
  )
}
