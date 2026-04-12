"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"

type LeaderCategory = "BTV" | "BCH" | "BKT"

type Leader = {
  id: string
  name: string
  title: string
  category: LeaderCategory
  workTitle: string | null
  bio: string | null
  photoUrl: string | null
  term: string
  sortOrder: number
  isActive: boolean
}

type FormData = {
  name: string
  title: string
  category: LeaderCategory
  workTitle: string
  bio: string
  photoUrl: string
  term: string
  sortOrder: number
}

const EMPTY_FORM: FormData = {
  name: "",
  title: "",
  category: "BCH",
  workTitle: "",
  bio: "",
  photoUrl: "",
  term: "",
  sortOrder: 0,
}

const CATEGORY_LABELS: Record<LeaderCategory, string> = {
  BTV: "Ban Thường vụ",
  BKT: "Ban Kiểm tra",
  BCH: "UV Ban Chấp hành",
}

const CATEGORY_COLORS: Record<LeaderCategory, string> = {
  BTV: "bg-amber-100 text-amber-800",
  BKT: "bg-blue-100 text-blue-800",
  BCH: "bg-brand-100 text-brand-700",
}

export function LeaderManager({
  initialLeaders,
  initialTerms,
}: {
  initialLeaders: Leader[]
  initialTerms: string[]
}) {
  const router = useRouter()
  const [leaders, setLeaders] = useState(initialLeaders)
  const [terms] = useState(initialTerms)
  const [selectedTerm, setSelectedTerm] = useState(terms[0] ?? "")
  const [filterCat, setFilterCat] = useState<LeaderCategory | "ALL">("ALL")
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const filtered = leaders
    .filter((l) => l.term === selectedTerm)
    .filter((l) => filterCat === "ALL" || l.category === filterCat)

  const countByCategory = (cat: LeaderCategory) =>
    leaders.filter((l) => l.term === selectedTerm && l.category === cat).length

  function startCreate() {
    setEditing("new")
    setForm({ ...EMPTY_FORM, term: selectedTerm })
  }

  function startEdit(leader: Leader) {
    setEditing(leader.id)
    setForm({
      name: leader.name,
      title: leader.title,
      category: leader.category,
      workTitle: leader.workTitle ?? "",
      bio: leader.bio ?? "",
      photoUrl: leader.photoUrl ?? "",
      term: leader.term,
      sortOrder: leader.sortOrder,
    })
  }

  function cancel() {
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  async function save() {
    if (!form.name.trim() || !form.title.trim() || !form.term.trim()) return
    setSaving(true)
    try {
      if (editing === "new") {
        const res = await fetch("/api/admin/leaders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error("Failed to create")
        const created = await res.json()
        setLeaders((prev) => [...prev, created])
      } else {
        const res = await fetch(`/api/admin/leaders/${editing}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error("Failed to update")
        const updated = await res.json()
        setLeaders((prev) =>
          prev.map((l) => (l.id === updated.id ? updated : l)),
        )
      }
      cancel()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(leader: Leader) {
    const res = await fetch(`/api/admin/leaders/${leader.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !leader.isActive }),
    })
    if (!res.ok) return
    setLeaders((prev) =>
      prev.map((l) =>
        l.id === leader.id ? { ...l, isActive: !l.isActive } : l,
      ),
    )
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm("Xóa thành viên này khỏi ban lãnh đạo?")) return
    const res = await fetch(`/api/admin/leaders/${id}`, { method: "DELETE" })
    if (!res.ok) return
    setLeaders((prev) => prev.filter((l) => l.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Term selector + Add button */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-foreground">
          Nhiệm kỳ:
        </label>
        <div className="flex flex-wrap gap-2">
          {terms.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setSelectedTerm(t)
                setFilterCat("ALL")
                cancel()
              }}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                t === selectedTerm
                  ? "border-brand-500 bg-brand-700 text-white"
                  : "border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="ml-auto rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 transition-colors"
        >
          + Thêm thành viên
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "ALL" as const, label: "Tất cả" },
            { key: "BTV" as const, label: "Ban Thường vụ" },
            { key: "BKT" as const, label: "Ban Kiểm tra" },
            { key: "BCH" as const, label: "UV Ban Chấp hành" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilterCat(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filterCat === key
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {label}
            {key !== "ALL" && (
              <span className="ml-1 opacity-60">
                ({countByCategory(key)})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Create / Edit form */}
      {editing && (
        <div className="rounded-xl border border-brand-300 bg-brand-50 p-5 space-y-4">
          <h3 className="font-semibold text-foreground">
            {editing === "new" ? "Thêm thành viên mới" : "Chỉnh sửa"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Họ tên *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="VD: Phạm Văn Du"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Chức danh trong Hội *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="VD: Chủ tịch, Phó Chủ tịch, Ủy viên..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Nhóm *
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as LeaderCategory,
                  })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="BTV">Ban Thường vụ</option>
                <option value="BKT">Ban Kiểm tra</option>
                <option value="BCH">UV Ban Chấp hành</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Chức vụ đơn vị công tác
              </label>
              <input
                type="text"
                value={form.workTitle}
                onChange={(e) =>
                  setForm({ ...form, workTitle: e.target.value })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="VD: Giám đốc Công ty TNHH..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Nhiệm kỳ *
              </label>
              <input
                type="text"
                value={form.term}
                onChange={(e) => setForm({ ...form, term: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="VD: Nhiệm kỳ III (2023–2028)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                URL ảnh đại diện
              </label>
              <input
                type="text"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Tiểu sử
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                placeholder="Mô tả ngắn về vai trò, kinh nghiệm..."
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Leaders list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Chưa có thành viên nào
          {filterCat !== "ALL" && ` trong ${CATEGORY_LABELS[filterCat]}`}.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((leader) => (
              <div
                key={leader.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors",
                  leader.isActive
                    ? "border-border"
                    : "border-border opacity-50",
                )}
              >
                {/* Photo */}
                <div className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden bg-brand-100">
                  {leader.photoUrl ? (
                    <Image
                      src={leader.photoUrl}
                      alt={leader.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-brand-700 text-white font-bold text-xs">
                      {leader.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(-2)
                        .join("")}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground text-sm">
                      {leader.name}
                    </h3>
                    <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {leader.title}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        CATEGORY_COLORS[leader.category],
                      )}
                    >
                      {CATEGORY_LABELS[leader.category]}
                    </span>
                    {!leader.isActive && (
                      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Ẩn
                      </span>
                    )}
                  </div>
                  {leader.workTitle && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {leader.workTitle}
                    </p>
                  )}
                </div>

                {/* Sort order */}
                <span className="shrink-0 text-xs text-muted-foreground">
                  #{leader.sortOrder}
                </span>

                {/* Actions */}
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(leader)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(leader)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    {leader.isActive ? "Ẩn" : "Hiện"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(leader.id)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
