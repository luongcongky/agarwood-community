"use client"

import { useState } from "react"
import Image from "next/image"
import { Upload, X, Plus } from "lucide-react"

export type UploadSub = "logo" | "avatar" | "store" | "team" | "board" | "other"

interface SingleProps {
  multi?: false
  value: string
  onChange: (url: string) => void
  sub?: UploadSub
  label?: string
}

interface MultiProps {
  multi: true
  value: string[]
  onChange: (urls: string[]) => void
  sub?: UploadSub
  maxFiles?: number
  label?: string
}

type Props = SingleProps | MultiProps

async function uploadOne(file: File, sub: UploadSub): Promise<string> {
  if (file.size > 3 * 1024 * 1024) throw new Error("File quá lớn (tối đa 3MB)")
  const fd = new FormData()
  fd.append("file", file)
  fd.append("sub", sub)
  const res = await fetch("/api/khao-sat/upload-logo", { method: "POST", body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Upload thất bại")
  return data.url
}

export function ImageUpload(props: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const sub = props.sub ?? "other"

  async function handleFiles(files: FileList) {
    setError("")
    setUploading(true)
    try {
      if (props.multi) {
        const max = props.maxFiles ?? 5
        const room = max - props.value.length
        if (room <= 0) {
          setError(`Tối đa ${max} ảnh`)
          return
        }
        const toUpload = Array.from(files).slice(0, room)
        const urls: string[] = []
        for (const f of toUpload) {
          urls.push(await uploadOne(f, sub))
        }
        props.onChange([...props.value, ...urls])
      } else {
        const url = await uploadOne(files[0], sub)
        props.onChange(url)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  // ─── Single mode ───
  if (!props.multi) {
    if (props.value) {
      return (
        <div className="flex items-start gap-3">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-brand-200 bg-brand-50">
            <Image src={props.value} alt="" fill className="object-contain" sizes="96px" />
          </div>
          <button type="button" onClick={() => props.onChange("")} className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline">
            <X className="w-4 h-4" /> Xóa
          </button>
        </div>
      )
    }
    return (
      <div>
        <label className="inline-flex items-center gap-2 rounded-md border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-sm text-brand-700 hover:border-brand-500 cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? "Đang tải..." : props.label ?? "Chọn ảnh"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files; if (f && f.length) handleFiles(f) }}
            disabled={uploading}
          />
        </label>
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </div>
    )
  }

  // ─── Multi mode ───
  const max = props.maxFiles ?? 5
  const canAdd = props.value.length < max
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {props.value.map((url, idx) => (
          <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-brand-200 bg-brand-50">
            <Image src={url} alt="" fill className="object-cover" sizes="96px" />
            <button
              type="button"
              onClick={() => props.onChange(props.value.filter((_, i) => i !== idx))}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Xóa ảnh"
            >
              ×
            </button>
          </div>
        ))}
        {canAdd && (
          <label className="flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-brand-300 bg-brand-50 text-brand-500 hover:border-brand-500 hover:text-brand-700 cursor-pointer">
            <Plus className="w-5 h-5" />
            <span className="text-[10px] mt-1">{uploading ? "Đang tải…" : `Thêm (${props.value.length}/${max})`}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { const f = e.target.files; if (f && f.length) handleFiles(f) }}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
      <p className="text-xs text-brand-500 mt-2">Hỗ trợ JPG/PNG, tối đa 3MB/ảnh, {max} ảnh.</p>
    </div>
  )
}
