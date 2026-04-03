import Link from "next/link"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { UserMenu } from "./UserMenu"
import { NavMobile, type NavLink } from "./NavMobile"

// ── Nav links theo role ───────────────────────────────────────────────────────

const GUEST_LINKS: NavLink[] = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Hội viên", href: "/hoi-vien" },
  { label: "Tin từ Hội viên", href: "/feed" },
  { label: "Sản phẩm Chứng nhận", href: "/san-pham-chung-nhan" },
  { label: "Dịch vụ", href: "/dich-vu" },
]

const MEMBER_LINKS: NavLink[] = [
  { label: "Bảng tin", href: "/feed" },
  { label: "Doanh nghiệp", href: "/doanh-nghiep" },
  { label: "Chứng nhận SP", href: "/chung-nhan/nop-don" },
  { label: "Gia hạn", href: "/gia-han" },
  { label: "Hồ sơ", href: "/ho-so" },
]

const ADMIN_LINKS: NavLink[] = [
  { label: "Tổng quan", href: "/admin" },
  { label: "Hội viên", href: "/admin/hoi-vien" },
  { label: "Chứng nhận", href: "/admin/chung-nhan" },
  { label: "Truyền thông", href: "/admin/truyen-thong" },
  { label: "Báo cáo", href: "/admin/bao-cao" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export async function Navbar() {
  const session = await auth()
  const role = session?.user?.role
  const user = session?.user

  const links =
    role === "ADMIN" ? ADMIN_LINKS
    : role === "VIP"   ? MEMBER_LINKS
    :                    GUEST_LINKS

  const homeHref = role === "ADMIN" ? "/dashboard" : role === "VIP" ? "/feed" : "/"

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-800 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href={homeHref} className="flex items-center gap-2 shrink-0">
            <span className="text-brand-400 text-2xl select-none" aria-hidden>🌿</span>
            <span className="font-heading text-brand-100 font-semibold text-lg leading-tight hidden sm:block">
              Hội Trầm Hương<br />
              <span className="text-brand-400 text-xs font-sans font-normal tracking-widest uppercase">
                Việt Nam
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigation chính">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-brand-200 hover:bg-brand-700 hover:text-brand-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <UserMenu
                name={user.name}
                email={user.email}
                image={user.image}
                role={user.role}
              />
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-brand-200 hover:bg-brand-700 hover:text-brand-100 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-md text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-brand-300 transition-colors"
                >
                  Đăng ký hội viên
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <NavMobile links={links} isLoggedIn={!!session} />
          </div>

        </div>
      </div>
    </header>
  )
}
