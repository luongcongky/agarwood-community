"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

export function UploadForm() {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const formRef = useRef<HTMLFormElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [category, setCategory] = useState<"DIEU_LE" | "QUY_CHE" | "GIAY_PHEP">("QUY_CHE")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setUploading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const res = await fetch("/api/admin/phap-ly", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Upload thất bại")
        return
      }
      setSuccess(true)
      formRef.current?.reset()
      router.refresh()
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-xl border bg-white p-6 shadow-sm space-y-4"
    >
      <h2 className="text-base font-bold text-brand-900">Upload văn bản mới</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-brand-700 mb-1">
            Phân loại <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            required
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="DIEU_LE">📜 Điều lệ Hội</option>
            <option value="QUY_CHE">📋 Quy chế nội bộ</option>
            <option value="GIAY_PHEP">🏛️ Giấy phép</option>
          </select>
        </div>

        {/* Sort order */}
        <div>
          <label className="block text-xs font-medium text-brand-700 mb-1">
            Thứ tự hiển thị
          </label>
          <input
            type="number"
            name="sortOrder"
            defaultValue={0}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <p className="mt-1 text-[11px] text-brand-400">Số nhỏ = ưu tiên cao</p>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-brand-700 mb-1">
          Tiêu đề <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          placeholder="Ví dụ: Quy chế Hội viên của Hội Trầm hương Việt Nam"
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Document number */}
        <div>
          <label className="block text-xs font-medium text-brand-700 mb-1">
            Số văn bản
          </label>
          <input
            type="text"
            name="documentNumber"
            placeholder="56/QĐ-VAWA"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        {/* Issued date */}
        <div>
          <label className="block text-xs font-medium text-brand-700 mb-1">
            Ngày ban hành
          </label>
          <input
            type="date"
            name="issuedDate"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        {/* Issuer */}
        <div>
          <label className="block text-xs font-medium text-brand-700 mb-1">
            Cơ quan ban hành
          </label>
          <input
            type="text"
            name="issuer"
            placeholder="Chủ tịch VAWA / Bộ Nội vụ"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-brand-700 mb-1">
          Mô tả ngắn
        </label>
        <textarea
          name="description"
          rows={2}
          placeholder="Tóm tắt nội dung văn bản..."
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
        />
      </div>

      {/* i18n fields */}
      <details className="rounded-lg border border-brand-200 bg-brand-50/50">
        <summary className="px-4 py-3 cursor-pointer text-xs font-semibold text-brand-700 hover:bg-brand-100 rounded-lg">
          🌐 Bản dịch (EN / 中文) — không bắt buộc
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[11px] text-brand-500">Nếu để trống, trang sẽ hiển thị nội dung tiếng Việt.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-brand-700 mb-1">🇬🇧 Tiêu đề (EN)</label>
              <input type="text" name="title_en" placeholder="English title" className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-brand-700 mb-1">🇨🇳 Tiêu đề (中文)</label>
              <input type="text" name="title_zh" placeholder="中文标题" className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-brand-700 mb-1">🇬🇧 Mô tả (EN)</label>
              <textarea name="description_en" rows={2} placeholder="English description" className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-brand-700 mb-1">🇨🇳 Mô tả (中文)</label>
              <textarea name="description_zh" rows={2} placeholder="中文描述" className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none" />
            </div>
          </div>
        </div>
      </details>

      {/* File */}
      <div>
        <label className="block text-xs font-medium text-brand-700 mb-1">
          File PDF <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          name="file"
          accept="application/pdf"
          required
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm bg-white file:mr-3 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-brand-800"
        />
        <p className="mt-1 text-[11px] text-brand-400">Tối đa 20MB, chỉ file PDF</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          ✓ Upload thành công
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || readOnly}
        title={readOnly ? READ_ONLY_TOOLTIP : undefined}
        className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 transition-colors"
      >
        {uploading ? "Đang upload..." : "Upload văn bản"}
      </button>
    </form>
  )
}
