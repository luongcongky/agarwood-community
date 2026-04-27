"use client"

import Image from "next/image"
import { useImperativeHandle, useRef, useState, forwardRef } from "react"
import { PRODUCT_CATEGORIES } from "@/lib/constants/agarwood"
import { RichTextEditor, type RichTextEditorHandle } from "@/components/editor/RichTextEditor"
import { MultiLangInput } from "@/components/ui/multi-lang-input"
import { slugify } from "@/lib/utils"

/** Payload gửi kèm body POST /api/admin/news khi category=PRODUCT.
 *  Server tạo Product + News trong cùng transaction. ownerId không gửi —
 *  derive từ Company.ownerId ở server (admin chỉ xác định DN, hội viên là
 *  chủ DN tự thành owner SP). */
export type ProductDraft = {
  name: string
  name_en: string | null
  name_zh: string | null
  name_ar: string | null
  slug: string
  description: string
  description_en: string | null
  description_zh: string | null
  description_ar: string | null
  category: string | null
  category_en: string | null
  category_zh: string | null
  category_ar: string | null
  priceRange: string | null
  imageUrls: string[]
}

export type ProductSidecarHandle = {
  /** Upload pending blob: ảnh trong description editor + return draft cuối. */
  collect: () => Promise<ProductDraft>
  /** Validate trước submit — return null nếu OK, hoặc message lỗi. */
  validate: () => string | null
}

const inputClass =
  "w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"

type Props = {
  /** Folder Cloudinary cho ảnh: tin-tuc/MM-YYYY (đồng bộ với cover news). */
  uploadFolder?: string
}

/**
 * Sidecar form cho admin tạo News PRODUCT — gộp toàn bộ field cần để tạo
 * Product mới (name/slug/category/price/images/description) bên trong News
 * editor.
 *
 * Phase 3.3 Q5 (2026-04, customer feedback): hội viên không tự đăng được
 * tin sản phẩm (chưa có quota / không vào feed) thì thuê admin đăng hộ.
 * Trước đây admin News PRODUCT phải pick existing Product → khách hàng
 * yêu cầu cho phép tạo SP mới luôn trong form này. Bỏ ProductPicker, luôn
 * tạo mới.
 */
