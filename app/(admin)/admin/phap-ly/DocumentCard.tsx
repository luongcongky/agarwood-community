"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type DocData = {
  id: string
  title: string
  description: string | null
  category: string
  documentNumber: string | null
  issuedDate: string | null
  issuer: string | null
  sortOrder: number
  isPublic: boolean
  driveFileId: string
  driveViewUrl: string
  fileName: string
  fileSize: number
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function toDateInput(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toISOString().slice(0, 10)
}

export function DocumentCard({ doc }: { doc: DocData }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit state
  const [title, setTitle] = useState(doc.title)
  const [documentNumber, setDocumentNumber] = useState(doc.documentNumber ?? "")
  const [issuedDate, setIssuedDate] = useState(toDateInput(doc.issuedDate))
  const [issuer, setIssuer] = useState(doc.issuer ?? "")
  const [description, setDescription] = useState(doc.description ?? "")
  const [sortOrder, setSortOrder] = useState(doc.sortOrder)
  const [isPublic, setIsPublic] = useState(doc.isPublic)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/phap-ly/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          documentNumber: documentNumber || null,
          issuedDate: issuedDate || null,
          issuer: issuer || null,
          description: description || null,
          sortOrder: Number(sortOrder) || 0,
          isPublic,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại")
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      setError("Không thể kết nối")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Xóa vĩnh viễn "${doc.title}"? File trên Google Drive cũng sẽ bị xóa.`)) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/phap-ly/${doc.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Xóa thất bại")
        return
      }
      router.refresh()
    } catch {
      setError("Không thể kết nối")
    } finally {
      setDeleting(false)
    }
  }

  if (!editing) {
    return (
      <div className="rounded-lg border border-brand-200 bg-brand-50/30 p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 text-2xl">📄</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-brand-900 leading-snug">{doc.title}</h3>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-brand-500">
              {doc.documentNumber && <span>Số: {doc.documentNumber}</span>}
              {doc.issuedDate && <span>Ngày: {fmtDate(doc.issuedDate)}</span>}
              {doc.issuer && <span>Ban hành: {doc.issuer}</span>}
              <span>Size: {fmtBytes(doc.fileSize)}</span>
              <span>Order: {doc.sortOrder}</span>
              <span className={doc.isPublic ? "text-green-700" : "text-red-700"}>
                {doc.isPublic ? "● Public" : "● Private"}
              </span>
            </div>
            {doc.description && (
              <p className="mt-2 text-xs text-brand-600 line-clamp-2">{doc.description}</p>
            )}
          </div>
          <div className="shrink-0 flex gap-1.5">
            <a
              href={doc.driveViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-brand-300 bg-white px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              👁 Xem
            </a>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-brand-300 bg-white px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              ✎ Sửa
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "..." : "🗑"}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-2 text-xs text-red-700">{error}</div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-brand-400 bg-white p-4 space-y-3">
      <div>
        <label className="block text-xs font-medium text-brand-700 mb-1">Tiêu đề</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-brand-200 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-brand-700 mb-1">Số VB</label>
          <input
            type="text"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            className="w-full rounded-md border border-brand-200 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-700 mb-1">Ngày ban hành</label>
          <input
            type="date"
            value={issuedDate}
            onChange={(e) => setIssuedDate(e.target.value)}
            className="w-full rounded-md border border-brand-200 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-700 mb-1">Ban hành</label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className="w-full rounded-md border border-brand-200 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-brand-700 mb-1">Mô tả</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-brand-200 px-2 py-1.5 text-sm resize-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-brand-700 mb-1">Thứ tự</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-20 rounded-md border border-brand-200 px-2 py-1.5 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-700 cursor-pointer mt-5">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded"
          />
          Hiển thị public
        </label>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-brand-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="rounded-md border border-brand-300 px-4 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
        >
          Hủy
        </button>
      </div>
    </div>
  )
}
