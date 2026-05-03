"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Upload, X } from "lucide-react"

/** Upload chứng từ → Cloudinary thu-chi/{MM-YYYY}/. Trả về URL qua onChange. */
export function ReceiptUpload({
  value,
  onChange,
}: {
  value: string | null
  onChange: (url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "thu-chi")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? "Upload thất bại")
      }
      const data = (await res.json()) as { secure_url: string }
      onChange(data.secure_url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload thất bại")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative inline-block">
          <a href={value} target="_blank" rel="noreferrer" className="block">
            <Image
              src={value}
              alt="Chứng từ"
              width={200}
              height={200}
              className="rounded-lg border border-brand-200 object-cover"
            />
          </a>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
            title="Xóa ảnh"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-brand-500">Click ảnh để xem kích thước đầy đủ</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-brand-300 px-4 py-3 text-sm text-brand-600 hover:border-brand-500 hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Đang upload..." : "Tải ảnh chứng từ (UNC, hóa đơn...)"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
