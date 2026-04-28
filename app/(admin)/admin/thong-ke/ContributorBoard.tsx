"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { TopContributor } from "@/lib/admin-stats"

type Period = "week" | "month"

/**
 * Bảng top contributors với toggle 7d / 30d.
 * Client component để chuyển period không cần round-trip server (data của
 * cả 2 period đã fetch sẵn ở page.tsx). Phase 3.7 round 4 (2026-04).
 */
export function ContributorBoard({
  title,
  subtitle,
  data7,
  data30,
  unitLabel,
}: {
  title: string
  subtitle: string
  data7: TopContributor[]
  data30: TopContributor[]
  /** Đơn vị đếm hiển thị sau số (vd "bài"). */
  unitLabel: string
}) {
  const [period, setPeriod] = useState<Period>("week")
  const items = period === "week" ? data7 : data30

  return (
    <div className="rounded-xl border border-brand-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-brand-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-brand-900">{title}</h2>
          <p className="mt-0.5 text-xs text-brand-500">{subtitle}</p>
        </div>
        <div
          role="tablist"
          aria-label="Chọn khoảng thời gian"
          className="flex shrink-0 rounded-lg border border-brand-200 bg-brand-50/40 p-0.5"
        >
          <PeriodTab active={period === "week"} onClick={() => setPeriod("week")}>
            7 ngày
          </PeriodTab>
          <PeriodTab active={period === "month"} onClick={() => setPeriod("month")}>
            30 ngày
          </PeriodTab>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="p-12 text-center text-sm italic text-brand-400">
          Chưa có đóng góp trong {period === "week" ? "7 ngày" : "30 ngày"} qua.
        </p>
      ) : (
        <ol className="divide-y divide-brand-100">
          {items.map((u, i) => (
            <li key={u.userId} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  i === 0
                    ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                    : i === 1
                      ? "bg-neutral-200 text-neutral-700"
                      : i === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-brand-50 text-brand-500",
                )}
              >
                {i + 1}
              </span>
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand-100">
                {u.avatarUrl ? (
                  <Image
                    src={u.avatarUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-bold text-brand-700">
                    {u.name[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/hoi-vien/${u.userId}`}
                  className="block truncate text-sm font-semibold text-brand-900 hover:text-brand-700 hover:underline"
                >
                  {u.name}
                </Link>
                <p className="truncate text-[11px] text-brand-400">{u.email}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
                {u.count} {unitLabel}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function PeriodTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
        active
          ? "bg-white text-brand-900 shadow-sm ring-1 ring-brand-200"
          : "text-brand-500 hover:text-brand-700",
      )}
    >
      {children}
    </button>
  )
}
