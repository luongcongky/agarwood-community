import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth.config"
import { isAdmin } from "@/lib/roles"
import type { Role } from "@prisma/client"
import { locales, defaultLocale, isValidLocale, type Locale } from "@/i18n/config"

// Khởi tạo với authConfig (Edge-safe, không có prisma)
const { auth } = NextAuth(authConfig)

// ── Route definitions ────────────────────────────────────────────────────────

/**
 * Chỉ VIP (còn hạn) + ADMIN mới vào được.
 *
 * Phase 2: `/feed/tao-bai` đã được mở cho mọi user đăng nhập (kể cả GUEST).
 * Quota tháng được enforce ở API layer (`POST /api/posts`), không phải proxy.
 * Page tự check session và redirect /login nếu chưa đăng nhập.
 */
const MEMBER_PREFIXES = [
  "/tong-quan",
  "/company",
  "/doanh-nghiep-cua-toi",
  "/doanh-nghiep/chinh-sua",
  "/san-pham/tao-moi",
  "/certification",
  "/gia-han",
  "/ho-so",
  "/chung-nhan",
  "/chung-nhan/lich-su",
  "/thanh-toan/lich-su",
  "/tai-lieu",
]

/** Routes mọi user đăng nhập đều vào được (kể cả GUEST), nhưng không cho khách lạ */
const LOGGED_IN_PREFIXES = [
  "/feed/tao-bai",
  "/banner/dang-ky",   // Phase 6: mọi user đăng ký banner
  "/banner/lich-su",   // Phase 6: xem lịch sử banner của mình
]

/** Chỉ ADMIN mới vào được */
const ADMIN_PREFIXES = [
  "/dashboard",
  "/members",
  "/certifications",
  "/media-orders",
  "/admin",
]

/**
 * Redirect sang feed/dashboard nếu đã đăng nhập.
 * CHỦ Ý: `/dat-mat-khau` KHÔNG nằm ở đây — trang này xác thực qua token trong URL,
 * không phụ thuộc session. Nếu admin đang login mà click link đặt mật khẩu của
 * tài khoản mới tạo, proxy không được redirect đi.
 */
const AUTH_PATHS = ["/login", "/register", "/dang-ky", "/cho-duyet"]

// ── Helpers ──────────────────────────────────────────────────────────────────

function matchesAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function isMembershipValid(membershipExpires: string | null | undefined): boolean {
  if (!membershipExpires) return false
  return new Date(membershipExpires) > new Date()
}

// ── i18n helpers ─────────────────────────────────────────────────────────────

/** Locale prefix regex: /vi, /en, /zh at the start of pathname */
const localeRegex = new RegExp(`^/(${locales.join("|")})(?:/|$)`)

/**
 * Extract locale from pathname. Returns { locale, pathnameWithoutLocale }.
 * If no locale prefix found, returns null (caller decides what to do).
 */
function extractLocale(pathname: string): { locale: Locale; rest: string } | null {
  const match = pathname.match(localeRegex)
  if (!match) return null
  const locale = match[1] as Locale
  const rest = pathname.slice(match[1].length + 1) || "/"
  return { locale, rest }
}

/**
 * Detect if a pathname (without locale prefix) belongs to an internal
 * section that does NOT get locale routing (admin, member, vip).
 */
function isInternalRoute(pathname: string): boolean {
  return (
    matchesAny(pathname, ADMIN_PREFIXES) ||
    matchesAny(pathname, MEMBER_PREFIXES) ||
    matchesAny(pathname, LOGGED_IN_PREFIXES) ||
    pathname.startsWith("/thanh-toan/thanh-cong") ||
    pathname.startsWith("/api/")
  )
}

