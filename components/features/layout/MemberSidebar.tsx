"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  User,
  Building2,
  BadgeCheck,
  RefreshCw,
  CreditCard,
  FileText,
  FileCheck,
  LogOut,
  Globe,
  ClipboardList,
  Scale,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface VipNavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  /** Ẩn khỏi sidebar khi accountType là INDIVIDUAL (dành cho mục doanh nghiệp) */
  businessOnly?: boolean
}

export const VIP_NAV_ITEMS: VipNavItem[] = [
  { label: "Tổng quan",          href: "/tong-quan",            icon: LayoutDashboard },
  { label: "Hồ sơ cá nhân",      href: "/ho-so",                icon: User },
  { label: "Hồ sơ doanh nghiệp", href: "/doanh-nghiep/chinh-sua", icon: Building2, businessOnly: true },
  { label: "Chứng nhận SP",      href: "/chung-nhan/lich-su",   icon: BadgeCheck, businessOnly: true },
  { label: "Tài liệu",           href: "/tai-lieu",             icon: FileText },
  { label: "Gia hạn",            href: "/gia-han",              icon: RefreshCw },
  { label: "Lịch sử CK",         href: "/thanh-toan/lich-su",   icon: CreditCard },
]

/** VIP chưa kích hoạt / hết hạn — sidebar chỉ có Gia hạn. */
const INACTIVE_VIP_NAV_ITEMS: VipNavItem[] = [
  { label: "Gia hạn",            href: "/gia-han",              icon: RefreshCw },
]

/** GUEST chỉ vào được Đơn kết nạp. */
const GUEST_NAV_ITEMS: VipNavItem[] = [
  { label: "Đơn kết nạp",        href: "/ket-nap",              icon: FileCheck },
]

interface VipNavLinksProps {
  accountType?: "BUSINESS" | "INDIVIDUAL" | null
  /** Role hiện tại — GUEST chỉ thấy Đơn kết nạp */
  role?: "GUEST" | "VIP" | "ADMIN" | "INFINITE" | null
  /** Hội viên còn hiệu lực — false → chỉ hiện mục Gia hạn */
  membershipActive?: boolean
  /** Thành viên Hội đồng thẩm định — có quyền vote các đơn chứng nhận SP */
  isCouncilMember?: boolean
  onNavigate?: () => void
}

const COUNCIL_NAV_ITEM: VipNavItem = {
  label: "Hội đồng thẩm định",
  href: "/hoi-dong/cho-duyet",
  icon: Scale,
}

/** Dùng lại cả trong sidebar desktop và Sheet mobile */
export function VipNavLinks({ accountType, role, membershipActive = true, isCouncilMember = false, onNavigate }: VipNavLinksProps) {
  const pathname = usePathname()
  const baseItems =
    role === "GUEST"
      ? GUEST_NAV_ITEMS
      : !membershipActive
        ? INACTIVE_VIP_NAV_ITEMS
        : VIP_NAV_ITEMS.filter((it) => !it.businessOnly || accountType !== "INDIVIDUAL")
  const items = isCouncilMember && role !== "GUEST" ? [...baseItems, COUNCIL_NAV_ITEM] : baseItems

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {items.map(({ label, href, icon: Icon }) => {
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
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        )
      })}

      {/* Đăng xuất */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
      >
        <LogOut className="h-5 w-5 shrink-0" />
        Đăng xuất
      </button>

      {/* Về trang công khai — visually distinct */}
      <div className="pt-2 mt-2 border-t border-sidebar-border">
        <Link
          href="/"
          onClick={onNavigate}
          title="Thoát khỏi khu vực quản lý, về trang công khai"
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

interface MemberSidebarProps {
  accountType?: "BUSINESS" | "INDIVIDUAL" | null
  role?: "GUEST" | "VIP" | "ADMIN" | "INFINITE" | null
  membershipActive?: boolean
  isCouncilMember?: boolean
}

/**
 * Sidebar cố định cho khu vực quản lý Hội viên — chỉ hiển thị từ md (768px) trở lên.
 * Mobile dùng MemberMobileNav.
 */
export function MemberSidebar({ accountType, role, membershipActive = true, isCouncilMember = false }: MemberSidebarProps) {
  return (
    <aside className="hidden md:flex w-56 lg:w-64 shrink-0 flex-col bg-sidebar h-full">
      <Link
        href="/tong-quan"
        className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border hover:bg-sidebar-accent/40 transition-colors"
        title="Trang chủ khu vực quản lý"
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
          <p className="text-sidebar-foreground/60 text-xs">Khu vực hội viên</p>
        </div>
      </Link>

      <VipNavLinks accountType={accountType} role={role} membershipActive={membershipActive} isCouncilMember={isCouncilMember} />
    </aside>
  )
}
