"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { EMPLOYEE_COUNTS, PROVINCES } from "@/lib/constants/agarwood"
import { updateCompany } from "./_actions"

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
  const [name, setName] = useState(company.name)
  const [slug, setSlug] = useState(company.slug)
  const [description, setDescription] = useState(company.description ?? "")
  const [foundedYear, setFoundedYear] = useState(company.foundedYear?.toString() ?? "")
  const [employeeCount, setEmployeeCount] = useState(company.employeeCount ?? "")
  const [businessLicense, setBusinessLicense] = useState(company.businessLicense ?? "")
  const [address, setAddress] = useState(company.address ?? "")
  const [phone, setPhone] = useState(company.phone ?? "")
  const [website, setWebsite] = useState(company.website ?? "")
  const [logoUrl, setLogoUrl] = useState(company.logoUrl ?? "")
  const [coverImageUrl, setCoverImageUrl] = useState(company.coverImageUrl ?? "")
  const [slugEdited, setSlugEdited] = useState(false)
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null)

  function handleNameChange(val: string) {
    setName(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  async function handleUpload(file: File, target: "logo" | "cover") {
    setUploading(target)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) { setMsg({ type: "error", text: "Upload that bai" }); return }
      const data = await res.json()
      if (target === "logo") setLogoUrl(data.secure_url)
      else setCoverImageUrl(data.secure_url)
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
      const result = await updateCompany({
        name,
        slug,
        description,
        foundedYear: foundedYear ? Number(foundedYear) : null,
        employeeCount,
        businessLicense,
        address,
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

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-800">Tên công ty *</label>
          <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} required />
        </div>

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
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={5}
            className={cn(inputClass, "resize-none")}
            placeholder="Giới thiệu về công ty, lịch sử phát triển, thế mạnh sản phẩm..."
          />
          <p className="text-xs text-brand-400">{description.length}/2000 ký tự</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-brand-800">Địa chỉ</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="123 Đường ABC, Quận XYZ" />
        </div>

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
            <div className="w-20 h-20 rounded-xl border border-brand-200 overflow-hidden bg-brand-50 flex items-center justify-center shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
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

        {/* Cover */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-800">Ảnh bìa (tỷ lệ 3:1, tối đa 5MB)</label>
          <div className="w-full h-32 rounded-xl border border-brand-200 overflow-hidden bg-gradient-to-br from-brand-700 to-brand-900">
            {coverImageUrl && <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "cover") }}
            className="text-sm text-brand-600"
            disabled={uploading === "cover"}
          />
          {uploading === "cover" && <p className="text-xs text-brand-400">Đang tải lên...</p>}
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
