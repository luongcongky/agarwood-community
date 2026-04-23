"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Bell, FileCheck, BadgeCheck, Megaphone, ImageIcon, Flag, Headset, Mail, MessageSquareText, UserPlus, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePendingCounts } from "@/components/features/admin/PendingCountsContext"
import type { PendingWorkflowKey } from "@/app/api/admin/pending-counts/route"

// Notification bell for the admin top bar. Single icon button + red badge
// with the total pending count. Clicking opens a panel that groups pending
// items by workflow, with up to 3 recent items per workflow + a "View all"
// link.

type WorkflowMeta = {
  label: string
  viewAllHref: string
  icon: React.ComponentType<{ className?: string }>
}

const WORKFLOW_META: Record<PendingWorkflowKey, WorkflowMeta> = {
  newRegistration:       { label: "Đơn đăng ký chờ duyệt", viewAllHref: "/admin/hoi-vien?status=registration", icon: UserPlus },
  membershipApplication: { label: "Đơn kết nạp hội viên",  viewAllHref: "/admin/hoi-vien/don-ket-nap", icon: FileCheck },
  payment:               { label: "Xác nhận chuyển khoản", viewAllHref: "/admin/thanh-toan",           icon: BadgeCheck },
  certification:         { label: "Chứng nhận sản phẩm",   viewAllHref: "/admin/chung-nhan",           icon: BadgeCheck },
  banner:                { label: "Duyệt banner",          viewAllHref: "/admin/banner",               icon: ImageIcon },
  post:                  { label: "Duyệt bài viết",        viewAllHref: "/admin/bai-viet/cho-duyet",   icon: MessageSquareText },
  promotionRequest:      { label: "Xin đẩy lên trang chủ", viewAllHref: "/admin/bai-viet/xin-dang",    icon: Star },
  report:                { label: "Báo cáo bài viết",      viewAllHref: "/admin/bao-cao",              icon: Flag },
  mediaOrder:            { label: "Đơn truyền thông",      viewAllHref: "/admin/truyen-thong",         icon: Megaphone },
  consultation:          { label: "Yêu cầu tư vấn",        viewAllHref: "/admin/tu-van",               icon: Headset },
  contact:               { label: "Liên hệ từ website",    viewAllHref: "/admin/lien-he",              icon: Mail },
}

// Declaration order = display order in the dropdown. Blocking workflows
// come first; informational ones last.
const WORKFLOW_ORDER: PendingWorkflowKey[] = [
  "newRegistration",
  "payment",
  "membershipApplication",
  "certification",
  "banner",
  "post",
  "promotionRequest",
  "mediaOrder",
  "contact",
  "report",
  "consultation",
]

function timeAgo(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Vừa xong"
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

type BellProps = {
  /**
   * Which edge of the trigger the dropdown anchors to.
   * - "end" (default): anchor right edge → panel extends leftward. Right
   *   for mobile top bar where the bell sits near the screen's right edge.
   * - "start": anchor left edge → panel extends rightward. Right for the
   *   desktop sidebar where the bell sits inside a narrow 256px column
   *   and the panel must overflow into the main content area to fit.
   */
  align?: "start" | "end"
}

export function NotificationBell({ align = "end" }: BellProps) {
  const { data, loading } = usePendingCounts()
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const rootRef = useRef<HTMLDivElement>(null)

  // Tick "time ago" labels every minute so the panel stays fresh while open.
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [open])

  // Close on outside click + Esc.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const total = data?.total ?? 0

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Thông báo (${total} mục chờ xử lý)`}
        className={cn(
          "relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors",
          "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          open && "bg-sidebar-accent text-sidebar-accent-foreground",
        )}
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums ring-2 ring-sidebar">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Danh sách tác vụ chờ xử lý"
          className={cn(
            "absolute mt-2 w-[min(420px,calc(100vw-1rem))] max-h-[70vh] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50 flex flex-col",
            align === "start" ? "left-0" : "right-0",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div>
              <p className="text-sm font-semibold">Tác vụ chờ xử lý</p>
              <p className="text-xs text-muted-foreground">
                {total === 0 ? "Không có mục nào" : `${total} mục cần bạn thao tác`}
              </p>
            </div>
            {loading && (
              <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {!data || total === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Tất cả đều đã được xử lý.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {WORKFLOW_ORDER.map((key) => {
                  const w = data.workflows[key]
                  if (w.count === 0) return null
                  const meta = WORKFLOW_META[key]
                  const Icon = meta.icon
                  return (
                    <li key={key} className="py-2">
                      <div className="flex items-center justify-between gap-2 px-4 py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-xs font-semibold text-foreground truncate">
                            {meta.label}
                          </span>
                          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums">
                            {w.count}
                          </span>
                        </div>
                        <Link
                          href={meta.viewAllHref}
                          onClick={() => setOpen(false)}
                          className="text-[11px] font-medium text-sidebar-primary hover:underline shrink-0"
                        >
                          Xem tất cả →
                        </Link>
                      </div>
                      <ul className="mt-1">
                        {w.recent.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className="flex items-start gap-2 px-4 py-2 hover:bg-accent transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {item.title}
                                </p>
                                {item.subtitle && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                                {timeAgo(item.createdAt, now)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
