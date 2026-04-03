import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth.config"
import type { Role } from "@prisma/client"

// Khởi tạo với authConfig (Edge-safe, không có prisma)
const { auth } = NextAuth(authConfig)

// ── Route definitions ────────────────────────────────────────────────────────

/** Chỉ VIP (còn hạn) + ADMIN mới vào được — /feed là public (guest xem blur) */
const MEMBER_PREFIXES = [
  "/feed/tao-bai",
  "/company",
  "/certification",
  "/gia-han",
  "/ho-so",
  "/chung-nhan",
  "/thanh-toan/lich-su",
]

/** Chỉ ADMIN mới vào được */
const ADMIN_PREFIXES = [
  "/dashboard",
  "/members",
  "/certifications",
  "/media-orders",
  "/admin",
]

/** Redirect sang feed/dashboard nếu đã đăng nhập */
const AUTH_PATHS = ["/login", "/register"]

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

  // ── 1. Auth routes: redirect nếu đã đăng nhập ──────────────────────────
  if (AUTH_PATHS.includes(pathname)) {
    if (session) {
      const dest = role === "ADMIN" ? "/admin" : "/feed"
      return NextResponse.redirect(new URL(dest, req.url))
    }
    return NextResponse.next()
  }

  // ── 2. Admin routes: chỉ ADMIN ─────────────────────────────────────────
  if (matchesAny(pathname, ADMIN_PREFIXES)) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  // ── 3. Member routes: VIP (còn hạn) + ADMIN ────────────────────────────
  if (matchesAny(pathname, MEMBER_PREFIXES)) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
    }
    if (role === "GUEST") {
      // Đã đăng nhập nhưng chưa là hội viên
      return NextResponse.redirect(new URL("/register", req.url))
    }
    if (role === "VIP" && !isMembershipValid(membershipExpires)) {
      // Hội viên hết hạn — cần gia hạn
      return NextResponse.redirect(new URL("/membership-expired", req.url))
    }
    return NextResponse.next()
  }

  // ── 4. Public routes: cho qua ──────────────────────────────────────────
  return NextResponse.next()
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
