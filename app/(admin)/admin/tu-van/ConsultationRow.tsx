"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Item {
  id: string
  status: string
  fullName: string
  phone: string
  email: string | null
  companyName: string | null
  note: string | null
  recommendedTier: string | null
  context: string | null
  createdAt: string
  handledByName: string | null
  user: { name: string; email: string; accountType: string } | null
  statusLabel: string
}

const STATUSES = ["PENDING", "CONTACTED", "DONE", "CANCELLED"]

export function ConsultationRow({ item }: { item: Item }) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)

  async function update(status: string) {
    setUpdating(true)
    const res = await fetch(`/api/admin/tu-van/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setUpdating(false)
    if (res.ok) router.refresh()
  }

  return (
    <tr className="hover:bg-brand-50/50 align-top">
      <td className="px-4 py-3">
        <div className="font-medium text-brand-900">{item.fullName}</div>
        {item.companyName && <div className="text-xs text-brand-600">{item.companyName}</div>}
        {item.user ? (
          <div className="text-xs text-brand-500">Hội viên: {item.user.name} ({item.user.accountType})</div>
        ) : (
          <div className="text-xs text-amber-600">Anon (public)</div>
        )}
      </td>
      <td className="px-4 py-3 text-xs">
        <div>{item.phone}</div>
        {item.email && <div className="text-brand-500">{item.email}</div>}
      </td>
      <td className="px-4 py-3">
        {item.recommendedTier && (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            item.recommendedTier === "GOLD" ? "bg-amber-100 text-amber-800" :
            item.recommendedTier === "SILVER" ? "bg-slate-200 text-slate-800" :
            "bg-brand-100 text-brand-600"
          }`}>{item.recommendedTier}</span>
        )}
        {item.context && <div className="text-xs text-brand-400 mt-1">{item.context}</div>}
      </td>
      <td className="px-4 py-3 text-xs text-brand-600 max-w-xs">{item.note || "—"}</td>
      <td className="px-4 py-3">
        <select
          value={item.status}
          onChange={(e) => update(e.target.value)}
          disabled={updating}
          className="rounded border border-brand-300 px-2 py-1 text-xs"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {item.handledByName && <div className="text-xs text-brand-400 mt-1">bởi {item.handledByName}</div>}
      </td>
      <td className="px-4 py-3 text-xs text-brand-500">
        {new Date(item.createdAt).toLocaleString("vi-VN")}
      </td>
    </tr>
  )
}
