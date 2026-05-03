"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Save, Trash2, X, Plus } from "lucide-react"
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../_actions"

type LedgerType = "INCOME" | "EXPENSE"

export type CategoryRow = {
  id: string
  name: string
  type: LedgerType
  displayOrder: number
  isActive: boolean
  isSystem: boolean
  transactionCount: number
}

export function CategoryManager({ initial }: { initial: CategoryRow[] }) {
  const router = useRouter()
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  function refresh() {
    setError(null)
    router.refresh()
  }

  const incomes = initial.filter((c) => c.type === "INCOME")
  const expenses = initial.filter((c) => c.type === "EXPENSE")

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
        >
          <Plus className="h-3.5 w-3.5" />
          {showCreate ? "Đóng" : "Thêm danh mục mới"}
        </button>
      </div>

      {showCreate && (
        <CreateCategoryForm
          onDone={() => {
            setShowCreate(false)
            refresh()
          }}
          onError={setError}
        />
      )}

      <Section
        title="Danh mục THU"
        rows={incomes}
        editId={editId}
        setEditId={setEditId}
        onChange={refresh}
        onError={setError}
      />

      <Section
        title="Danh mục CHI"
        rows={expenses}
        editId={editId}
        setEditId={setEditId}
        onChange={refresh}
        onError={setError}
      />
    </div>
  )
}

function Section({
  title,
  rows,
  editId,
  setEditId,
  onChange,
  onError,
}: {
  title: string
  rows: CategoryRow[]
  editId: string | null
  setEditId: (id: string | null) => void
  onChange: () => void
  onError: (msg: string) => void
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide mb-2">
        {title}
      </h2>
      <div className="bg-white border border-brand-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-200 bg-brand-50/50 text-xs text-brand-500 font-medium">
              <th className="text-left px-4 py-2 w-16">Thứ tự</th>
              <th className="text-left px-4 py-2">Tên danh mục</th>
              <th className="text-left px-4 py-2 w-24">GD</th>
              <th className="text-left px-4 py-2 w-28">Trạng thái</th>
              <th className="text-right px-4 py-2 w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {rows.map((row) =>
              editId === row.id ? (
                <EditRow
                  key={row.id}
                  row={row}
                  onCancel={() => setEditId(null)}
                  onSaved={() => {
                    setEditId(null)
                    onChange()
                  }}
                  onError={onError}
                />
              ) : (
                <ViewRow
                  key={row.id}
                  row={row}
                  onEdit={() => setEditId(row.id)}
                  onDeleted={onChange}
                  onError={onError}
                />
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ViewRow({
  row,
  onEdit,
  onDeleted,
  onError,
}: {
  row: CategoryRow
  onEdit: () => void
  onDeleted: () => void
  onError: (msg: string) => void
}) {
  const [pending, startTransition] = useTransition()
  function onDelete() {
    if (!window.confirm(`Xóa danh mục "${row.name}"?`)) return
    startTransition(async () => {
      const res = await deleteCategory(row.id)
      if (res && "error" in res && res.error) {
        onError(res.error)
        return
      }
      onDeleted()
    })
  }
  return (
    <tr className="hover:bg-brand-50/50">
      <td className="px-4 py-2 text-brand-600 tabular-nums">{row.displayOrder}</td>
      <td className="px-4 py-2 font-medium text-brand-900">
        {row.name}
        {row.isSystem && (
          <span className="ml-2 text-[10px] uppercase tracking-wide bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
            HT
          </span>
        )}
      </td>
      <td className="px-4 py-2 text-brand-500 tabular-nums">{row.transactionCount}</td>
      <td className="px-4 py-2">
        <span
          className={
            row.isActive
              ? "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"
              : "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
          }
        >
          {row.isActive ? "Đang dùng" : "Ngưng"}
        </span>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="inline-flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-brand-100 text-brand-700"
            title="Sửa"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {!row.isSystem && row.transactionCount === 0 && (
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50"
              title="Xóa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function EditRow({
  row,
  onCancel,
  onSaved,
  onError,
}: {
  row: CategoryRow
  onCancel: () => void
  onSaved: () => void
  onError: (msg: string) => void
}) {
  const [name, setName] = useState(row.name)
  const [displayOrder, setDisplayOrder] = useState(String(row.displayOrder))
  const [isActive, setIsActive] = useState(row.isActive)
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const res = await updateCategory(row.id, {
        name,
        displayOrder: Number(displayOrder),
        isActive,
      })
      if ("error" in res && res.error) {
        onError(res.error)
        return
      }
      onSaved()
    })
  }

  return (
    <tr className="bg-brand-50/30">
      <td className="px-4 py-2">
        <input
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
          className="w-16 rounded border border-brand-300 px-2 py-1 text-sm tabular-nums"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-brand-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-4 py-2 text-brand-500 tabular-nums">{row.transactionCount}</td>
      <td className="px-4 py-2">
        <label className="inline-flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          Đang dùng
        </label>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="inline-flex gap-1">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="p-1.5 rounded hover:bg-emerald-100 text-emerald-700 disabled:opacity-50"
            title="Lưu"
          >
            <Save className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded hover:bg-brand-100 text-brand-700"
            title="Hủy"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function CreateCategoryForm({
  onDone,
  onError,
}: {
  onDone: () => void
  onError: (msg: string) => void
}) {
  const [name, setName] = useState("")
  const [type, setType] = useState<LedgerType>("INCOME")
  const [displayOrder, setDisplayOrder] = useState("50")
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await createCategory({
        name,
        type,
        displayOrder: Number(displayOrder),
        isActive: true,
      })
      if ("error" in res && res.error) {
        onError(res.error)
        return
      }
      setName("")
      setDisplayOrder("50")
      onDone()
    })
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-brand-200 rounded-2xl p-4 flex flex-wrap items-end gap-3"
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs text-brand-500">Loại</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as LedgerType)}
          className="rounded-md border border-brand-300 px-2 py-1.5 text-sm bg-white"
        >
          <option value="INCOME">Thu</option>
          <option value="EXPENSE">Chi</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <span className="text-xs text-brand-500">Tên danh mục</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Tài trợ doanh nghiệp"
          className="rounded-md border border-brand-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-brand-500">Thứ tự</span>
        <input
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
          className="w-20 rounded-md border border-brand-300 px-2 py-1.5 text-sm tabular-nums"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? "Đang lưu..." : "Tạo"}
      </button>
    </form>
  )
}
