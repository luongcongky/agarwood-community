"use client"

import Link from "next/link"
import { usePendingCounts } from "@/components/features/admin/PendingCountsContext"
import type { PendingWorkflowKey } from "@/app/api/admin/pending-counts/route"
import { cn } from "@/lib/utils"

// Mapping workflow → nhãn + href. Thứ tự mặc định là "mức độ stuck ưu tiên":
// ảnh hưởng tiền (thanh toán, chứng nhận), moderation public (post, report),
// đơn dịch vụ, kết nạp, yêu cầu khác. Workflow không có badge ở đây = không
// track trong /api/admin/pending-counts.
const BADGES: { key: PendingWorkflowKey; label: string; icon: string; href: string }[] = [
  { key: "payment",               label: "Thanh toán chờ xác nhận",  icon: "💳", href: "/admin/thanh-toan" },
  { key: "certification",         label: "Chứng nhận chờ xét",       icon: "📋", href: "/admin/chung-nhan" },
  { key: "post",                  label: "Bài viết chờ duyệt",       icon: "📝", href: "/admin/bai-viet/cho-duyet" },
  { key: "report",                label: "Báo cáo vi phạm",          icon: "🚩", href: "/admin/bao-cao" },
  { key: "promotionRequest",      label: "Xin đẩy lên trang chủ",    icon: "⭐", href: "/admin/bai-viet/xin-dang" },
  { key: "membershipApplication", label: "Hội viên xin gia nhập",    icon: "👥", href: "/admin/hoi-vien/don-ket-nap" },
  { key: "newRegistration",       label: "Đăng ký mới chờ duyệt",    icon: "🆕", href: "/admin/hoi-vien?status=registration" },
  { key: "banner",                label: "Banner chờ duyệt",          icon: "🖼️", href: "/admin/banner" },
  { key: "mediaOrder",            label: "Đơn truyền thông mới",     icon: "📰", href: "/admin/truyen-thong" },
  { key: "consultation",          label: "Yêu cầu tư vấn mới",       icon: "💬", href: "/admin/tu-van" },
  { key: "contact",               label: "Tin nhắn liên hệ mới",     icon: "✉️", href: "/admin/lien-he" },
]

export function ActionQueueBadges() {
  const { data, loading } = usePendingCounts()
  const initial = !data && loading
  const total = data?.total ?? 0
  const allClear = !initial && total === 0

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-900 flex items-center gap-2">
          Việc cần xử lý
          {!initial && (
            <span
              className={cn(
                "rounded-full text-xs font-semibold px-2 py-0.5",
                total > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800",
              )}
            >
              {total > 0 ? `${total} việc` : "Tất cả đã xử lý"}
            </span>
          )}
        </h2>
        <p className="text-xs text-brand-400">Badge cập nhật mỗi 30s hoặc sau mỗi thao tác</p>
      </div>

      {allClear && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <span className="font-semibold">🎉 Không có việc nào đang chờ.</span>{" "}
          Dashboard sẽ tự update khi có đơn/bài viết mới.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {BADGES.map((b) => {
          const count = data?.workflows[b.key]?.count ?? 0
          const hasWork = count > 0
          return (
            <Link
              key={b.key}
              href={b.href}
              className={cn(
                "rounded-xl border p-4 shadow-sm transition-all",
                hasWork
                  ? "border-amber-300 bg-amber-50 hover:bg-amber-100 hover:shadow"
                  : "border-brand-200 bg-white hover:bg-brand-50",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xl" aria-hidden>{b.icon}</span>
                <span
                  className={cn(
                    "text-3xl font-bold leading-none",
                    hasWork ? "text-amber-700" : "text-brand-300",
                  )}
                >
                  {initial ? "…" : count}
                </span>
              </div>
              <p
                className={cn(
                  "mt-3 text-xs font-medium leading-snug",
                  hasWork ? "text-amber-900" : "text-brand-500",
                )}
              >
                {b.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-[11px]",
                  hasWork ? "text-amber-600 font-medium" : "text-brand-300",
                )}
              >
                {hasWork ? "Xử lý ngay →" : "Đã xử lý xong"}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
