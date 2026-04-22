"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { slugify } from "@/lib/utils"

export type MultimediaInitial = {
  id: string
  type: "PHOTO_COLLECTION" | "VIDEO"
  slug: string
  title: string
  title_en: string | null
  title_zh: string | null
  title_ar: string | null
  excerpt: string | null
  excerpt_en: string | null
  excerpt_zh: string | null
  excerpt_ar: string | null
  coverImageUrl: string | null
  imageUrls: string[]
  youtubeId: string | null
  isPublished: boolean
  isPinned: boolean
  publishedAt: Date | string | null
} | null

/** Parse common YouTube URL formats → 11-char video id. */
function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim()
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  const m = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/,
  )
  return m ? m[1] : null
}

function toDatetimeLocal(d: Date | string | null): string {
  if (!d) return ""
  const date = typeof d === "string" ? new Date(d) : d
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function MultimediaEditor({ initial }: { initial: MultimediaInitial }) {
  const router = useRouter()
  const isNew = initial === null

  const [type, setType] = useState<"PHOTO_COLLECTION" | "VIDEO">(initial?.type ?? "PHOTO_COLLECTION")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(!isNew)

  const [title, setTitle] = useState(initial?.title ?? "")
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? "")
  const [titleZh, setTitleZh] = useState(initial?.title_zh ?? "")
  const [titleAr, setTitleAr] = useState(initial?.title_ar ?? "")

  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "")
  const [excerptEn, setExcerptEn] = useState(initial?.excerpt_en ?? "")
  const [excerptZh, setExcerptZh] = useState(initial?.excerpt_zh ?? "")
  const [excerptAr, setExcerptAr] = useState(initial?.excerpt_ar ?? "")

  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "")
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.imageUrls ?? [])

  const [youtubeUrlInput, setYoutubeUrlInput] = useState(
    initial?.youtubeId ? `https://youtu.be/${initial.youtubeId}` : "",
  )
  const [youtubeId, setYoutubeId] = useState(initial?.youtubeId ?? "")

  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true)
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false)
  const [publishedAt, setPublishedAt] = useState(toDatetimeLocal(initial?.publishedAt ?? null))

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  function onTitleChange(v: string) {
    setTitle(v)
    if (isNew && !slugTouched) setSlug(slugify(v))
  }

  function onSlugChange(v: string) {
    setSlugTouched(true)
    setSlug(slugify(v))
  }

  function onYoutubeChange(v: string) {
    setYoutubeUrlInput(v)
    const id = extractYouTubeId(v)
    setYoutubeId(id ?? "")
  }

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", "multimedia")
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (!res.ok) return null
    const json = (await res.json()) as { secure_url?: string }
    return json.secure_url ?? null
  }

  async function onCoverUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFile(file)
    if (url) setCoverImageUrl(url)
    e.target.value = ""
  }

  async function onGalleryUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const uploaded: string[] = []
    for (const f of files) {
      const url = await uploadFile(f)
      if (url) uploaded.push(url)
    }
    setImageUrls((prev) => [...prev, ...uploaded])
    e.target.value = ""
  }

  function removeGalleryImage(idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSave() {
    setSaving(true)
    setError(null)

    // Client-side validation
    if (!title.trim()) {
      setError("Tiêu đề (VI) là bắt buộc.")
      setSaving(false)
      return
    }
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      setError("Slug không hợp lệ (chỉ a-z, 0-9, '-').")
      setSaving(false)
      return
    }
    if (type === "VIDEO" && !youtubeId) {
      setError("VIDEO cần URL YouTube hợp lệ.")
      setSaving(false)
      return
    }

    const payload = {
      type,
      slug,
      title: title.trim(),
      title_en: titleEn.trim() || null,
      title_zh: titleZh.trim() || null,
      title_ar: titleAr.trim() || null,
      excerpt: excerpt.trim() || null,
      excerpt_en: excerptEn.trim() || null,
      excerpt_zh: excerptZh.trim() || null,
      excerpt_ar: excerptAr.trim() || null,
      coverImageUrl: coverImageUrl || null,
      imageUrls: type === "PHOTO_COLLECTION" ? imageUrls : [],
      youtubeId: type === "VIDEO" ? youtubeId : null,
      isPublished,
      isPinned,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
    }

    try {
      const url = isNew
        ? "/api/admin/multimedia"
        : `/api/admin/multimedia/${initial.id}`
      const method = isNew ? "POST" : "PATCH"
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? "Lỗi không xác định.")
      }
      router.push("/admin/multimedia")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được.")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (isNew) return
    if (!confirm("Xóa vĩnh viễn multimedia này? Không thể khôi phục.")) return
    const res = await fetch(`/api/admin/multimedia/${initial.id}`, { method: "DELETE" })
    if (res.ok) {
      router.push("/admin/multimedia")
      router.refresh()
    } else {
      setError("Xóa thất bại.")
    }
  }

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNew ? "Tạo multimedia mới" : "Chỉnh sửa multimedia"}
        </h1>
        <Link
          href="/admin/multimedia"
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

      {/* Type selector */}
      <section className="space-y-2">
        <label className="block text-sm font-semibold">Loại</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="PHOTO_COLLECTION"
              checked={type === "PHOTO_COLLECTION"}
              onChange={() => setType("PHOTO_COLLECTION")}
            />
            Bộ sưu tập ảnh
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="VIDEO"
              checked={type === "VIDEO"}
              onChange={() => setType("VIDEO")}
            />
            Video YouTube
          </label>
        </div>
      </section>

      {/* Title + i18n */}
      <section className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Tiêu đề (VI) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2"
            placeholder="Tiêu đề tiếng Việt"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <InputField label="Title (EN)" value={titleEn} onChange={setTitleEn} />
          <InputField label="Title (中文)" value={titleZh} onChange={setTitleZh} />
          <InputField label="Title (AR)" value={titleAr} onChange={setTitleAr} dir="rtl" />
        </div>
      </section>

      {/* Slug */}
      <section>
        <label className="mb-1 block text-sm font-semibold">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          className="w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm"
          placeholder="vi-du-slug"
        />
        <p className="mt-1 text-xs text-neutral-500">
          URL: <span className="font-mono">/multimedia/{slug || "..."}</span>
        </p>
      </section>

      {/* Excerpt + i18n */}
      <section className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-semibold">Tóm tắt (VI)</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full rounded border border-neutral-300 px-3 py-2"
            placeholder="Tóm tắt ngắn (hiển thị trên card)."
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <TextareaField label="Excerpt (EN)" value={excerptEn} onChange={setExcerptEn} />
          <TextareaField label="Excerpt (中文)" value={excerptZh} onChange={setExcerptZh} />
          <TextareaField label="Excerpt (AR)" value={excerptAr} onChange={setExcerptAr} dir="rtl" />
        </div>
      </section>

      {/* Cover image */}
      <section>
        <label className="mb-2 block text-sm font-semibold">Ảnh đại diện</label>
        <div className="flex items-start gap-4">
          {coverImageUrl ? (
            <div className="relative h-32 w-52 overflow-hidden border border-neutral-200 bg-neutral-100">
              <Image src={coverImageUrl} alt="Cover" fill className="object-cover" sizes="208px" />
            </div>
          ) : (
            <div className="flex h-32 w-52 items-center justify-center border border-dashed border-neutral-300 text-xs text-neutral-400">
              Chưa có ảnh
            </div>
          )}
          <div className="space-y-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={onCoverUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              Tải ảnh lên
            </button>
            {coverImageUrl && (
              <button
                type="button"
                onClick={() => setCoverImageUrl("")}
                className="block text-xs text-red-600 hover:underline"
              >
                Xóa ảnh
              </button>
            )}
          </div>
        </div>
        {type === "VIDEO" && !coverImageUrl && youtubeId && (
          <p className="mt-2 text-xs text-neutral-500">
            Để trống sẽ tự dùng thumbnail YouTube{" "}
            <span className="font-mono">img.youtube.com/vi/{youtubeId}/maxresdefault.jpg</span>
          </p>
        )}
      </section>

      {/* Type-specific: PHOTO_COLLECTION gallery OR VIDEO url */}
      {type === "PHOTO_COLLECTION" && (
        <section>
          <label className="mb-2 block text-sm font-semibold">
            Ảnh trong bộ sưu tập ({imageUrls.length})
          </label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {imageUrls.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="group relative aspect-square overflow-hidden border border-neutral-200 bg-neutral-100"
              >
                <Image src={url} alt="" fill className="object-cover" sizes="160px" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute top-1 right-1 hidden rounded-full bg-red-600 px-2 py-0.5 text-xs text-white group-hover:block"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex aspect-square items-center justify-center border-2 border-dashed border-neutral-300 text-3xl text-neutral-400 hover:border-brand-500 hover:text-brand-500"
            >
              +
            </button>
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onGalleryUpload}
            className="hidden"
          />
        </section>
      )}

      {type === "VIDEO" && (
        <section>
          <label className="mb-1 block text-sm font-semibold">
            URL YouTube <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={youtubeUrlInput}
            onChange={(e) => onYoutubeChange(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm"
            placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
          />
          {youtubeId ? (
            <p className="mt-1 text-xs text-green-700">
              ✓ Đã nhận diện videoId: <span className="font-mono">{youtubeId}</span>
            </p>
          ) : youtubeUrlInput ? (
            <p className="mt-1 text-xs text-red-600">
              Không phân tích được videoId từ URL này.
            </p>
          ) : null}
        </section>
      )}

      {/* Publication */}
      <section className="grid gap-3 border-t border-neutral-200 pt-4 sm:grid-cols-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <span className="text-sm">Đã xuất bản</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
          />
          <span className="text-sm">Ghim lên đầu</span>
        </label>
        <div>
          <label className="mb-1 block text-xs font-semibold">Ngày xuất bản</label>
          <input
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
        {!isNew ? (
          <button
            type="button"
            onClick={onDelete}
            className="text-sm text-red-600 hover:underline"
          >
            Xóa
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Link
            href="/admin/multimedia"
            className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Hủy
          </Link>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {saving ? "Đang lưu…" : isNew ? "Tạo mới" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  dir,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  dir?: "rtl" | "ltr"
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-neutral-600">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
      />
    </div>
  )
}

function TextareaField({
  label,
  value,
  onChange,
  dir,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  dir?: "rtl" | "ltr"
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-neutral-600">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        rows={3}
        className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
      />
    </div>
  )
}
