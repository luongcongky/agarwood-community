"use client"

import Link from "next/link"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

export const ADMIN_NAV_ITEMS = [
  { label: "Tổng quan",    href: "/admin",             icon: LayoutDashboard },
  { label: "Hội viên",     href: "/admin/hoi-vien",    icon: Users },
  { label: "Chứng nhận",   href: "/admin/chung-nhan",  icon: BadgeCheck },
  { label: "Truyền thông", href: "/admin/truyen-thong", icon: Megaphone },
  { label: "Xác nhận CK",  href: "/admin/thanh-toan",  icon: BadgeCheck },
  { label: "Báo cáo",      href: "/admin/bao-cao",     icon: Flag },
  { label: "Tin tức",      href: "/admin/tin-tuc",     icon: Newspaper },
  { label: "Cài đặt",      href: "/admin/cai-dat",     icon: Settings },
]

interface AdminNavLinksProps {
  onNavigate?: () => void
}

/** Dùng lại cả trong sidebar desktop và Sheet mobile */
export function AdminNavLinks({ onNavigate }: AdminNavLinksProps) {
  const pathname = usePathname()

  return (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {ADMIN_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 px-3 py-3 rounded-md text-base text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Đăng xuất
        </button>
      </div>
    </>
  )
}

/**
 * Sidebar cố định — chỉ hiển thị từ md (768px) trở lên.
 * Mobile dùng AdminMobileNav.
 */
export function AdminSidebar() {
  return (
    <aside className="hidden md:flex w-56 lg:w-64 shrink-0 flex-col bg-sidebar min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <span className="text-xl" aria-hidden>🌿</span>
        <div>
          <p className="text-sidebar-primary font-heading font-semibold text-sm leading-tight">
            Hội Trầm Hương
          </p>
          <p className="text-sidebar-foreground/60 text-xs">Quản trị viên</p>
        </div>
      </div>

      <AdminNavLinks />
    </aside>
  )
}
