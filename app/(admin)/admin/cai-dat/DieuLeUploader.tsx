"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

type Props = {
  /** Drive file ID hiện tại (nếu có) */
  currentFileId: string | null
  /** Tên file hiện tại */
  currentFileName: string | null
  /** Kích thước file hiện tại (bytes) */
  currentFileSize: string | null
  /** Timestamp ISO khi upload */
  currentUploadedAt: string | null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DieuLeUploader({
  currentFileId,
  currentFileName,
  currentFileSize,
  currentUploadedAt,
}: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasCurrent = !!currentFileId
  const fileSizeNum = currentFileSize ? Number(currentFileSize) : 0

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(false)

    // Client-side validation
    if (file.type !== "application/pdf") {
      setError("Chỉ chấp nhận file PDF")
      e.target.value = ""
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File tối đa 20MB")
      e.target.value = ""
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/dieu-le/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Upload thất bại")
        return
      }

      setSuccess(true)
      router.refresh()
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDelete() {
    if (!confirm("Xóa vĩnh viễn file Điều lệ hiện tại? Trang /dieu-le sẽ không còn nút download.")) return

    setDeleting(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch("/api/admin/dieu-le/upload", { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Xóa thất bại")
        return
      }

      router.refresh()
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-900">
          Điều lệ Hội (file PDF chính thức)
        </h2>
        <p className="text-xs text-brand-400 mt-0.5">
          Upload file PDF điều lệ để hiển thị nút &quot;Tải xuống&quot; trên trang{" "}
          <code className="text-brand-700">/dieu-le</code>. File lưu trên Google
          Drive của Hội.
        </p>
      </div>

      {/* Current file info */}
      {hasCurrent ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900 truncate">
                {currentFileName}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {fileSizeNum > 0 && formatBytes(fileSizeNum)}
                {currentUploadedAt && (
                  <>
                    {" · "}Upload lúc{" "}
                    {new Date(currentUploadedAt).toLocaleString("vi-VN")}
                  </>
                )}
              </p>
              <p className="text-xs text-emerald-600 mt-1 font-mono">
                Drive ID: {currentFileId}
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <a
              href={`https://drive.google.com/file/d/${currentFileId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-white border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              👁 Xem trên Drive
            </a>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-md bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800 disabled:opacity-50"
            >
              🔁 Upload phiên bản mới
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 ml-auto"
            >
              {deleting ? "Đang xóa..." : "🗑 Xóa"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-lg border-2 border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 hover:border-brand-400 transition-colors p-6 flex flex-col items-center justify-center text-brand-500 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="size-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-sm font-medium">Đang upload lên Google Drive...</span>
            </>
          ) : (
            <>
              <span className="text-3xl mb-2">📤</span>
              <span className="text-sm font-medium text-brand-700">
                Click để upload file PDF
              </span>
              <span className="text-xs text-brand-400 mt-1">Tối đa 20MB · Chỉ PDF</span>
            </>
          )}
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Status messages */}
      {uploading && hasCurrent && (
        <div className="rounded-lg bg-brand-50 border border-brand-200 p-2 text-xs text-brand-700 flex items-center gap-2">
          <div className="size-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Đang upload lên Google Drive...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          ✓ Upload thành công. Trang /dieu-le đã được cập nhật.
        </div>
      )}
    </div>
  )
}
