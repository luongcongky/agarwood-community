import Link from "next/link"
import Image from "next/image"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMenuTree } from "@/lib/menu"
import { UserMenu } from "./UserMenu"
import { NavMobile } from "./NavMobile"
import { NavDesktopMenu } from "./NavDesktopItem"
import { SocialLinks } from "./SocialLinks"
import { LocaleSwitcher } from "./LocaleSwitcher"
import { isValidLocale, defaultLocale, type Locale } from "@/i18n/config"

// ── Mode detection ────────────────────────────────────────────────────────────

/** Routes thuộc khu vực quản lý Hội viên — Navbar này KHÔNG render trên các route này
 *  (có sidebar riêng ở app/(vip)/layout.tsx). Dùng để hide social icons nếu vô
 *  tình render, và để UserMenu biết đang ở đâu. */
const VIP_ADMIN_PREFIXES = [
  "/tong-quan",
  "/gia-han",
  "/ho-so",
  "/chung-nhan",
  "/doanh-nghiep-cua-toi",
  "/doanh-nghiep/chinh-sua",
  "/thanh-toan",
  "/ket-nap",
  "/tai-lieu",
  "/certification",
  "/company",
]

const ADMIN_PREFIXES = ["/admin"]

type NavMode = "public" | "vip-admin" | "admin"

function detectMode(pathname: string): NavMode {
  if (ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return "admin"
  }
  if (VIP_ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return "vip-admin"
  }
  return "public"
}

// Menu items được CMS-driven (model MenuItem). Xem lib/menu.ts.

// ── Component ─────────────────────────────────────────────────────────────────

export async function Navbar() {
  const [session, headersList] = await Promise.all([auth(), headers()])
  const role = session?.user?.role
  const user = session?.user
  const pathname = headersList.get("x-pathname") ?? "/"
  const mode = detectMode(pathname)
  const headerLocale = headersList.get("x-locale")
  const locale: Locale = headerLocale && isValidLocale(headerLocale) ? headerLocale : defaultLocale

  // Fetch accountType cho VIP users + social links + menu tree (1 round-trip)
  const [dbUser, socialConfigs, menuTree] = await Promise.all([
    session?.user?.id && role === "VIP"
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { accountType: true },
        })
      : Promise.resolve(null),
    prisma.siteConfig.findMany({
      where: { key: { in: ["facebook_url", "youtube_url"] } },
    }),
    getMenuTree(),
  ])

  const accountType = role === "VIP" ? dbUser?.accountType ?? "BUSINESS" : null
  const expires = session?.user?.membershipExpires
  const membershipActive =
    role === "INFINITE" || role === "ADMIN"
      ? true
      : role === "VIP" && !!expires && new Date(expires) > new Date()
  const socialMap = Object.fromEntries(socialConfigs.map((c) => [c.key, c.value]))
  const facebookUrl = socialMap.facebook_url || null
  const youtubeUrl = socialMap.youtube_url || null


  return (
    <header className="sticky top-0 z-50 w-full bg-brand-800 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo — luôn về trang chủ */}
          <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.png"
              alt="Hội Trầm Hương Việt Nam"
              width={48}
              height={48}
              className="h-11 w-11 shrink-0"
              priority
            />
            <span className="text-brand-100 font-semibold text-lg leading-tight hidden sm:block">
              Hội Trầm Hương<br />
              <span className="text-brand-400 text-xs font-sans font-normal tracking-widest uppercase">
                Việt Nam
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation chính">
            <NavDesktopMenu tree={menuTree} />
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            {mode === "public" && (
              <LocaleSwitcher current={locale} />
            )}

            {/* Social icons luôn hiển thị ở navbar công khai */}
            <div className="hidden lg:flex">
              <SocialLinks facebookUrl={facebookUrl} youtubeUrl={youtubeUrl} variant="navbar" />
            </div>

            {user ? (
              <UserMenu
                name={user.name}
                email={user.email}
                image={user.image}
                role={user.role}
                accountType={accountType}
                mode={mode}
                membershipActive={membershipActive}
              />
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  href={`/${locale}/login`}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-brand-200 hover:bg-brand-700 hover:text-brand-100 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href={`/${locale}/dang-ky`}
                  className="px-3 py-1.5 rounded-md text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-brand-300 transition-colors"
                >
                  Đăng ký hội viên
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <NavMobile menu={menuTree} isLoggedIn={!!session} />
          </div>

        </div>
      </div>
    </header>
  )
}
