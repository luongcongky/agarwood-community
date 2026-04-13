"use client"

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
} from "lucide-react"
import { cn } from "@/lib/utils"

export const ADMIN_NAV_ITEMS = [
  { label: "Tổng quan",    href: "/admin",             icon: LayoutDashboard },
  { label: "Hội viên",     href: "/admin/hoi-vien",    icon: Users },
  { label: "Ban lãnh đạo",  href: "/admin/ban-lanh-dao", icon: Crown },
  { label: "Đơn kết nạp",  href: "/admin/hoi-vien/don-ket-nap", icon: FileCheck },
  { label: "Chứng nhận",   href: "/admin/chung-nhan",  icon: BadgeCheck },
  { label: "Tiêu biểu",    href: "/admin/tieu-bieu",   icon: Star },
  { label: "Banner QC",    href: "/admin/banner",      icon: ImageIcon },
  { label: "Truyền thông", href: "/admin/truyen-thong", icon: Megaphone },
  { label: "Xác nhận CK",  href: "/admin/thanh-toan",  icon: BadgeCheck },
  { label: "Báo cáo",      href: "/admin/bao-cao",     icon: Flag },
  { label: "Tài liệu",     href: "/admin/tai-lieu",    icon: FileText },
  { label: "Văn bản pháp quy", href: "/admin/phap-ly", icon: Scale },
  { label: "Tin tức",      href: "/admin/tin-tuc",     icon: Newspaper },
  { label: "Khảo sát",     href: "/admin/khao-sat",    icon: ClipboardList },
  { label: "Tư vấn",       href: "/admin/tu-van",      icon: Headset },
  { label: "Cài đặt",      href: "/admin/cai-dat",     icon: Settings },
]

interface AdminNavLinksProps {
  onNavigate?: () => void
}

/** Dùng lại cả trong sidebar desktop và Sheet mobile */
export function AdminNavLinks({ onNavigate }: AdminNavLinksProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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

      {/* Actions nằm liền kề sau "Cài đặt" */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
      >
        <LogOut className="h-5 w-5 shrink-0" />
        Đăng xuất
      </button>

      {/* Exit admin mode — visually distinct để admin dễ tìm */}
      <div className="pt-2 mt-2 border-t border-sidebar-border">
        <Link
          href="/"
          onClick={onNavigate}
          title="Thoát khỏi chế độ quản trị, xem website như người dùng bình thường"
          className="flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-semibold bg-sidebar-accent/40 text-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ring-1 ring-sidebar-border"
        >
          <Globe className="h-5 w-5 shrink-0" />
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
