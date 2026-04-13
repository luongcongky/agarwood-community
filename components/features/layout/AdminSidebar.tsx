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
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Nav structure ──────────────────────────────────────────────────────────
//
// Mỗi group có `key` ổn định (dùng cho localStorage). Group có `items` rỗng
// được render như link đơn lẻ (không có header).

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
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
      { label: "Đơn kết nạp", href: "/admin/hoi-vien/don-ket-nap", icon: FileCheck },
      { label: "Ban lãnh đạo", href: "/admin/ban-lanh-dao", icon: Crown },
    ],
  },
  {
    key: "products",
    label: "Sản phẩm & Chứng nhận",
    items: [
      { label: "Chứng nhận", href: "/admin/chung-nhan", icon: BadgeCheck },
      { label: "Tiêu biểu", href: "/admin/tieu-bieu", icon: Star },
    ],
  },
  {
    key: "content",
    label: "Nội dung & Truyền thông",
    items: [
      { label: "Tin tức", href: "/admin/tin-tuc", icon: Newspaper },
      { label: "Tài liệu", href: "/admin/tai-lieu", icon: FileText },
      { label: "Văn bản pháp quy", href: "/admin/phap-ly", icon: Scale },
      { label: "Truyền thông", href: "/admin/truyen-thong", icon: Megaphone },
      { label: "Banner QC", href: "/admin/banner", icon: ImageIcon },
    ],
  },
  {
    key: "interaction",
    label: "Tương tác",
    items: [
      { label: "Báo cáo", href: "/admin/bao-cao", icon: Flag },
      { label: "Khảo sát", href: "/admin/khao-sat", icon: ClipboardList },
      { label: "Tư vấn", href: "/admin/tu-van", icon: Headset },
    ],
  },
  {
    key: "partners-finance",
    label: "Đối tác & Tài chính",
    items: [
      { label: "Đối tác", href: "/admin/doi-tac", icon: Handshake },
      { label: "Xác nhận CK", href: "/admin/thanh-toan", icon: BadgeCheck },
    ],
  },
  {
    key: "system",
    label: "Hệ thống",
    items: [{ label: "Cài đặt", href: "/admin/cai-dat", icon: Settings }],
  },
]

/** Backward-compat: vẫn export flat list cho các nơi (nếu có) đang dùng. */
export const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((g) => g.items)

const LS_KEY = "admin_sidebar_collapsed"

function loadCollapsed(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === "string")) : new Set()
  } catch {
    return new Set()
  }
}

function saveCollapsed(set: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]))
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
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  // Hydrate từ localStorage sau mount để tránh mismatch SSR
  useEffect(() => {
    setCollapsed(loadCollapsed())
    setHydrated(true)
  }, [])

  // Group nào chứa route hiện tại — luôn force expand
  const activeGroupKey = useMemo(() => {
    for (const g of ADMIN_NAV_GROUPS) {
      if (g.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))) {
        return g.key
      }
    }
    return null
  }, [pathname])

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      saveCollapsed(next)
      return next
    })
  }

  return (
    <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
      {ADMIN_NAV_GROUPS.map((group) => {
        const isStandalone = group.label === null
        // Trước hydration: mặc định expand tất cả → không bị flicker lúc render server
        const isOpen =
          !hydrated || isStandalone || group.key === activeGroupKey || !collapsed.has(group.key)

        return (
          <div key={group.key} className="space-y-0.5">
            {!isStandalone && (
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
              >
                <span>{group.label}</span>
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
                {group.items.map(({ label, href, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + "/")
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
                      {label}
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
      {/* Header — click logo để về trang chủ quản trị */}
      <Link
        href="/admin"
        className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border hover:bg-sidebar-accent/40 transition-colors"
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
        <div>
          <p className="text-sidebar-primary font-semibold text-sm leading-tight">
            Hội Trầm Hương
          </p>
          <p className="text-sidebar-foreground/60 text-xs">Quản trị viên</p>
        </div>
      </Link>

      <AdminNavLinks />
    </aside>
  )
}