export const ProductSidecar = forwardRef<ProductSidecarHandle, Props>(
  function ProductSidecar({ uploadFolder = "san-pham" }, ref) {
    const [name, setName] = useState("")
    const [name_en, setNameEn] = useState("")
    const [name_zh, setNameZh] = useState("")
    const [name_ar, setNameAr] = useState("")
    const [slug, setSlug] = useState("")
    const [slugEdited, setSlugEdited] = useState(false)
    const [category, setCategory] = useState("")
    const [category_en, setCategoryEn] = useState("")
    const [category_zh, setCategoryZh] = useState("")
    const [priceRange, setPriceRange] = useState("")
    const [imageUrls, setImageUrls] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const descriptionRef = useRef<RichTextEditorHandle>(null)
    const [description_en, setDescriptionEn] = useState("")
    const [description_zh, setDescriptionZh] = useState("")

    function handleNameChange(val: string) {
      setName(val)
      if (!slugEdited) setSlug(slugify(val))
    }

    async function handleImageUpload(files: FileList) {
      if (imageUrls.length + files.length > 10) {
        setUploadError("Tối đa 10 ảnh sản phẩm")
        return
      }
      setUploading(true)
      setUploadError(null)
      try {
        for (const file of Array.from(files)) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("folder", uploadFolder)
          const res = await fetch("/api/upload", { method: "POST", body: formData })
          if (!res.ok) throw new Error("upload-failed")
          const data = await res.json()
          setImageUrls((prev) => [...prev, data.secure_url])
        }
      } catch {
        setUploadError("Tải ảnh thất bại. Vui lòng thử lại.")
      } finally {
        setUploading(false)
      }
    }

    function removeImage(idx: number) {
      setImageUrls((prev) => prev.filter((_, i) => i !== idx))
    }

    useImperativeHandle(ref, () => ({
      validate() {
        if (!name.trim()) return "Tên sản phẩm là bắt buộc"
        if (!/^[a-z0-9-]+$/.test(slug)) return "Slug sản phẩm không hợp lệ (a-z, 0-9, -)"
        if (imageUrls.length === 0) return "Cần ít nhất 1 ảnh sản phẩm"
        return null
      },
      async collect() {
        await descriptionRef.current?.processImages()
        const description = descriptionRef.current?.getHTML() ?? ""
        return {
          name: name.trim(),
          name_en: name_en.trim() || null,
          name_zh: name_zh.trim() || null,
          name_ar: name_ar.trim() || null,
          slug,
          description,
          description_en: description_en.trim() || null,
          description_zh: description_zh.trim() || null,
          description_ar: null, // chưa expose UI cho ar
          category: category || null,
          category_en: category_en.trim() || null,
          category_zh: category_zh.trim() || null,
          category_ar: null,
          priceRange: priceRange.trim() || null,
          imageUrls,
        }
      },
    }))

    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50/40 p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-brand-900">Thông tin sản phẩm mới</h3>
          <p className="mt-0.5 text-[11px] text-brand-500 leading-snug">
            Hệ thống sẽ tạo SP gắn vào doanh nghiệp đã chọn ở trên. Chủ doanh
            nghiệp sẽ là chủ sản phẩm — không cần chỉ định riêng.
          </p>
        </div>

        <MultiLangInput
          name="product-name"
          label="Tên sản phẩm"
          values={{ vi: name, en: name_en, zh: name_zh, ar: name_ar }}
          onChange={(key, value) => {
            if (key === "product-name") handleNameChange(value)
            else if (key === "product-name_en") setNameEn(value)
            else if (key === "product-name_zh") setNameZh(value)
            else if (key === "product-name_ar") setNameAr(value)
          }}
          placeholder="Tên sản phẩm"
          required
        />

        <div>
          <label className="block text-xs font-medium text-brand-800 mb-1">
            Slug sản phẩm
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugEdited(true)
            }}
            className={`${inputClass} font-mono`}
            pattern="^[a-z0-9-]+$"
          />
          <p className="mt-1 text-[11px] text-brand-400">URL: /san-pham/{slug || "..."}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-brand-800 mb-1">Danh mục</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn danh mục --</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-800 mb-1">Mức giá</label>
            <input
              type="text"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              placeholder='Ví dụ: "500k-2tr" hoặc "Liên hệ"'
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-800 mb-1">Mô tả chi tiết</label>
          <RichTextEditor
            ref={descriptionRef}
            initialContent=""
            minHeight={160}
            uploadFolder={uploadFolder}
          />
        </div>

        <details className="rounded-lg border border-brand-200 bg-white">
          <summary className="px-3 py-2 cursor-pointer text-[11px] font-semibold text-brand-700 hover:bg-brand-50 rounded-lg">
            🌐 Bản dịch danh mục + mô tả (EN / 中文) — không bắt buộc
          </summary>
          <div className="px-3 pb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={category_en}
                onChange={(e) => setCategoryEn(e.target.value)}
                placeholder="Danh mục (EN)"
                className={inputClass}
              />
              <input
                type="text"
                value={category_zh}
                onChange={(e) => setCategoryZh(e.target.value)}
                placeholder="Danh mục (中文)"
                className={inputClass}
              />
            </div>
            <textarea
              value={description_en}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={3}
              placeholder="Mô tả (EN, HTML cho phép)"
              className={`${inputClass} resize-y`}
            />
            <textarea
              value={description_zh}
              onChange={(e) => setDescriptionZh(e.target.value)}
              rows={3}
              placeholder="Mô tả (中文, HTML cho phép)"
              className={`${inputClass} resize-y`}
            />
          </div>
        </details>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-brand-800">
            Ảnh sản phẩm * ({imageUrls.length}/10)
          </label>
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {imageUrls.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative aspect-square rounded-lg border border-brand-200 overflow-hidden group"
                >
                  <Image
                    src={url}
                    alt={`Ảnh ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-brand-700 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                      Đại diện
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Xoá ảnh"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) handleImageUpload(e.target.files)
            }}
            className="text-xs text-brand-600"
            disabled={uploading || imageUrls.length >= 10}
          />
          {uploading && <p className="text-xs text-brand-400">Đang tải lên...</p>}
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </div>
      </div>
    )
  },
)
