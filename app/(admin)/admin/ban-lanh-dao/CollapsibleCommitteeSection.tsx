"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Client wrapper cho từng committee section — collapse/expand state riêng
 * mỗi section. CommitteesView (server) compose children bên trong.
 *
 * Mặc định collapse; admin mở từng ban khi cần xem.
 */
export function CollapsibleCommitteeSection({
  title,
  subtitle,
  statusRight,
  children,
}: {
  title: string
  /** Diễn giải vai trò/quyền của ban. Optional — ban lãnh đạo (public) ẩn
   *  diễn giải để header gọn, chỉ ban nội bộ mới hiện. */
  subtitle?: string
  /** JSX bên phải header (member count + profile status) — server-rendered. */
  statusRight: ReactNode
  /** Nội dung bung ra — server-rendered member list. */
  children: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="rounded-xl border border-brand-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-start justify-between gap-4 border-b border-transparent bg-brand-50/60 px-5 py-3 text-left hover:bg-brand-50 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-brand-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-brand-500 leading-snug">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {statusRight}
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={cn(
              "h-4 w-4 text-brand-500 transition-transform",
              expanded && "rotate-180",
            )}
          >
            <path
              d="M5 7l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {expanded && <div className="border-t border-brand-100">{children}</div>}
    </section>
  )
}