// ── Proxy ────────────────────────────────────────────────────────────────────
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const role = session?.user?.role as Role | undefined
  const membershipExpires = session?.user?.membershipExpires

  // ── 0. i18n locale routing ──────────────────────────────────────────────
  //
  // Internal routes (admin, member, vip, api, feed) bypass locale routing.
  // Public/auth routes get locale prefix: /vi/..., /en/..., /zh/...
  // Default locale = vi. If no prefix on a public route → redirect to /vi/...

  // Internal routes: no locale prefix in URL, but still pass locale via header
  // so server/client components can render translated static text.
  if (isInternalRoute(pathname)) {
    const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value
    const internalLocale = cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : defaultLocale
    const res = NextResponse.next()
    res.headers.set("x-pathname", pathname)
    res.headers.set("x-locale", internalLocale)
    return res
  }

  // Extract locale from URL prefix
  const localeInfo = extractLocale(pathname)
  const locale: Locale = localeInfo?.locale ?? defaultLocale
  // The real pathname after stripping locale prefix (used for auth checks below)
  const realPathname: string = localeInfo?.rest ?? pathname

  // If public/auth route has no locale prefix → redirect with locale from cookie or default.
  // This preserves the user's chosen language when internal links omit the locale prefix.
  if (!localeInfo) {
    const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value
    const preferredLocale = cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : defaultLocale
    const url = req.nextUrl.clone()
    url.pathname = `/${preferredLocale}${pathname}`
    return NextResponse.redirect(url)
  }

  // Attach locale + original pathname for layout/components
  const passThrough = () => {
    const res = NextResponse.next()
    res.headers.set("x-pathname", realPathname)
    res.headers.set("x-locale", locale)
    return res
  }

  // ── 1. Auth routes: redirect nếu đã đăng nhập ──────────────────────────
  if (AUTH_PATHS.includes(realPathname)) {
    if (session) {
      // Phase 2: GUEST không còn bị "chờ duyệt" — họ là member tự do, post được ngay.
      // /cho-duyet vẫn truy cập được nếu cần (legacy users), nhưng không bị force redirect.
      if (realPathname === "/cho-duyet") return NextResponse.next()

      // Mọi role đều về homepage viewer mode khi visit auth page đã login
      // (khách hàng yêu cầu: login xong luôn landing ở public home trước).
      // Admin/VIP tự điều hướng vào /admin hoặc /tong-quan từ menu.
      return NextResponse.redirect(new URL(`/${locale}`, req.url))
    }
    return passThrough()
  }

  // ── 2. Admin routes: chỉ ADMIN (should not reach here, but safety check) ──
  if (matchesAny(realPathname, ADMIN_PREFIXES)) {
    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/login?callbackUrl=${realPathname}`, req.url))
    }
    if (!isAdmin(role)) {
      return NextResponse.redirect(new URL(`/${locale}`, req.url))
    }
    return passThrough()
  }

  // ── 3. Member routes: VIP (còn hạn) + ADMIN ────────────────────────────
  if (matchesAny(realPathname, MEMBER_PREFIXES)) {
    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/login?callbackUrl=${realPathname}`, req.url))
    }
    if (role === "GUEST") {
      return NextResponse.redirect(new URL(`/${locale}/landing`, req.url))
    }
    if (role === "VIP" && !isMembershipValid(membershipExpires)) {
      const allowInactive = realPathname === "/gia-han" || realPathname.startsWith("/gia-han/") ||
                            realPathname.startsWith("/thanh-toan")
      if (!allowInactive) {
        return NextResponse.redirect(new URL("/gia-han", req.url))
      }
    }
    return passThrough()
  }

  // ── 4. Logged-in routes ─────────────────────────────────────────────────
  if (matchesAny(realPathname, LOGGED_IN_PREFIXES)) {
    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/login?callbackUrl=${realPathname}`, req.url))
    }
    return passThrough()
  }

  // ── 5. Public routes: cho qua ──────────────────────────────────────────
  return passThrough()
})

export default proxy

export const config = {
  matcher: [
    /*
     * Chạy trên tất cả request trừ:
     * - /api/* (route handlers tự call `auth()` khi cần — proxy không add gì hữu ích)
     * - /_next/static, /_next/image (Next.js assets)
     * - /favicon.ico, /robots.txt, /sitemap.xml (static files)
     * - Static assets in /public (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:webp|jpg|jpeg|png|gif|svg|ico|css|js|woff2?|ttf|eot)).*)",
  ],
}
