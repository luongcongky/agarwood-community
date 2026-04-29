"use client"

import { useState, useRef, useEffect, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { BannerSlot } from "@prisma/client"
import {
  getSlotShape,
  getSlotShapeConfig,
  BANNER_SLOT_META,
} from "@/lib/banner-slots"
import { BannerSlotPicker } from "@/components/features/admin/BannerSlotPicker"
import { CoverImageCropper } from "@/components/ui/CoverImageCropper"

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

interface AdminBannerEditorProps {
  /** Callback khi save thành công. Workbench/drawer mode dùng để refresh
   *  list ngoài. Nếu omit → fallback navigate về /admin/banner. */
  onSuccess?: () => void
  /** Callback khi admin xong workflow (click "Xong" trong extension UI).
   *  Workbench dùng để collapse form section. */
  onComplete?: () => void
  /** Slot được control từ parent (workbench layout). Nếu provided → ẩn picker
   *  + lock slot theo prop. Nếu null/undefined → component tự manage state. */
  controlledSlot?: BannerSlot | null
}

export function AdminBannerEditor({ onSuccess, onComplete, controlledSlot }: AdminBannerEditorProps = {}) {
  const router = useRouter()

  const isControlled = controlledSlot !== undefined
  const [internalSlot, setInternalSlot] = useState<BannerSlot | null>(null)
  const slot = isControlled ? controlledSlot ?? null : internalSlot
  const setSlot = (next: BannerSlot | null) => {
    if (isControlled) return // parent quyết định, không setState bên trong
    setInternalSlot(next)
  }
  const [title, setTitle] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(addDaysIso(30))

  // Crop flow state. Phase 4.3 (2026-04-29): deferred upload — giữ blob đã
  // crop trong RAM, chỉ upload Cloudinary lúc save → tránh orphan asset khi
  // admin đổi ý / huỷ form.
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Phase 4.2 (2026-04-29): post-save extension state — sau khi tạo banner
  // thành công, hiển thị UI cho phép gắn banner vào thêm slot khác cùng shape.
  const [createdBanner, setCreatedBanner] = useState<{
    id: string
    positions: BannerSlot[]
  } | null>(null)
  const [extraSlots, setExtraSlots] = useState<Set<BannerSlot>>(new Set())
  const [extending, setExtending] = useState(false)

  const shapeConfig = slot ? getSlotShapeConfig(slot) : null

  /** Revoke + clear cropped preview URL (free memory). */
  function clearCropped() {
    setCroppedBlob(null)
    setCroppedPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  function onSlotChange(next: BannerSlot) {
    if (next === slot) return
    const prevShape = slot ? getSlotShapeConfig(slot) : null
    const nextShape = getSlotShapeConfig(next)
    setSlot(next)
    // Aspect ratio đổi → ảnh đã crop không còn đúng tỷ lệ → invalidate
    if (croppedBlob && prevShape && prevShape.aspectRatio !== nextShape.aspectRatio) {
      clearCropped()
      setError(
        "Đã đổi vị trí banner sang aspect ratio khác. Vui lòng chọn + crop lại ảnh.",
      )
    }
  }

  // Controlled mode: parent đổi slot (qua URL/state) → invalidate cropped nếu
  // aspect khác (dep theo aspectRatio để TOP_LEFT ↔ TOP_RIGHT không re-fire).
  const aspectRatio = shapeConfig?.aspectRatio ?? null
  useEffect(() => {
    if (!isControlled) return
    clearCropped()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onFilePick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setRawImageUrl(blobUrl)
    setShowCropper(true)
    setError(null)
    e.target.value = ""
  }

  function onCropDone(blob: Blob) {
    // Deferred upload: giữ blob trong RAM + tạo preview URL local. Upload
    // Cloudinary chỉ xảy ra khi click "Tạo banner ACTIVE" → tránh orphan.
    setShowCropper(false)
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl)
    setCroppedBlob(blob)
    setCroppedPreviewUrl(URL.createObjectURL(blob))
    setError(null)
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl)
    setRawImageUrl(null)
  }

  function onCropCancel() {
    setShowCropper(false)
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl)
    setRawImageUrl(null)
  }

  async function onSave() {
    setError(null)

    if (!slot) {
      setError("Cần chọn vùng hiển thị banner trên layout mockup.")
      return
    }
    if (!croppedBlob) {
      setError("Cần chọn + crop ảnh banner trước khi lưu.")
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
      // Step 1: upload blob đã crop lên Cloudinary (chỉ lúc save → tránh orphan)
      const fd = new FormData()
      fd.append("file", croppedBlob, "banner.jpg")
      fd.append("folder", "banner")
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
      if (!uploadRes.ok) {
        const j = (await uploadRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? "Upload ảnh thất bại.")
      }
      const uploadJson = (await uploadRes.json()) as { secure_url?: string }
      if (!uploadJson.secure_url) throw new Error("Upload không trả về URL.")

      // Step 2: tạo banner record với secure_url vừa upload
      const res = await fetch("/api/admin/banner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slots: [slot],
          imageUrl: uploadJson.secure_url,
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
      const json = (await res.json()) as { banner: { id: string; positions: BannerSlot[] } }
      // Workbench mode: chuyển sang extension UI để chọn thêm slot. Page mode
      // (no onSuccess) navigate về list như cũ.
      if (onSuccess) {
        setCreatedBanner({ id: json.banner.id, positions: json.banner.positions })
        setExtraSlots(new Set())
        onSuccess() // refresh list để banner mới appear ngay
      } else {
        router.push("/admin/banner")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại.")
    } finally {
      setSaving(false)
    }
  }

  async function applyExtraSlots() {
    if (!createdBanner || extraSlots.size === 0) return
    setExtending(true)
    setError(null)
    try {
      const newPositions = [...createdBanner.positions, ...extraSlots]
      const res = await fetch(`/api/admin/banner/${createdBanner.id}/positions`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slots: newPositions }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? "Cập nhật slot thất bại.")
      }
      const json = (await res.json()) as { banner: { id: string; positions: BannerSlot[] } }
      setCreatedBanner({ id: json.banner.id, positions: json.banner.positions })
      setExtraSlots(new Set())
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật slot thất bại.")
    } finally {
      setExtending(false)
    }
  }

  function resetForNewBanner() {
    setCreatedBanner(null)
    setExtraSlots(new Set())
    clearCropped()
    setTitle("")
    setTargetUrl("")
    setError(null)
    // Workbench listen `onComplete` để collapse section. Nếu parent unmount
    // editor (collapse) thì state reset cũng OK — không có double-call hại gì.
    onComplete?.()
  }

  function toggleExtraSlot(s: BannerSlot) {
    setExtraSlots((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  // Embedded modes (drawer / workbench): ẩn page chrome (h1 + back link).
  const isEmbedded = !!onSuccess

  return (
    <div className={isEmbedded ? "space-y-6" : "max-w-3xl space-y-6 p-6"}>
      {!isEmbedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tạo banner quảng cáo</h1>
          <Link
            href="/admin/banner"
            className="text-sm text-brand-600 hover:underline"
          >
            ← Quay lại danh sách
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {createdBanner ? (
        <BannerCreatedExtension
          banner={createdBanner}
          extraSlots={extraSlots}
          onToggleSlot={toggleExtraSlot}
          onApply={applyExtraSlots}
          onDone={resetForNewBanner}
          extending={extending}
        />
      ) : (
        <>
      {/* Slot picker — chỉ hiện khi component tự manage slot. Workbench mode
          parent đã có mockup riêng, không cần picker bên trong form. */}
      {!isControlled && (
        <section>
          <label className="mb-2 block text-sm font-semibold">
            Vị trí hiển thị
          </label>
          <BannerSlotPicker value={slot} onChange={onSlotChange} />
        </section>
      )}

      {/* Image upload — 1 button mở popup (file picker → crop modal). Ảnh
          giữ trong RAM, upload Cloudinary lúc save. */}
      {slot && shapeConfig && (
        <section>
          <label className="mb-2 block text-sm font-semibold">
            Ảnh banner{" "}
            <span className="text-xs font-normal text-neutral-500">
              ({shapeConfig.targetWidth}×{shapeConfig.targetHeight})
            </span>
          </label>

          <div className="flex items-center gap-3">
            {croppedPreviewUrl && (
              <div
                className={`relative overflow-hidden rounded border border-neutral-200 bg-neutral-100 ${shapeConfig.previewClassName}`}
                style={{ maxWidth: shapeConfig.aspectRatio < 1 ? 80 : 160 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={croppedPreviewUrl}
                  alt="Preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:border-brand-500 hover:bg-brand-50"
            >
              {croppedPreviewUrl ? "Đổi ảnh" : "Chọn ảnh banner…"}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFilePick}
            className="hidden"
          />

          <p className="mt-2 text-xs text-neutral-500">
            Crop theo tỷ lệ {shapeConfig.targetWidth}:{shapeConfig.targetHeight}.
            Ảnh chỉ upload Cloudinary khi click &quot;Tạo banner ACTIVE&quot;.
          </p>
        </section>
      )}

      {!slot && (
        <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          ⓘ Chọn vị trí hiển thị trên layout mockup phía trên trước khi upload ảnh
          (mỗi vị trí có aspect ratio khác nhau).
        </p>
      )}

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

      {/* Actions — Hủy chỉ hiện ở page/drawer (cần điều hướng); workbench
          ở luôn /admin/banner nên Hủy không có ý nghĩa. */}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
        {!isControlled && (
          <Link
            href="/admin/banner"
            className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Hủy
          </Link>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !slot || !croppedBlob}
          className="rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : "Tạo banner ACTIVE"}
        </button>
      </div>
        </>
      )}

      {/* Crop modal */}
      {showCropper && rawImageUrl && shapeConfig && (
        <CoverImageCropper
          imageSrc={rawImageUrl}
          aspect={shapeConfig.aspectRatio}
          onCropDone={onCropDone}
          onCancel={onCropCancel}
        />
      )}
    </div>
  )
}

// ── Post-save extension UI ───────────────────────────────────────────────

interface ExtensionProps {
  banner: { id: string; positions: BannerSlot[] }
  extraSlots: Set<BannerSlot>
  onToggleSlot: (s: BannerSlot) => void
  onApply: () => void
  onDone: () => void
  extending: boolean
}

function BannerCreatedExtension({
  banner,
  extraSlots,
  onToggleSlot,
  onApply,
  onDone,
  extending,
}: ExtensionProps) {
  // Compatible slots: cùng shape với slot hiện tại của banner, chưa nằm trong
  // banner.positions. Filter từ BANNER_SLOT_META.
  const currentShape = getSlotShape(banner.positions[0])
  const compatibleSlots = (Object.keys(BANNER_SLOT_META) as BannerSlot[]).filter(
    (s) => getSlotShape(s) === currentShape && !banner.positions.includes(s),
  )

  return (
    <div className="rounded-xl border border-emerald-300 bg-emerald-50/40 p-5 space-y-4">
      <div className="flex items-start gap-2">
        <span className="text-xl">✓</span>
        <div>
          <p className="font-semibold text-emerald-900">
            Banner đã tạo thành công
          </p>
          <p className="mt-0.5 text-xs text-emerald-800">
            Đã áp dụng cho{" "}
            <strong>{banner.positions.length} vùng</strong>:{" "}
            {banner.positions.map((s) => BANNER_SLOT_META[s].label).join(", ")}
          </p>
        </div>
      </div>

      {compatibleSlots.length > 0 && (
        <div className="rounded-lg bg-white border border-neutral-200 p-3 space-y-3">
          <p className="text-sm font-semibold text-brand-900">
            Áp dụng banner này cho thêm vùng khác cùng aspect ratio?
          </p>
          <p className="text-[11px] text-neutral-500">
            Tiết kiệm thời gian — không cần upload lại ảnh hay tạo banner mới.
          </p>

          <div className="max-h-60 overflow-y-auto rounded border border-neutral-200">
            {compatibleSlots.map((s) => {
              const checked = extraSlots.has(s)
              return (
                <label
                  key={s}
                  className="flex items-start gap-2 border-b border-neutral-100 px-3 py-2 last:border-b-0 cursor-pointer hover:bg-brand-50/40"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleSlot(s)}
                    className="mt-0.5 accent-brand-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-900">
                      {BANNER_SLOT_META[s].label}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {BANNER_SLOT_META[s].description}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-neutral-600">
              Đã chọn {extraSlots.size} vùng
            </p>
            <button
              type="button"
              onClick={onApply}
              disabled={extraSlots.size === 0 || extending}
              className="rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {extending ? "Đang áp dụng…" : `Áp dụng ${extraSlots.size} vùng`}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-emerald-200 pt-3">
        <button
          type="button"
          onClick={onDone}
          className="rounded border border-emerald-400 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
        >
          Xong — tạo banner mới khác
        </button>
      </div>
    </div>
  )
}

// Re-export meta for sites that show slot label inline
export { BANNER_SLOT_META }
