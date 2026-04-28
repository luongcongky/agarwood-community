"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Modal "Đẩy lên trang chủ" — Phase 3.7 round 4 (2026-04).
 * Combined workflow: tag bài feed vào News categories (required, max 3) +
 * pin top homepage (optional checkbox isPromoted).
 *
 * Reusable: gọi từ FeedClient (admin menu) hoặc ModerationItem (sau approve).
 */

const NEWS_CATEGORY_OPTIONS = [
  { value: "GENERAL", label: "Tin tức (/tin-tuc)" },
  { value: "RESEARCH", label: "Nghiên cứu (/nghien-cuu)" },
  { value: "BUSINESS", label: "Tin doanh nghiệp" },
  { value: "EXTERNAL_NEWS", label: "Tin báo chí ngoài (/tin-bao-chi)" },
  { value: "AGRICULTURE", label: "Khuyến nông (/khuyen-nong)" },
] as const

export type NewsCategoryValue = (typeof NEWS_CATEGORY_OPTIONS)[number]["value"]

export type PromotePostModalProps = {
  postId: string
  postTitle: string | null
  initialCategories: NewsCategoryValue[]
  initialPromoted: boolean
  onClose: () => void
  onSuccess: (next: { isPromoted: boolean; newsCategories: NewsCategoryValue[] }) => void
}

export function PromotePostModal({
  postId,
  postTitle,
  initialCategories,
  initialPromoted,
  onClose,
  onSuccess,
}: PromotePostModalProps) {
  const [categories, setCategories] = useState<NewsCategoryValue[]>(initialCategories)
  const [pinHomepage, setPinHomepage] = useState(initialPromoted)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isUnpromoteOnly = initialPromoted && !pinHomepage && categories.length === 0

  function toggleCategory(value: NewsCategoryValue) {
    setCategories((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : prev.length >= 3
          ? prev
          : [...prev, value],
    )
  }

  async function handleSubmit() {
    // Validation: phải có ít nhất 1 categorization HOẶC pin = bài đang được
    // promote nhưng admin muốn gỡ về 0 (categories=[] + pin=false).
    if (categories.length === 0 && !pinHomepage && !initialPromoted && initialCategories.length === 0) {
      setError("Hãy chọn ít nhất 1 danh mục hoặc bật ghim trang chủ.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/posts/${postId}/promote`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          newsCategories: categories,
          isPromoted: pinHomepage,
        }),
      })
      const data = (await res.json()) as {
        isPromoted?: boolean
        newsCategories?: NewsCategoryValue[]
        error?: string
      }
      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại")
        setSubmitting(false)
        return
      }
      onSuccess({
        isPromoted: data.isPromoted ?? pinHomepage,
        newsCategories: data.newsCategories ?? categories,
      })
    } catch {
      setError("Lỗi mạng")
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <header className="border-b border-brand-100 px-5 py-3">
          <h2 className="text-base font-bold text-brand-900">Đẩy lên trang chủ</h2>
          <p className="mt-0.5 line-clamp-1 text-xs text-brand-500">
            {postTitle || "(không có tiêu đề)"}
          </p>
        </header>

        <div className="space-y-4 px-5 py-4">
          {/* Section 1: News categories */}
          <div>
            <p className="mb-1 text-sm font-semibold text-brand-900">
              Đẩy vào danh mục
              <span className="ml-1 text-[11px] font-normal text-brand-500">
                (chọn 1-3)
              </span>
            </p>
            <p className="mb-2 text-[11px] text-brand-400">
              Bài sẽ xuất hiện trong list page tương ứng (vd /nghien-cuu).
              Ngoài ra cũng đứng cùng các tin News khác trong section &quot;Tin
              mới&quot; trên trang chủ.
            </p>
            <div className="space-y-1.5 rounded-lg border border-brand-200 p-3">
              {NEWS_CATEGORY_OPTIONS.map((opt) => {
                const checked = categories.includes(opt.value)
                const disabled = !checked && categories.length >= 3
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-center gap-2 text-sm cursor-pointer",
                      disabled && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleCategory(opt.value)}
                      className="rounded border-brand-300 accent-brand-700"
                    />
                    <span className="text-brand-800">{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Section 2: Pin top homepage */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={pinHomepage}
                onChange={(e) => setPinHomepage(e.target.checked)}
                className="mt-0.5 rounded border-amber-400 accent-amber-600"
              />
              <div>
                <p className="font-semibold text-amber-900">📌 Ghim top trang chủ</p>
                <p className="mt-0.5 text-[11px] text-amber-700/80">
                  Bài sẽ pin lên top section &quot;Bản tin hội viên&quot;
                  (3 slot bên phải) trên trang chủ.
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-800">
              {error}
            </div>
          )}

          {isUnpromoteOnly && (
            <div className="rounded-md border border-orange-300 bg-orange-50 p-2 text-xs text-orange-800">
              ⚠️ Bạn đang gỡ bỏ tất cả promotion. Bài sẽ chỉ còn ở /feed (không
              hiện list page News, không pin homepage).
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-brand-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-brand-300 bg-white px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </button>
        </footer>
      </div>
    </div>
  )
}
