"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

interface Item {
  id: string
  status: string
  name: string
  email: string
  phone: string | null
  message: string
  adminNote: string | null
  createdAt: string
  handledByName: string | null
  statusLabel: string
}

const STATUSES = ["NEW", "HANDLED", "ARCHIVED"]

export function ContactRow({ item }: { item: Item }) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [updating, setUpdating] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function update(next: { status?: string; adminNote?: string }) {
    setUpdating(true)
    const res = await fetch(`/api/admin/contact-messages/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next.status ?? item.status, ...next }),
    })
    setUpdating(false)
    if (res.ok) router.refresh()
  }

  return (
    <>
      <tr className="hover:bg-brand-50/50 align-top">
        <td className="px-4 py-3">
          <div className="font-medium text-brand-900">{item.name}</div>
          {item.status === "NEW" && (
            <span className="inline-flex mt-1 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold px-1.5 py-0.5">
              Mới
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-xs">
          <a href={`mailto:${item.email}`} className="text-brand-700 hover:underline">
            {item.email}
          </a>
          {item.phone && (
            <div className="text-brand-500 mt-0.5">
              <a href={`tel:${item.phone}`} className="hover:underline">{item.phone}</a>
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-sm max-w-md">
          <div className={expanded ? "whitespace-pre-wrap text-brand-800" : "line-clamp-3 text-brand-800"}>
            {item.message}
          </div>
          {item.message.length > 180 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs text-brand-600 hover:underline"
            >
              {expanded ? "Thu gọn" : "Xem thêm"}
            </button>
          )}
        </td>
        <td className="px-4 py-3">
          <select
            value={item.status}
            onChange={(e) => update({ status: e.target.value })}
            disabled={updating || readOnly}
            title={readOnly ? READ_ONLY_TOOLTIP : undefined}
            className="rounded border border-brand-300 px-2 py-1 text-xs disabled:opacity-50"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {item.handledByName && (
            <div className="text-xs text-brand-400 mt-1">bởi {item.handledByName}</div>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-brand-500 whitespace-nowrap">
          {new Date(item.createdAt).toLocaleString("vi-VN")}
        </td>
      </tr>
    </>
  )
}
