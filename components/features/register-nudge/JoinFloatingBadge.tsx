import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { locales } from "@/i18n/config"
import { JoinFloatingBadgeClient } from "./JoinFloatingBadgeClient"

/**
 * Floating badge "Đăng ký thành viên" — góc phải-dưới, đè lên BackToTop khi
 * BackToTop hiện. Chỉ render cho user CHƯA đăng nhập, ngoài các trang auth/
 * register (vô nghĩa ở đó).
 *
 * Per-page dismiss: client component reset state khi pathname đổi → đóng
 * trang này, sang trang khác lại hiện (đúng yêu cầu "nhang nhảng").
 */

// Skip trên các trang đã liên quan tới auth/registration
const SKIP_PATTERN = /^\/(dang-ky|tham-gia)(\/.*)?$/

const LOCALE_REGEX = new RegExp(`^/(${locales.join("|")})(?:/|$)`)

function stripLocale(pathname: string): string {
  const m = pathname.match(LOCALE_REGEX)
  if (!m) return pathname
  return pathname.slice(m[1].length + 1) || "/"
}

export async function JoinFloatingBadge() {
  const [session, headersList] = await Promise.all([auth(), headers()])
  if (session?.user) return null

  const pathname = headersList.get("x-pathname") ?? "/"
  const realPath = stripLocale(pathname)
  if (SKIP_PATTERN.test(realPath)) return null

  return <JoinFloatingBadgeClient />
}
