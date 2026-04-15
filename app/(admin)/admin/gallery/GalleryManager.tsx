"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

type Item = {
  id: string
  imageUrl: string
  label: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function GalleryManager({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [items, setItems] = useState(initialItems)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  function refresh() {
    fetch("/api/admin/gallery")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items)
        router.refresh()
      })
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh quá lớn (max 5MB)")
      return
    }
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "gallery")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error("Upload lỗi")
      const { secure_url } = await res.json()

      const createRes = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageUrl: secure_url,
          sortOrder: items.length + 1,
          isActive: true,
        }),
      })
      if (!createRes.ok) throw new Error("Lưu DB lỗi")
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định")
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  function toggleActive(it: Item) {
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${it.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !it.isActive }),
      })
      refresh()
    })
  }

  function updateLabel(it: Item, label: string) {
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${it.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label }),
      })
      refresh()
    })
  }

  function updateSort(it: Item, sortOrder: number) {
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${it.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sortOrder }),
      })
      refresh()
    })
  }

  function remove(it: Item) {
    if (!confirm("Xoá ảnh này khỏi gallery?")) return
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${it.id}`, { method: "DELETE" })
      refresh()
    })
  }

  const activeCount = items.filter((i) => i.isActive).length

  return (
    <div className="space-y-4">
      {/* Upload row */}
      <div className="bg-white rounded-xl border border-brand-200 p-4 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand-900">
            Thêm ảnh mới
          </p>
          <p className="text-xs text-brand-500">
            JPG/PNG/WebP, tối đa 5MB. Cloudinary tự resize tối đa 2560px + convert WebP.
          </p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={onFile}
          disabled={readOnly || uploading}
          className="text-sm"
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={readOnly || uploading}
          title={readOnly ? READ_ONLY_TOOLTIP : undefined}
          className="rounded-md bg-brand-700 text-white px-4 py-2 text-sm font-semibold hover:bg-brand-800 disabled:opacity-50"
        >
          {uploading ? "Đang upload..." : "Chọn ảnh"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="text-xs text-brand-500">
        Tổng: {items.length} ảnh · Đang active: <strong>{activeCount}</strong>
        {activeCount === 0 && items.length > 0 && (
          <span className="ml-2 text-amber-700">
            ⚠ Chưa có ảnh nào active — trang chủ sẽ dùng background mặc định.
          </span>
        )}
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-300 p-10 text-center text-sm text-brand-500">
          Chưa có ảnh nào. Upload ảnh đầu tiên để trang chủ bắt đầu hiển thị gallery.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div
              key={it.id}
              className={"bg-white rounded-xl border p-3 space-y-2 " + (it.isActive ? "border-brand-300" : "border-brand-100 opacity-60")}
            >
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-brand-100">
                <Image
                  src={it.imageUrl}
                  alt={it.label ?? "Hero"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <input
                defaultValue={it.label ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== (it.label ?? "")) updateLabel(it, e.target.value)
                }}
                disabled={readOnly}
                placeholder="Ghi chú (optional)"
                className="w-full rounded-md border border-brand-200 px-2 py-1 text-xs"
              />
              <div className="flex items-center gap-2 text-xs">
                <label className="flex-1">
                  <span className="block text-brand-500 mb-0.5">Thứ tự</span>
                  <input
                    type="number"
                    defaultValue={it.sortOrder}
                    onBlur={(e) => {
                      const v = Number(e.target.value)
                      if (v !== it.sortOrder) updateSort(it, v)
                    }}
                    disabled={readOnly}
                    className="w-full rounded-md border border-brand-200 px-2 py-1"
                  />
                </label>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => toggleActive(it)}
                    disabled={readOnly || pending}
                    title={readOnly ? READ_ONLY_TOOLTIP : it.isActive ? "Ẩn" : "Hiện"}
                    className={
                      "px-2 py-1 rounded border text-xs " +
                      (it.isActive
                        ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                        : "border-green-300 text-green-700 hover:bg-green-50") +
                      " disabled:opacity-50"
                    }
                  >
                    {it.isActive ? "Đang active" : "Đang ẩn"}
                  </button>
                  <button
                    onClick={() => remove(it)}
                    disabled={readOnly || pending}
                    title={readOnly ? READ_ONLY_TOOLTIP : undefined}
                    className="px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 text-xs disabled:opacity-50"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
