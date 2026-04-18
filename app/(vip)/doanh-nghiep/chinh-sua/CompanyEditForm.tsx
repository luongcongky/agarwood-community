"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { EMPLOYEE_COUNTS, PROVINCES } from "@/lib/constants/agarwood"
import { updateCompany } from "./_actions"
import { RichTextEditor, type RichTextEditorHandle } from "@/components/editor/RichTextEditor"
import { MultiLangInput } from "@/components/ui/multi-lang-input"
import { CoverImageCropper } from "@/components/ui/CoverImageCropper"

type Company = {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  website: string | null
  phone: string | null
  address: string | null
  foundedYear: number | null
  employeeCount: string | null
  businessLicense: string | null
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

export function CompanyEditForm({ company }: { company: Company }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form state
  const c = company as unknown as Record<string, unknown>
  const [name, setName] = useState(company.name)
  const [name_en, setNameEn] = useState((c.name_en as string) ?? "")
  const [name_zh, setNameZh] = useState((c.name_zh as string) ?? "")
  const [slug, setSlug] = useState(company.slug)
  const descriptionRef = useRef<RichTextEditorHandle>(null)
  const [foundedYear, setFoundedYear] = useState(company.foundedYear?.toString() ?? "")
  const [employeeCount, setEmployeeCount] = useState(company.employeeCount ?? "")
  const [businessLicense, setBusinessLicense] = useState(company.businessLicense ?? "")
  const [address, setAddress] = useState(company.address ?? "")
  const [address_en, setAddressEn] = useState((c.address_en as string) ?? "")
  const [address_zh, setAddressZh] = useState((c.address_zh as string) ?? "")
  const [description_en, setDescriptionEn] = useState((c.description_en as string) ?? "")
  const [description_zh, setDescriptionZh] = useState((c.description_zh as string) ?? "")
  const [phone, setPhone] = useState(company.phone ?? "")
  const [website, setWebsite] = useState(company.website ?? "")
  const [logoUrl, setLogoUrl] = useState(company.logoUrl ?? "")
  const [coverImageUrl, setCoverImageUrl] = useState(company.coverImageUrl ?? "")
  const [coverPreview, setCoverPreview] = useState(company.coverImageUrl ?? "")
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [slugEdited, setSlugEdited] = useState(false)
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null)

  // Cleanup blob preview URL on unmount
  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCoverSelect(file: File) {
    // Open cropper with blob URL of the raw file
    const blobUrl = URL.createObjectURL(file)
    setCropSrc(blobUrl)
  }

  async function handleCropDone(croppedBlob: Blob) {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    const croppedFile = new File([croppedBlob], "cover.jpg", { type: "image/jpeg" })
    // Show instant preview from the cropped blob while the upload runs
    if (coverPreview && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverPreview(URL.createObjectURL(croppedBlob))
    await handleUpload(croppedFile, "cover")
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    if (coverInputRef.current) coverInputRef.current.value = ""
  }

  function handleCoverRemove() {
    if (coverPreview && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverPreview("")
    setCoverImageUrl("")
    if (coverInputRef.current) coverInputRef.current.value = ""
  }

  function handleNameChange(val: string) {
    setName(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  async function handleUpload(file: File, target: "logo" | "cover") {
    setUploading(target)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "doanh-nghiep")
      // Logo nhỏ (render ≤ 200px), cover rộng (hero full-width)
      formData.append("maxWidth", target === "logo" ? "600" : "1920")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) { setMsg({ type: "error", text: "Upload that bai" }); return }
      const data = await res.json()
      if (target === "logo") setLogoUrl(data.secure_url)
      else {
        setCoverImageUrl(data.secure_url)
        // Replace the local blob preview with the real Cloudinary URL so the
        // <Image> stays valid after the blob is revoked on unmount.
        if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview)
        setCoverPreview(data.secure_url)
      }
    } catch {
      setMsg({ type: "error", text: "Upload that bai" })
    } finally {
      setUploading(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      await descriptionRef.current?.processImages()
      const description = descriptionRef.current?.getHTML() ?? ""
      const result = await updateCompany({
        name,
        name_en: name_en || null,
        name_zh: name_zh || null,
        slug,
        description,
        description_en: description_en || null,
        description_zh: description_zh || null,
        foundedYear: foundedYear ? Number(foundedYear) : null,
        employeeCount,
        businessLicense,
        address,
        address_en: address_en || null,
        address_zh: address_zh || null,
        phone,
        website,
        logoUrl,
        coverImageUrl,
      })
      if (result.error) {
        setMsg({ type: "error", text: result.error })
      } else {
        setMsg({ type: "success", text: "Da cap nhat thong tin doanh nghiep." })
        router.refresh()
      }
    } catch {
      setMsg({ type: "error", text: "Co loi xay ra." })
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
          label="Tên công ty *"
          values={{ vi: name, en: name_en, zh: name_zh }}
          onChange={(key, value) => {
            if (key === "name") handleNameChange(value)
            else if (key === "name_en") setNameEn(value)
            else if (key === "name_zh") setNameZh(value)
          }}
          placeholder="Tên doanh nghiệp"
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
          {slug !== company.slug && (
            <p className="text-xs text-yellow-700">URL sẽ đổi thành /doanh-nghiep/{slug}. URL cũ sẽ không còn hoạt động.</p>
          )}
          <p className="text-xs text-brand-400">Chỉ chứa a-z, 0-9, dấu gạch ngang</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-800">Năm thành lập</label>
            <input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} min={1900} max={2030} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-800">Quy mô nhân sự</label>
            <select value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} className={selectClass}>
              <option value="">-- Chọn --</option>
              {EMPLOYEE_COUNTS.map((c) => <option key={c} value={c}>{c} người</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-800">Số ĐKKD</label>
          <input type="text" value={businessLicense} onChange={(e) => setBusinessLicense(e.target.value)} className={inputClass} placeholder="0123456789" />
        </div>
      </section>

      {/* ── Section 2: Mo ta & Lien he ──────────────────────────────── */}
      <section className="bg-white rounded-xl border border-brand-200 p-6 space-y-4">
        <h2 className="font-semibold text-brand-900">Mô tả & Liên hệ</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-800">Mô tả công ty</label>
          <RichTextEditor
            ref={descriptionRef}
            initialContent={company.description ?? ""}
            minHeight={200}
            uploadFolder="doanh-nghiep"
          />
        </div>

        {/* Description translations */}
        <details className="rounded-lg border border-brand-200 bg-brand-50/50">
          <summary className="px-4 py-3 cursor-pointer text-xs font-semibold text-brand-700 hover:bg-brand-100 rounded-lg">
            🌐 Mô tả bản dịch (EN / 中文)
            {(description_en || description_zh) && (
              <span className="ml-2 text-xs font-normal text-emerald-600">
                {[description_en && "EN", description_zh && "中文"].filter(Boolean).join(" + ")} đã có
              </span>
            )}
          </summary>
          <div className="px-4 pb-4 space-y-3">
            <p className="text-[11px] text-brand-500">Dán nội dung HTML đã dịch. Nếu để trống, hiển thị tiếng Việt.</p>
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">🇬🇧 Description (EN)</label>
              <textarea value={description_en} onChange={(e) => setDescriptionEn(e.target.value)} rows={6} className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm font-mono resize-y focus:border-brand-500 focus:outline-none" placeholder="English description..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">🇨🇳 Description (中文)</label>
              <textarea value={description_zh} onChange={(e) => setDescriptionZh(e.target.value)} rows={6} className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm font-mono resize-y focus:border-brand-500 focus:outline-none" placeholder="中文描述..." />
            </div>
          </div>
        </details>

        <MultiLangInput
          name="address"
          label="Địa chỉ"
          values={{ vi: address, en: address_en, zh: address_zh }}
          onChange={(key, value) => {
            if (key === "address") setAddress(value)
            else if (key === "address_en") setAddressEn(value)
            else if (key === "address_zh") setAddressZh(value)
          }}
          placeholder="123 Đường ABC, Quận XYZ"
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-800">SĐT liên hệ</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="0901234567" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-800">Website</label>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://..." />
          </div>
        </div>
      </section>

      {/* ── Section 3: Hinh anh ─────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-brand-200 p-6 space-y-4">
        <h2 className="font-semibold text-brand-900">Hình ảnh</h2>

        {/* Logo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-800">Logo (tỷ lệ 1:1, tối đa 2MB)</label>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl border border-brand-200 overflow-hidden bg-brand-50 flex items-center justify-center shrink-0">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="80px" />
              ) : (
                <span className="text-brand-300 text-2xl font-bold">{name[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "logo") }}
                className="text-sm text-brand-600"
                disabled={uploading === "logo"}
              />
              {uploading === "logo" && <p className="text-xs text-brand-400 mt-1">Đang tải lên...</p>}
            </div>
          </div>
        </div>

        {/* Cover — click to pick → crop → upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-800">
            Ảnh bìa (tỷ lệ 3:1, tối đa 5MB)
          </label>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleCoverSelect(f)
            }}
            disabled={uploading === "cover"}
          />
          {coverPreview ? (
            <div className="relative group w-full h-40 rounded-xl overflow-hidden border border-brand-200 bg-linear-to-br from-brand-700 to-brand-900">
              <Image
                src={coverPreview}
                alt="Cover preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                unoptimized={coverPreview.startsWith("blob:")}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-brand-800 shadow hover:bg-brand-50 transition-colors"
                >
                  Đổi ảnh
                </button>
                <button
                  type="button"
                  onClick={handleCoverRemove}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-red-700 transition-colors"
                >
                  Xóa
                </button>
              </div>
              {uploading === "cover" && (
                <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  Đang tải lên...
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading === "cover"}
              className="w-full h-32 rounded-xl border-2 border-dashed border-brand-300 hover:border-brand-500 transition-colors flex flex-col items-center justify-center gap-2 text-brand-400 hover:text-brand-600 disabled:opacity-50"
            >
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-xs font-medium">Chọn ảnh bìa</span>
            </button>
          )}

          {/* Crop modal — aspect 3:1 match the cover label */}
          {cropSrc && (
            <CoverImageCropper
              imageSrc={cropSrc}
              aspect={3 / 1}
              onCropDone={handleCropDone}
              onCancel={handleCropCancel}
            />
          )}
        </div>
      </section>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors disabled:opacity-60"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <Link
          href={`/doanh-nghiep/${company.slug}`}
          className="rounded-lg border border-brand-300 px-6 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
        >
          Xem trang công ty
        </Link>
      </div>
    </form>
  )
}
