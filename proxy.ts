import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth.config"
import { isAdmin } from "@/lib/roles"
import type { Role } from "@prisma/client"

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

// ── Proxy ────────────────────────────────────────────────────────────────────
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const role = session?.user?.role as Role | undefined
  const membershipExpires = session?.user?.membershipExpires

  // Attach pathname to response header để server component (Navbar)
  // có thể đọc và quyết định mode
  const passThrough = () => {
    const res = NextResponse.next()
    res.headers.set("x-pathname", pathname)
    return res
  }

  // ── 1. Auth routes: redirect nếu đã đăng nhập ──────────────────────────
  if (AUTH_PATHS.includes(pathname)) {
    if (session) {
      // Phase 2: GUEST không còn bị "chờ duyệt" — họ là member tự do, post được ngay.
      // /cho-duyet vẫn truy cập được nếu cần (legacy users), nhưng không bị force redirect.
      if (pathname === "/cho-duyet") return NextResponse.next()

      const dest =
        isAdmin(role) ? "/admin"
        : role === "VIP" ? "/tong-quan"
        : "/feed"
      return NextResponse.redirect(new URL(dest, req.url))
    }
    return passThrough()
  }

  // ── 2. Admin routes: chỉ ADMIN ─────────────────────────────────────────
  if (matchesAny(pathname, ADMIN_PREFIXES)) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
    }
    if (!isAdmin(role)) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return passThrough()
  }

  // ── 3. Member routes: VIP (còn hạn) + ADMIN ────────────────────────────
  if (matchesAny(pathname, MEMBER_PREFIXES)) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
    }
    if (role === "GUEST") {
      // GUEST không có quyền vào VIP-only routes — hướng tới landing page nâng cấp VIP
      return NextResponse.redirect(new URL("/landing", req.url))
    }
    // INFINITE & ADMIN: bỏ qua check hạn membership
    if (role === "VIP" && !isMembershipValid(membershipExpires)) {
      // Cho phép VIP chưa kích hoạt / hết hạn vào /gia-han (để nạp tiền) và
      // /thanh-toan/lich-su (xem lịch sử CK). Các route VIP khác → chặn.
      const allowInactive = pathname === "/gia-han" || pathname.startsWith("/gia-han/") ||
                            pathname.startsWith("/thanh-toan")
      if (!allowInactive) {
        return NextResponse.redirect(new URL("/gia-han", req.url))
      }
    }
    return passThrough()
  }

  // ── 4. Logged-in routes: bất kỳ user đã đăng nhập (Phase 2: /feed/tao-bai) ─
  if (matchesAny(pathname, LOGGED_IN_PREFIXES)) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
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
     * - /api/auth/* (NextAuth handlers)
     * - /_next/static, /_next/image (Next.js assets)
     * - /favicon.ico, /robots.txt, /sitemap.xml (static files)
     */
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
}
