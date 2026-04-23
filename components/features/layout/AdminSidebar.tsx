"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  Megaphone,
  LogOut,
  Flag,
  Newspaper,
  Settings,
  FileText,
  Star,
  Image as ImageIcon,
  FileCheck,
  Scale,
  Globe,
  Crown,
  ClipboardList,
  Headset,
  Handshake,
  Menu as MenuIcon,
  Images,
  ChevronDown,
  Mail,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePendingCounts } from "@/components/features/admin/PendingCountsContext"
import { NotificationBell } from "@/components/features/admin/NotificationBell"
import type { PendingWorkflowKey } from "@/app/api/admin/pending-counts/route"

// ── Nav structure ──────────────────────────────────────────────────────────
//
// Mỗi group có `key` ổn định (dùng cho localStorage). Group có `items` rỗng
// được render như link đơn lẻ (không có header).

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  // When set, this menu item shows a red pending-count badge driven by
  // the admin notification polling context.
  pendingKey?: PendingWorkflowKey
}

type NavGroup = {
  key: string
  label: string | null // null = không render header (link đơn lẻ)
  items: NavItem[]
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    key: "overview",
    label: null,
    items: [{ label: "Tổng quan", href: "/admin", icon: LayoutDashboard }],
  },
  {
    key: "members",
    label: "Hội viên & Tổ chức",
    items: [
      { label: "Hội viên", href: "/admin/hoi-vien", icon: Users },
      { label: "Đơn đăng ký", href: "/admin/hoi-vien?status=registration", icon: UserPlus, pendingKey: "newRegistration" },
      { label: "Đơn kết nạp", href: "/admin/hoi-vien/don-ket-nap", icon: FileCheck, pendingKey: "membershipApplication" },
      { label: "Ban lãnh đạo", href: "/admin/ban-lanh-dao", icon: Crown },
    ],
  },
  {
    key: "products",
    label: "Sản phẩm & Chứng nhận",
    items: [
      { label: "Chứng nhận", href: "/admin/chung-nhan", icon: BadgeCheck, pendingKey: "certification" },
      { label: "Hội đồng thẩm định", href: "/admin/hoi-dong-tham-dinh", icon: Scale },
      { label: "Tiêu biểu", href: "/admin/tieu-bieu", icon: Star },
    ],
  },
  {
    key: "content",
    label: "Nội dung & Truyền thông",
    items: [
      { label: "Tin tức", href: "/admin/tin-tuc", icon: Newspaper },
      { label: "Multimedia", href: "/admin/multimedia", icon: Images },
      { label: "Tài liệu", href: "/admin/tai-lieu", icon: FileText },
      { label: "Văn bản pháp quy", href: "/admin/phap-ly", icon: Scale },
      { label: "Truyền thông", href: "/admin/truyen-thong", icon: Megaphone, pendingKey: "mediaOrder" },
      { label: "Banner QC", href: "/admin/banner", icon: ImageIcon, pendingKey: "banner" },
    ],
  },
  {
    key: "interaction",
    label: "Tương tác",
    items: [
      { label: "Duyệt bài viết", href: "/admin/bai-viet/cho-duyet", icon: FileCheck, pendingKey: "post" },
      { label: "Liên hệ", href: "/admin/lien-he", icon: Mail, pendingKey: "contact" },
      { label: "Báo cáo", href: "/admin/bao-cao", icon: Flag, pendingKey: "report" },
      { label: "Khảo sát", href: "/admin/khao-sat", icon: ClipboardList },
      { label: "Tư vấn", href: "/admin/tu-van", icon: Headset, pendingKey: "consultation" },
    ],
  },
  {
    key: "partners-finance",
    label: "Đối tác & Tài chính",
    items: [
      { label: "Đối tác", href: "/admin/doi-tac", icon: Handshake },
      { label: "Xác nhận CK", href: "/admin/thanh-toan", icon: BadgeCheck, pendingKey: "payment" },
    ],
  },
  {
    key: "system",
    label: "Hệ thống",
    items: [
      { label: "Menu navbar", href: "/admin/menu", icon: MenuIcon },
      { label: "Gallery trang chủ", href: "/admin/gallery", icon: Images },
      { label: "Cài đặt", href: "/admin/cai-dat", icon: Settings },
    ],
  },
]

/** Backward-compat: vẫn export flat list cho các nơi (nếu có) đang dùng. */
export const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((g) => g.items)

// Accordion: chỉ 1 group mở tại 1 thời điểm. Mặc định tất cả đóng;
// khi navigate vào item của group nào → group đó tự mở, group cũ đóng.
const LS_KEY = "admin_sidebar_open_group"

