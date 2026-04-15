"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

export type PartnerRow = {
  id: string
  name: string
  shortName: string | null
  category: string
  logoUrl: string | null
  websiteUrl: string | null
  description: string | null
  sortOrder: number
  isActive: boolean
}

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "GOVERNMENT", label: "Cơ quan nhà nước" },
  { value: "ASSOCIATION", label: "Hiệp hội" },
  { value: "RESEARCH", label: "Viện / trường" },
  { value: "ENTERPRISE", label: "Doanh nghiệp" },
  { value: "INTERNATIONAL", label: "Tổ chức quốc tế" },
  { value: "MEDIA", label: "Cơ quan báo chí" },
  { value: "OTHER", label: "Khác" },
]

const CATEGORY_LABEL = Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.value, c.label]))

const EMPTY: Omit<PartnerRow, "id"> = {
  name: "",
  shortName: "",
  category: "MEDIA",
  logoUrl: "",
  websiteUrl: "",
  description: "",
  sortOrder: 100,
  isActive: true,
}

export function PartnerManager({ initialPartners }: { initialPartners: PartnerRow[] }) {
  const readOnly = useAdminReadOnly()
  const [partners, setPartners] = useState<PartnerRow[]>(initialPartners)
  const [editingId, setEditingId] = useState<string | "new" | null>(null)
  const [draft, setDraft] = useState<Omit<PartnerRow, "id">>({ ...EMPTY })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function startCreate() {
    setEditingId("new")
    setDraft({ ...EMPTY })
    setError(null)
  }

  function startEdit(p: PartnerRow) {
    setEditingId(p.id)
    setDraft({
      name: p.name,
      shortName: p.shortName ?? "",
      category: p.category,
      logoUrl: p.logoUrl ?? "",
      websiteUrl: p.websiteUrl ?? "",
      description: p.description ?? "",
      sortOrder: p.sortOrder,
      isActive: p.isActive,
    })
    setError(null)
  }

  function cancel() {
    setEditingId(null)
    setError(null)
  }

  async function handleLogoUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "doi-tac")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setDraft((d) => ({ ...d, logoUrl: data.secure_url ?? data.url }))
    } catch {
      setError("Tải logo thất bại. Vui lòng thử lại.")
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (draft.name.trim().length < 2) {
      setError("Tên đối tác tối thiểu 2 ký tự")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const isNew = editingId === "new"
      const url = isNew ? "/api/admin/partners" : `/api/admin/partners/${editingId}`
      const method = isNew ? "POST" : "PATCH"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          shortName: draft.shortName,
          category: draft.category,
          logoUrl: draft.logoUrl,
          websiteUrl: draft.websiteUrl,
          description: draft.description,
          sortOrder: Number(draft.sortOrder) || 0,
          isActive: draft.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Lưu thất bại")
        return
      }
      const saved: PartnerRow = json.partner
      setPartners((prev) =>
        isNew
          ? [...prev, saved].sort((a, b) => a.sortOrder - b.sortOrder)
          : prev.map((p) => (p.id === saved.id ? saved : p)).sort((a, b) => a.sortOrder - b.sortOrder),
      )
      setEditingId(null)
    } catch {
      setError("Lưu thất bại")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: PartnerRow) {
    const res = await fetch(`/api/admin/partners/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    })
    if (res.ok) {
      const { partner } = await res.json()
      setPartners((prev) => prev.map((x) => (x.id === partner.id ? partner : x)))
    }
  }

  async function remove(p: PartnerRow) {
    if (!confirm(`Xoá đối tác "${p.name}"? Không thể hoàn tác.`)) return
    const res = await fetch(`/api/admin/partners/${p.id}`, { method: "DELETE" })
    if (res.ok) setPartners((prev) => prev.filter((x) => x.id !== p.id))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-brand-600">
          Tổng cộng <strong>{partners.length}</strong> đối tác —{" "}
          {partners.filter((p) => p.isActive).length} đang hiển thị
        </p>
        <button
          type="button"
          onClick={startCreate}
          disabled={editingId !== null || readOnly}
          title={readOnly ? READ_ONLY_TOOLTIP : undefined}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Thêm đối tác
        </button>
      </div>

      {/* New form */}
      {editingId === "new" && (
        <PartnerForm
          draft={draft}
          setDraft={setDraft}
          onSave={save}
          onCancel={cancel}
          saving={saving}
          uploading={uploading}
          error={error}
          onUploadLogo={handleLogoUpload}
          fileInputRef={fileInputRef}
          title="Thêm đối tác mới"
        />
      )}

      {/* List */}
      {partners.length === 0 && editingId !== "new" ? (
        <div className="rounded-xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
          Chưa có đối tác nào.
        </div>
      ) : (
        <ul className="space-y-3">
          {partners.map((p) =>
            editingId === p.id ? (
              <li key={p.id}>
                <PartnerForm
                  draft={draft}
                  setDraft={setDraft}
                  onSave={save}
                  onCancel={cancel}
                  saving={saving}
                  uploading={uploading}
                  error={error}
                  onUploadLogo={handleLogoUpload}
                  fileInputRef={fileInputRef}
                  title={`Sửa: ${p.name}`}
                />
              </li>
            ) : (
              <li
                key={p.id}
                className={cn(
                  "flex items-start gap-4 rounded-xl border bg-white p-4 transition-opacity",
                  p.isActive ? "border-brand-200" : "border-brand-100 opacity-60",
                )}
              >
                <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-brand-100 flex items-center justify-center">
                  {p.logoUrl ? (
                    <Image src={p.logoUrl} alt={p.name} fill className="object-contain p-1" sizes="64px" />
                  ) : (
                    <span className="text-xs text-brand-500">No logo</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-brand-900">{p.name}</h3>
                    {p.shortName && (
                      <span className="text-xs rounded bg-brand-100 text-brand-700 px-1.5 py-0.5 font-mono">
                        {p.shortName}
                      </span>
                    )}
                    <span className="text-xs rounded-full border border-brand-200 px-2 py-0.5 text-brand-600">
                      {CATEGORY_LABEL[p.category] ?? p.category}
                    </span>
                    {!p.isActive && (
                      <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                        Đã ẩn
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-sm text-brand-600 mt-1 line-clamp-2">{p.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-brand-500">
                    {p.websiteUrl && (
                      <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        {p.websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    <span>Thứ tự: {p.sortOrder}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    disabled={editingId !== null || readOnly}
                    title={readOnly ? READ_ONLY_TOOLTIP : undefined}
                    className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    disabled={readOnly}
                    title={readOnly ? READ_ONLY_TOOLTIP : undefined}
                    className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                  >
                    {p.isActive ? "Ẩn" : "Hiện"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    disabled={readOnly}
                    title={readOnly ? READ_ONLY_TOOLTIP : undefined}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Xoá
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}

// ── Form ───────────────────────────────────────────────────────────────────

function PartnerForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  saving,
  uploading,
  error,
  onUploadLogo,
  fileInputRef,
  title,
}: {
  draft: Omit<PartnerRow, "id">
  setDraft: (d: Omit<PartnerRow, "id">) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  uploading: boolean
  error: string | null
  onUploadLogo: (f: File) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  title: string
}) {
  return (
    <div className="rounded-xl border-2 border-brand-300 bg-brand-50/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-brand-900">{title}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 flex items-start gap-4">
          <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-white border border-brand-200 flex items-center justify-center">
            {draft.logoUrl ? (
              <Image src={draft.logoUrl} alt="" fill className="object-contain p-1" sizes="80px" />
            ) : (
              <span className="text-[10px] text-brand-400 px-2 text-center">Chưa có logo</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">Logo</label>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                >
                  {uploading ? "Đang tải..." : "Tải lên Cloudinary"}
                </button>
                {draft.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, logoUrl: "" })}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Xoá logo
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onUploadLogo(file)
                  e.target.value = ""
                }}
              />
            </div>
            <input
              type="text"
              value={draft.logoUrl ?? ""}
              onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
              placeholder="Hoặc dán URL logo trực tiếp..."
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-xs font-mono"
            />
          </div>
        </div>

        <Field label="Tên đối tác *" full={false}>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Đài Truyền hình Việt Nam"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Tên viết tắt">
          <input
            type="text"
            value={draft.shortName ?? ""}
            onChange={(e) => setDraft({ ...draft, shortName: e.target.value })}
            placeholder="VTV"
            maxLength={6}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm font-mono"
          />
        </Field>

        <Field label="Phân loại">
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm bg-white"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Thứ tự hiển thị">
          <input
            type="number"
            value={draft.sortOrder}
            onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Website" full>
          <input
            type="url"
            value={draft.websiteUrl ?? ""}
            onChange={(e) => setDraft({ ...draft, websiteUrl: e.target.value })}
            placeholder="https://vtv.vn"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm font-mono"
          />
        </Field>

        <Field label="Mô tả ngắn (hiển thị tooltip)" full>
          <textarea
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm resize-none"
          />
        </Field>

        <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-brand-700">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            className="rounded border-brand-300"
          />
          Hiển thị trên trang chủ
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-brand-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-brand-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
