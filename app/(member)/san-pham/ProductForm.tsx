"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { PRODUCT_CATEGORIES, AGARWOOD_REGIONS } from "@/lib/constants/agarwood"
import { createProduct, updateProduct } from "./_actions"
import { RichTextEditor, type RichTextEditorHandle } from "@/components/editor/RichTextEditor"
import { MultiLangInput } from "@/components/ui/multi-lang-input"

type ProductData = {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  priceRange: string | null
  imageUrls: string[]
  isPublished: boolean
}

const inputClass = "w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-colors"
const selectClass = "w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-colors"

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function ProductForm({ product, companySlug }: { product?: ProductData; companySlug?: string }) {
  const router = useRouter()
  const isEdit = !!product
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  const p = product as unknown as Record<string, unknown> | undefined
  const [name, setName] = useState(product?.name ?? "")
  const [name_en, setNameEn] = useState((p?.name_en as string) ?? "")
  const [name_zh, setNameZh] = useState((p?.name_zh as string) ?? "")
  const [name_ar, setNameAr] = useState((p?.name_ar as string) ?? "")
  const [slug, setSlug] = useState(product?.slug ?? "")
  const descriptionRef = useRef<RichTextEditorHandle>(null)
  const [description_en, setDescriptionEn] = useState((p?.description_en as string) ?? "")
  const [description_zh, setDescriptionZh] = useState((p?.description_zh as string) ?? "")
  const [description_ar, setDescriptionAr] = useState((p?.description_ar as string) ?? "")
  const [category, setCategory] = useState(product?.category ?? "")
  const [category_en, setCategoryEn] = useState((p?.category_en as string) ?? "")
  const [category_zh, setCategoryZh] = useState((p?.category_zh as string) ?? "")
  const [category_ar, setCategoryAr] = useState((p?.category_ar as string) ?? "")
  const [priceRange, setPriceRange] = useState(product?.priceRange ?? "")
  const [imageUrls, setImageUrls] = useState<string[]>(product?.imageUrls ?? [])
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? true)
  const [slugEdited, setSlugEdited] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  async function handleImageUpload(files: FileList) {
    if (imageUrls.length + files.length > 10) {
      setMsg({ type: "error", text: "Tối đa 10 ảnh" })
      return
    }
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "san-pham")
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (res.ok) {
          const data = await res.json()
          setImageUrls((prev) => [...prev, data.secure_url])
        }
      }
    } catch {
      setMsg({ type: "error", text: "Upload ảnh thất bại" })
    } finally {
      setUploading(false)
    }
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    await descriptionRef.current?.processImages()
    const description = descriptionRef.current?.getHTML() ?? ""
    const data = {
      name, name_en: name_en || null, name_zh: name_zh || null, name_ar: name_ar || null,
      slug, description,
      description_en: description_en || null, description_zh: description_zh || null, description_ar: description_ar || null,
      category, category_en: category_en || null, category_zh: category_zh || null, category_ar: category_ar || null,
      priceRange, imageUrls, isPublished,
    }

    try {
      const result = isEdit
        ? await updateProduct(product!.id, data)
        : await createProduct(data)

      if (result.error) {
        setMsg({ type: "error", text: result.error })
      } else {
        router.push(`/san-pham/${result.slug}`)
        router.refresh()
      }
    } catch {
      setMsg({ type: "error", text: "Có lỗi xảy ra" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {msg && (
        <div className={cn(
          "rounded-lg border px-4 py-3 text-sm",
          msg.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700",
        )}>
          {msg.text}
        </div>
      )}

      {/* ── Section 1: Thong tin co ban ─────────────────────────────── */}
      <section className="bg-white rounded-xl border border-brand-200 p-6 space-y-4">
        <h2 className="font-semibold text-brand-900">Thông tin cơ bản</h2>

        <MultiLangInput
          name="name"
          label="Tên sản phẩm *"
          values={{ vi: name, en: name_en, zh: name_zh, ar: name_ar }}
          onChange={(key, value) => {
            if (key === "name") handleNameChange(value)
            else if (key === "name_en") setNameEn(value)
            else if (key === "name_zh") setNameZh(value)
            else if (key === "name_ar") setNameAr(value)
          }}
          placeholder="Tên sản phẩm"
          required
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-800">Slug (URL)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
            className={inputClass}
            pattern="^[a-z0-9-]+$"
          />
          <p className="text-xs text-brand-400">URL: /san-pham/{slug || "..."}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-800">Danh mục *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass} required>
              <option value="">-- Chọn danh mục --</option>
              {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-800">Mức giá</label>
            <input type="text" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className={inputClass} placeholder='Ví dụ: "500k-2tr" hoặc "Liên hệ"' />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-800">Mô tả chi tiết</label>
          <RichTextEditor
            ref={descriptionRef}
            initialContent={product?.description ?? ""}
            minHeight={200}
            uploadFolder="san-pham"
          />
        </div>

        {/* i18n translations */}
        <details className="rounded-lg border border-brand-200 bg-brand-50/50">
          <summary className="px-4 py-3 cursor-pointer text-xs font-semibold text-brand-700 hover:bg-brand-100 rounded-lg">
            🌐 Bản dịch (EN / 中文) — không bắt buộc
            {(name_en || name_zh || description_en || description_zh || category_en || category_zh) && (
              <span className="ml-2 text-xs font-normal text-emerald-600">Đã có bản dịch</span>
            )}
          </summary>
          <div className="px-4 pb-4 space-y-3">
            <p className="text-[11px] text-brand-500">Nếu để trống, trang sẽ hiển thị nội dung tiếng Việt.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-brand-700 mb-1">🇬🇧 Danh mục (EN)</label>
                <input type="text" value={category_en} onChange={(e) => setCategoryEn(e.target.value)} placeholder="e.g. Natural Agarwood" className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-brand-700 mb-1">🇨🇳 Danh mục (中文)</label>
                <input type="text" value={category_zh} onChange={(e) => setCategoryZh(e.target.value)} placeholder="例如：天然沉香" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-brand-700 mb-1">🇬🇧 Mô tả (EN)</label>
                <textarea value={description_en} onChange={(e) => setDescriptionEn(e.target.value)} rows={5} className={cn(inputClass, "font-mono resize-y")} placeholder="English description (HTML)..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-brand-700 mb-1">🇨🇳 Mô tả (中文)</label>
                <textarea value={description_zh} onChange={(e) => setDescriptionZh(e.target.value)} rows={5} className={cn(inputClass, "font-mono resize-y")} placeholder="中文描述（HTML）..." />
              </div>
            </div>
          </div>
        </details>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded accent-brand-600"
          />
          <label htmlFor="isPublished" className="text-sm text-brand-800">Công khai sản phẩm</label>
        </div>
      </section>

      {/* ── Section 2: Hình ảnh ─────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-brand-200 p-6 space-y-4">
        <h2 className="font-semibold text-brand-900">Hình ảnh ({imageUrls.length}/10)</h2>
        <p className="text-xs text-brand-400">Nên chụp ảnh dưới ánh sáng tự nhiên để thể hiện đúng màu sắc và vân gỗ. Ảnh đầu tiên là ảnh đại diện.</p>

        {/* Image grid */}
        {imageUrls.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg border border-brand-200 overflow-hidden group">
                <Image src={url} alt={`Ảnh ${i + 1}`} fill className="object-cover" sizes="(max-width: 640px) 25vw, 20vw" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-brand-700 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Đại diện</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => { if (e.target.files) handleImageUpload(e.target.files) }}
            className="text-sm text-brand-600"
            disabled={uploading || imageUrls.length >= 10}
          />
          {uploading && <p className="text-xs text-brand-400 mt-1">Đang tải lên...</p>}
        </div>
      </section>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors disabled:opacity-60"
        >
          {loading ? "Đang lưu..." : isEdit ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}
        </button>
        <Link
          href={companySlug ? `/doanh-nghiep/${companySlug}` : "/san-pham-doanh-nghiep"}
          className="rounded-lg border border-brand-300 px-6 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
        >
          Huỷ
        </Link>
      </div>
    </form>
  )
}
