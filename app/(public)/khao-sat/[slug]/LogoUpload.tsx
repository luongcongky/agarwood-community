"use client"

import { useState } from "react"
import Image from "next/image"
import { Upload, X } from "lucide-react"

interface Props {
  value: string
  onChange: (url: string) => void
}

export function LogoUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  async function handleFile(file: File) {
    setError("")
    if (file.size > 3 * 1024 * 1024) {
      setError("File quá lớn (tối đa 3MB)")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/khao-sat/upload-logo", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload thất bại")
      onChange(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  if (value) {
    return (
      <div className="flex items-start gap-3">
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-brand-200 bg-brand-50">
          <Image src={value} alt="Logo" fill className="object-contain" sizes="96px" />
        </div>
        <button
          type="button"
          onClick={() => onChange("")}
          className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
        >
          <X className="w-4 h-4" /> Xóa
        </button>
      </div>
    )
  }

  return (
    <div>
      <label className="inline-flex items-center gap-2 rounded-md border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-sm text-brand-700 hover:border-brand-500 cursor-pointer">
        <Upload className="w-4 h-4" />
        {uploading ? "Đang tải..." : "Chọn ảnh logo"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
          disabled={uploading}
        />
      </label>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  )
}
