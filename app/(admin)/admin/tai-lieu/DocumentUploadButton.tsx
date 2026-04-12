"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { value: "CONG_VAN_DEN", label: "Công văn đến" },
  { value: "CONG_VAN_DI", label: "Công văn đi" },
  { value: "BIEN_BAN_HOP", label: "Biên bản họp" },
  { value: "QUYET_DINH", label: "Quyết định" },
  { value: "HOP_DONG", label: "Hợp đồng" },
]

export function DocumentUploadButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUploading(true)
    setError("")
    setProgress(10)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      setProgress(30)
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        body: formData,
      })
      setProgress(80)

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Upload thất bại")
        return
      }

      setProgress(100)
      setOpen(false)
      form.reset()
      router.refresh()
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.")
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const inputClass = "w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-colors"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
      >
        + Tải lên tài liệu
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-900">Tải lên tài liệu</h2>
              <button onClick={() => setOpen(false)} className="text-brand-400 hover:text-brand-700 text-xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">Tiêu đề *</label>
                <input type="text" name="title" required className={inputClass} placeholder="Tên tài liệu" />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">Danh mục *</label>
                <select name="category" required className={inputClass}>
                  <option value="">-- Chọn danh mục --</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-800 mb-1">Số hiệu</label>
                  <input type="text" name="documentNumber" className={inputClass} placeholder="CV-2026-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-800 mb-1">Ngày ban hành</label>
                  <input type="date" name="issuedDate" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">Mô tả</label>
                <textarea name="description" rows={2} className={cn(inputClass, "resize-none")} placeholder="Mô tả ngắn về tài liệu..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">File tài liệu * (PDF, DOC, DOCX — tối đa 20MB)</label>
                <input type="file" name="file" required accept=".pdf,.doc,.docx" className="text-sm text-brand-600" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" name="isPublic" value="true" id="isPublic" className="rounded accent-brand-600" />
                <label htmlFor="isPublic" className="text-sm text-brand-800">Cho phép hội viên xem</label>
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="w-full bg-brand-100 rounded-full h-2">
                  <div className="bg-brand-700 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors disabled:opacity-60"
                >
                  {uploading ? `Đang tải lên (${progress}%)...` : "Tải lên"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
