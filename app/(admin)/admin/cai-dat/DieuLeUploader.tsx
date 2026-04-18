"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

type Props = {
  /** Locale for this uploader (vi/en/zh). Passed to upload API as query param. */
  locale: "vi" | "en" | "zh"
  /** Drive file ID hiện tại (nếu có) */
  currentFileId: string | null
  /** Tên file hiện tại */
  currentFileName: string | null
  /** Kích thước file hiện tại (bytes) */
  currentFileSize: string | null
  /** Timestamp ISO khi upload */
  currentUploadedAt: string | null
}

const LOCALE_LABEL: Record<"vi" | "en" | "zh", string> = {
  vi: "🇻🇳 Bản tiếng Việt (gốc pháp lý)",
  en: "🇬🇧 Bản tiếng Anh (công chứng)",
  zh: "🇨🇳 Bản tiếng Trung (công chứng)",
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type Mode = "upload" | "link"

export function DieuLeUploader({
  locale,
  currentFileId,
  currentFileName,
  currentFileSize,
  currentUploadedAt,
}: Props) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [mode, setMode] = useState<Mode>("upload")
  const [uploading, setUploading] = useState(false)
  const [linking, setLinking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [driveUrl, setDriveUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasCurrent = !!currentFileId
  const fileSizeNum = currentFileSize ? Number(currentFileSize) : 0
  const busy = uploading || linking || deleting

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(false)

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
      const res = await fetch(`/api/admin/dieu-le/upload?locale=${locale}`, {
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

  async function handleLinkExisting() {
    setError(null)
    setSuccess(false)
    if (!driveUrl.trim()) {
      setError("Vui lòng dán URL Google Drive")
      return
    }
    setLinking(true)
    try {
      const res = await fetch(`/api/admin/dieu-le/link-existing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveUrl: driveUrl.trim(), locale }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Liên kết thất bại")
        return
      }
      setSuccess(true)
      setDriveUrl("")
      router.refresh()
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.")
    } finally {
      setLinking(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Xóa liên kết Điều lệ (${locale.toUpperCase()}) hiện tại?`)) return
    setDeleting(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/admin/dieu-le/upload?locale=${locale}`, { method: "DELETE" })
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
        <h2 className="text-base font-bold text-brand-900">{LOCALE_LABEL[locale]}</h2>
        <p className="text-xs text-brand-400 mt-0.5">
          {locale === "vi"
            ? "Upload PDF bản tiếng Việt đã được Bộ Nội Vụ phê duyệt. Hiển thị mặc định trên /dieu-le."
            : locale === "en"
              ? "Upload bản dịch PDF tiếng Anh đã công chứng. Hiển thị tại /en/dieu-le. Nếu không có, fallback về bản VI."
              : "Upload bản dịch PDF tiếng Trung đã công chứng. Hiển thị tại /zh/dieu-le. Nếu không có, fallback về bản VI."}
        </p>
      </div>

      {/* Current file info */}
      {hasCurrent && (
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
                    {" · "}Liên kết lúc{" "}
                    {new Date(currentUploadedAt).toLocaleString("vi-VN")}
                  </>
                )}
              </p>
              <p className="text-xs text-emerald-600 mt-1 font-mono truncate">
                Drive ID: {currentFileId}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
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
              onClick={handleDelete}
              disabled={busy || readOnly}
              title={readOnly ? READ_ONLY_TOOLTIP : undefined}
              className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 ml-auto"
            >
              {deleting ? "Đang xóa..." : "🗑 Xóa liên kết"}
            </button>
          </div>
        </div>
      )}

      {/* Mode tabs — always visible so admin can replace with another URL or new upload */}
      <div className="flex gap-1 rounded-lg border border-brand-200 bg-brand-50/40 p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "upload"
              ? "bg-white text-brand-800 shadow-sm"
              : "text-brand-500 hover:text-brand-700"
          }`}
        >
          📤 Upload file mới
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "link"
              ? "bg-white text-brand-800 shadow-sm"
              : "text-brand-500 hover:text-brand-700"
          }`}
        >
          🔗 Dán URL Drive có sẵn
        </button>
      </div>

      {/* Mode: upload */}
      {mode === "upload" && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy || readOnly}
          title={readOnly ? READ_ONLY_TOOLTIP : undefined}
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
                {hasCurrent ? "Click để upload phiên bản mới" : "Click để upload file PDF"}
              </span>
              <span className="text-xs text-brand-400 mt-1">Tối đa 20MB · Chỉ PDF</span>
              {hasCurrent && (
                <span className="text-[11px] text-amber-600 mt-1">
                  File cũ trên Drive sẽ bị xóa
                </span>
              )}
            </>
          )}
        </button>
      )}

      {/* Mode: link existing Drive URL */}
      {mode === "link" && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-brand-700">
            URL Google Drive của file PDF
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              disabled={busy || readOnly}
              placeholder="https://drive.google.com/file/d/.../view"
              className="flex-1 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleLinkExisting}
              disabled={busy || readOnly || !driveUrl.trim()}
              title={readOnly ? READ_ONLY_TOOLTIP : undefined}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 whitespace-nowrap"
            >
              {linking ? "Đang liên kết..." : "Liên kết"}
            </button>
          </div>
          <p className="text-[11px] text-brand-400 leading-relaxed">
            Copy URL từ trang{" "}
            <a href="/admin/tai-lieu" className="underline text-brand-600">
              /admin/tai-lieu
            </a>{" "}
            (dùng nút &quot;Copy link Drive&quot; trên mỗi dòng) hoặc mở file trên Drive và copy URL.
            File phải là PDF và được chia sẻ với tài khoản Drive của Hội.
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={readOnly}
      />

      {/* Status messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          ✓ Đã cập nhật. Trang /{locale}/dieu-le đã được làm mới.
        </div>
      )}
    </div>
  )
}
