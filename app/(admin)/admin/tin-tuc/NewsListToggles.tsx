"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  useAdminReadOnly,
  useAdminCanPublishNews,
  READ_ONLY_TOOLTIP,
  PUBLISH_LOCKED_TOOLTIP,
} from "@/components/features/admin/AdminReadOnlyContext"

type Props = {
  newsId: string
  field: "isPinned" | "isPublished"
  value: boolean
}

/**
 * Toggle nhanh Ghim hoặc Xuất bản trên danh sách tin tức admin.
 * Click → PATCH /api/admin/news/[id] với field tương ứng → router.refresh().
 *
 * Permission gate:
 *  - isPinned: cần news:write (mọi user vào /admin/tin-tuc đã có quyền này)
 *  - isPublished: cần news:publish (ADMIN, không phải INFINITE) — INFINITE
 *    thấy nút disable + tooltip giải thích.
 */
export function NewsListToggle({ newsId, field, value }: Props) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const canPublish = useAdminCanPublishNews()
  const [pending, setPending] = useState(false)
  const [optimistic, setOptimistic] = useState(value)

  const isPublishField = field === "isPublished"
  // Toggle Xuất bản chỉ dành cho ai có news:publish; INFINITE chỉ writeable
  // → disable nút này. readOnly Infinite cũng disable cả Pin.
  const disabled = readOnly || pending || (isPublishField && !canPublish)
  const tooltip = readOnly
    ? READ_ONLY_TOOLTIP
    : isPublishField && !canPublish
      ? PUBLISH_LOCKED_TOOLTIP
      : undefined

  async function toggle() {
    if (disabled) return
    setPending(true)
    const next = !optimistic
    setOptimistic(next) // optimistic UI — flip ngay
    try {
      const res = await fetch(`/api/admin/news/${newsId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      })
      if (!res.ok) {
        setOptimistic(!next) // rollback
      } else {
        router.refresh()
      }
    } catch {
      setOptimistic(!next)
    } finally {
      setPending(false)
    }
  }

  // Visual: Published = pill xanh/xám với icon ✓/—; Pinned = badge 📌 hoặc dash.
  if (isPublishField) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        title={tooltip ?? (optimistic ? "Click để bỏ xuất bản" : "Click để xuất bản")}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all ${
          optimistic
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {pending ? "…" : optimistic ? "Đã xuất bản" : "Nháp"}
      </button>
    )
  }

  // Pin — pill có label rõ ràng + icon khác nhau giữa 2 trạng thái thay vì
  // chỉ đổi màu nền. "📌 Đã ghim" (amber filled) vs "Ghim" (outline gray).
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={tooltip ?? (optimistic ? "Click để bỏ ghim" : "Click để ghim lên đầu")}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap border transition-all ${
        optimistic
          ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
          : "bg-white text-gray-400 border-gray-200 border-dashed hover:border-gray-400 hover:text-gray-600"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {pending ? "…" : optimistic ? "📌 Đã ghim" : "Ghim"}
    </button>
  )
}
