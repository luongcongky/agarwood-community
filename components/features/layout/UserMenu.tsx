"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { signOut } from "next-auth/react"
import { LogOut, FileCheck, LayoutDashboard, Globe, RefreshCw, ShieldCheck, Building2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Role } from "@prisma/client"

export type NavMode = "public" | "vip-admin" | "admin"

interface UserMenuProps {
  name: string | null | undefined
  email: string | null | undefined
  image: string | null | undefined
  role: Role
  accountType?: string | null
  /** Mode hiện tại của Navbar — quyết định menu item "Vào khu vực quản trị" / "Về trang công khai" */
  mode?: NavMode
  /** Hội viên VIP còn hiệu lực — false → dropdown chỉ có item Gia hạn */
  membershipActive?: boolean
  /** Nếu user là đại diện doanh nghiệp (có Company record với ownerId=user.id),
   *  truyền `{ name, slug }` để dropdown hiện item "Quản lý doanh nghiệp" trỏ
   *  vào trang public profile `/{locale}/doanh-nghiep/{slug}`. Null/undefined
   *  → không hiện item. */
  company?: { name: string; slug: string } | null
  /** Layout style của trigger:
   *  - "dark" (default): dùng trong Navbar nâu đậm — avatar nhỏ, text cream
   *  - "light": dùng trong SiteHeader masthead trắng — avatar to bằng logo
   *    Hội (56–64px), tên user hiển thị TRƯỚC avatar với style match H1 masthead
   *    (text-brand-900 font-black uppercase tracking-tight). */
  variant?: "dark" | "light"
}

const roleLabel: Record<Role, string> = {
  GUEST: "Tài khoản cơ bản",
  VIP: "Hội viên",
  ADMIN: "Quản trị",
  INFINITE: "Quản trị",
}

const roleBadgeClass: Record<Role, string> = {
  GUEST: "bg-muted text-muted-foreground",
  VIP: "bg-secondary text-secondary-foreground",
  ADMIN: "bg-primary text-primary-foreground",
  INFINITE: "bg-primary text-primary-foreground",
}

export function UserMenu({ name, email, image, role, mode = "public", membershipActive = true, company, variant = "dark" }: UserMenuProps) {
  const router = useRouter()
  const locale = useLocale()
  const initials = name?.trim()
    ? name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).slice(-2).join("").toUpperCase()
    : "?"

  const showExitToPublic = mode === "vip-admin" || mode === "admin"

  // VIP chưa kích hoạt / hết hạn → dropdown chỉ có "Gia hạn" (bỏ qua INFINITE/ADMIN)
  const isInactiveVip = role === "VIP" && !membershipActive
  // INFINITE thấy cả "Quản lý cá nhân" + "Quản lý admin"
  const isInfinite = role === "INFINITE"
  // ADMIN chuyên dụng
  const isPureAdmin = role === "ADMIN"

  const isLight = variant === "light"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {isLight ? (
          <>
            {/* Tên TRƯỚC avatar, màu match H1 "HỘI TRẦM HƯƠNG VIỆT NAM" */}
            <span className="hidden sm:inline-block max-w-[180px] truncate text-right text-sm font-black uppercase tracking-tight text-brand-900 sm:text-base lg:text-[17px]">
              {name}
            </span>
            <Avatar className="h-10 w-10 border-2 border-brand-700 lg:h-11 lg:w-11">
              <AvatarImage src={image ?? undefined} alt={name ?? ""} />
              <AvatarFallback className="bg-brand-700 text-brand-100 text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </>
        ) : (
          <>
            <Avatar className="h-8 w-8 border-2 border-brand-400">
              <AvatarImage src={image ?? undefined} alt={name ?? ""} />
              <AvatarFallback className="bg-brand-700 text-brand-100 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium text-brand-100 max-w-[120px] truncate">
              {name}
            </span>
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="font-semibold truncate">{name}</span>
            <span className="text-xs text-muted-foreground font-normal truncate">{email}</span>
            <Badge className={`w-fit text-xs mt-1 ${roleBadgeClass[role]}`}>
              {roleLabel[role]}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* GUEST: vẫn cho nộp đơn kết nạp để thành hội viên */}
        {role === "GUEST" && (
          <DropdownMenuItem onClick={() => router.push("/ket-nap")}>
            <FileCheck className="mr-2 h-4 w-4" />
            Đơn kết nạp Hội viên
          </DropdownMenuItem>
        )}

        {/* VIP chưa kích hoạt / hết hạn: chỉ có duy nhất nút Gia hạn */}
        {isInactiveVip && (
          <DropdownMenuItem
            onClick={() => router.push("/gia-han")}
            className="font-semibold text-brand-700 focus:text-brand-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Gia hạn hội viên
          </DropdownMenuItem>
        )}

        {/* VIP active, INFINITE, ADMIN: link vào khu vực tương ứng */}
        {!isInactiveVip && role !== "GUEST" && mode === "public" && (
          <>
            {(role === "VIP" || isInfinite) && (
              <DropdownMenuItem
                onClick={() => router.push("/tong-quan")}
                className="font-semibold text-brand-700 focus:text-brand-800"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Quản lý cá nhân
              </DropdownMenuItem>
            )}
            {(isInfinite || isPureAdmin) && (
              <DropdownMenuItem
                onClick={() => router.push("/admin")}
                className="font-semibold text-brand-700 focus:text-brand-800"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Quản lý admin
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* Đại diện doanh nghiệp → link tới trang public profile của DN.
            Chỉ hiện khi user có Company (ownerId=user.id). Item này hiện ở
            mọi mode (public / vip-admin / admin) để đại diện luôn truy cập
            nhanh được. Ẩn với VIP hết hạn vì proxy sẽ redirect /gia-han.
            Locale prefix đi qua `useLocale()` — tránh 1 redirect vòng của
            proxy khi push path không prefix. */}
        {company && !isInactiveVip && role !== "GUEST" && (
          <DropdownMenuItem
            onClick={() => router.push(`/${locale}/doanh-nghiep/${company.slug}`)}
            className="font-semibold text-brand-700 focus:text-brand-800"
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">
              Quản lý doanh nghiệp
              <span className="block text-[11px] font-normal text-muted-foreground truncate">
                {company.name}
              </span>
            </span>
          </DropdownMenuItem>
        )}

        {/* Khi đang ở bên trong khu vực quản lý/quản trị → cho đường ra trang công khai.
            INFINITE đang ở một khu thì vẫn thấy link sang khu còn lại. */}
        {!isInactiveVip && showExitToPublic && (
          <>
            {isInfinite && mode === "vip-admin" && (
              <DropdownMenuItem
                onClick={() => router.push("/admin")}
                className="font-semibold text-brand-700 focus:text-brand-800"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Quản lý admin
              </DropdownMenuItem>
            )}
            {isInfinite && mode === "admin" && (
              <DropdownMenuItem
                onClick={() => router.push("/tong-quan")}
                className="font-semibold text-brand-700 focus:text-brand-800"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Quản lý cá nhân
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => router.push("/")}
              className="font-semibold text-brand-700 focus:text-brand-800"
            >
              <Globe className="mr-2 h-4 w-4" />
              Về trang công khai
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