function loadOpenKey(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(LS_KEY)
  } catch {
    return null
  }
}

function saveOpenKey(key: string | null) {
  try {
    if (key === null) localStorage.removeItem(LS_KEY)
    else localStorage.setItem(LS_KEY, key)
  } catch {
    // ignore quota / private mode
  }
}

interface AdminNavLinksProps {
  onNavigate?: () => void
}

/** Dùng lại cả trong sidebar desktop và Sheet mobile */
export function AdminNavLinks({ onNavigate }: AdminNavLinksProps) {
  const pathname = usePathname()
  const { data: pending } = usePendingCounts()
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Group nào chứa route hiện tại
  const activeGroupKey = useMemo(() => {
    for (const g of ADMIN_NAV_GROUPS) {
      if (g.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))) {
        return g.key
      }
    }
    return null
  }, [pathname])

  // Hydrate sau mount: ưu tiên activeGroupKey (route hiện tại) → fallback localStorage.
  // Mỗi lần đổi route sang group khác, cũng tự mở group mới (đóng group cũ).
  useEffect(() => {
    setHydrated(true)
    if (activeGroupKey) {
      setOpenKey(activeGroupKey)
      saveOpenKey(activeGroupKey)
    } else {
      const saved = loadOpenKey()
      setOpenKey(saved)
    }
  }, [activeGroupKey])

  function toggle(key: string) {
    setOpenKey((prev) => {
      const next = prev === key ? null : key
      saveOpenKey(next)
      return next
    })
  }

  return (
    <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
      {ADMIN_NAV_GROUPS.map((group) => {
        const isStandalone = group.label === null
        // Trước hydration: chỉ mở group đứng riêng → tránh flicker SSR
        const isOpen = isStandalone || (hydrated && openKey === group.key)

        return (
          <div key={group.key} className="space-y-0.5">
            {!isStandalone && (
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {group.label}
                  {/* When group is collapsed, a red dot signals that at
                      least one item inside has pending work — so admin
                      notices without needing to expand every accordion. */}
                  {!isOpen && group.items.some((it) => it.pendingKey && (pending?.workflows[it.pendingKey].count ?? 0) > 0) && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform shrink-0",
                    isOpen ? "rotate-0" : "-rotate-90",
                  )}
                />
              </button>
            )}

            {isOpen && (
              <div className="space-y-0.5">
                {group.items.map(({ label, href, icon: Icon, pendingKey }) => {
                  const active = pathname === href || pathname.startsWith(href + "/")
                  const badgeCount = pendingKey ? pending?.workflows[pendingKey].count ?? 0 : 0
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{label}</span>
                      {badgeCount > 0 && (
                        <span
                          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold tabular-nums"
                          title={`${badgeCount} mục chờ xử lý`}
                        >
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Actions */}
      <div className="pt-2 border-t border-sidebar-border space-y-0.5">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Đăng xuất
        </button>

        {/* Exit admin mode — visually distinct */}
        <Link
          href="/"
          onClick={onNavigate}
          title="Thoát khỏi chế độ quản trị, xem website như người dùng bình thường"
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold bg-sidebar-accent/40 text-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ring-1 ring-sidebar-border"
        >
          <Globe className="h-4 w-4 shrink-0" />
          <span className="flex-1">Về trang công khai</span>
          <span className="text-xs opacity-60">↗</span>
        </Link>
      </div>
    </nav>
  )
}

/**
 * Sidebar cố định — chỉ hiển thị từ md (768px) trở lên.
 * Mobile dùng AdminMobileNav.
 */
export function AdminSidebar() {
  return (
    <aside className="hidden md:flex w-56 lg:w-64 shrink-0 flex-col bg-sidebar h-full">
      {/* Header: logo (→ /admin) + notification bell. Bell sits in the
          header so the pending-count badge is visible from every admin
          page without needing a separate top toolbar. */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <Link
          href="/admin"
          className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity"
          title="Trang chủ quản trị"
        >
          <Image
            src="/logo.png"
            alt="Hội Trầm Hương Việt Nam"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0"
            priority
          />
          <div className="min-w-0">
            <p className="text-sidebar-primary font-semibold text-sm leading-tight truncate">
              Hội Trầm Hương
            </p>
            <p className="text-sidebar-foreground/60 text-xs">Quản trị viên</p>
          </div>
        </Link>
        <NotificationBell align="start" />
      </div>

      <AdminNavLinks />
    </aside>
  )
}
