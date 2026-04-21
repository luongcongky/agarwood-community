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
import { LocaleFlags } from "./LocaleFlags"
import { isValidLocale, defaultLocale, type Locale } from "@/i18n/config"
import { localize } from "@/i18n/localize"
import type { MenuNode } from "@/lib/menu"

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

  // Internal routes that live outside [locale] — must NOT get locale prefix
  const INTERNAL_PREFIXES = [
    "/tong-quan", "/admin", "/dashboard", "/ho-so",
    "/gia-han", "/chung-nhan", "/company", "/doanh-nghiep-cua-toi",
    "/doanh-nghiep/chinh-sua", "/san-pham/tao-moi", "/certification",
    "/thanh-toan", "/ket-nap", "/tai-lieu", "/members", "/certifications",
    "/media-orders",
  ]
  function isInternalHref(href: string): boolean {
    return INTERNAL_PREFIXES.some((p) => href === p || href.startsWith(p + "/"))
  }

  // Localize menu labels + prefix locale into href + matchPrefixes (skip internal routes)
  function prefixHref(href: string): string {
    if (isInternalHref(href)) return href
    return href === "/" ? `/${locale}` : `/${locale}${href}`
  }
  function localizeMenu(nodes: MenuNode[]): MenuNode[] {
    return nodes.map((n) => ({
      ...n,
      label: localize(n, "label", locale) as string,
      href: prefixHref(n.href),
      matchPrefixes: n.matchPrefixes.map((p) => isInternalHref(p) ? p : `/${locale}${p}`),
      children: localizeMenu(n.children),
    }))
  }
  const localizedMenu = localizeMenu(menuTree)

  const accountType = role === "VIP" ? dbUser?.accountType ?? "BUSINESS" : null
  const expires = session?.user?.membershipExpires
  const membershipActive =
    role === "INFINITE" || role === "ADMIN"
      ? true
      : role === "VIP" && !!expires && new Date(expires) > new Date()
  const socialMap = Object.fromEntries(socialConfigs.map((c) => [c.key, c.value]))
  const facebookUrl = socialMap.facebook_url || null
  const youtubeUrl = socialMap.youtube_url || null
  const hasSocial = Boolean(facebookUrl || youtubeUrl)
  const showLocaleFlags = mode === "public"

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* ── Line 1: Utility bar (desktop only) ───────────────────────────── */}
      <div className="hidden lg:block bg-brand-900 border-b border-brand-700/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between gap-4">
            {/* Logo + brand */}
            <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0">
              <Image
                src="/logo.png"
                alt="Hội Trầm Hương Việt Nam"
                width={40}
                height={40}
                className="h-9 w-9 shrink-0"
                priority
              />
              <span className="text-brand-100 font-semibold text-base leading-tight">
                Hội Trầm Hương
                <span className="ml-1.5 text-brand-400 text-[10px] font-sans font-normal tracking-widest uppercase">
                  Việt Nam
                </span>
              </span>
            </Link>

            {/* Right utility cluster: social | language | user/login */}
            <div className="flex items-center gap-2">
              {hasSocial && (
                <>
                  <SocialLinks
                    facebookUrl={facebookUrl}
                    youtubeUrl={youtubeUrl}
                    variant="navbar"
                  />
                  <div className="h-5 w-px bg-brand-700" aria-hidden="true" />
                </>
              )}

              {showLocaleFlags && (
                <>
                  <LocaleFlags current={locale} />
                  <div className="h-5 w-px bg-brand-700" aria-hidden="true" />
                </>
              )}

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
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/${locale}/login`}
                    className="whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium text-brand-200 hover:bg-brand-700 hover:text-brand-100 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href={`/${locale}/dang-ky`}
                    className="whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-brand-300 transition-colors"
                  >
                    Đăng ký hội viên
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Line 2: Main nav (mobile: also holds logo + hamburger) ──────── */}
      <div className="bg-brand-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 lg:h-12 items-center gap-3">
            {/* Mobile-only logo */}
            <Link
              href={`/${locale}`}
              className="flex lg:hidden items-center gap-2 shrink-0"
            >
              <Image
                src="/logo.png"
                alt="Hội Trầm Hương Việt Nam"
                width={40}
                height={40}
                className="h-9 w-9 shrink-0"
                priority
              />
              <span className="text-brand-100 font-semibold text-sm leading-tight hidden sm:block">
                Hội Trầm Hương<br />
                <span className="text-brand-400 text-[10px] font-sans font-normal tracking-widest uppercase">
                  Việt Nam
                </span>
              </span>
            </Link>

            {/* Desktop main nav */}
            <nav
              className="hidden lg:flex items-center gap-1 flex-1"
              aria-label="Navigation chính"
            >
              <NavDesktopMenu tree={localizedMenu} />
            </nav>

            {/* Mobile right side: user + hamburger */}
            <div className="flex lg:hidden items-center gap-2 ml-auto">
              {user && (
                <UserMenu
                  name={user.name}
                  email={user.email}
                  image={user.image}
                  role={user.role}
                  accountType={accountType}
                  mode={mode}
                  membershipActive={membershipActive}
                />
              )}
              <NavMobile
                menu={localizedMenu}
                isLoggedIn={!!session}
                currentLocale={locale}
                facebookUrl={facebookUrl}
                youtubeUrl={youtubeUrl}
                showLocaleFlags={showLocaleFlags}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
