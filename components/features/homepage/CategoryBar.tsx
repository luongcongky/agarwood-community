"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { locales } from "@/i18n/config"

type NavItem =
  | { label: string; href: string; children?: never }
  | { label: string; href: string; children: { label: string; href: string }[] }

const CATEGORIES: NavItem[] = [
  { label: "Trang chủ", href: "/" },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Nghiên cứu", href: "/nghien-cuu" },
  { label: "MXH Trầm Hương", href: "/feed" },
  { label: "Doanh nghiệp", href: "/doanh-nghiep" },
  { label: "Sản phẩm", href: "/san-pham-chung-nhan" },
  {
    label: "Giới thiệu",
    href: "/gioi-thieu",
    children: [
      { label: "Ban lãnh đạo", href: "/ban-lanh-dao" },
      { label: "Hội viên", href: "/hoi-vien" },
      { label: "Văn bản pháp lý", href: "/phap-ly" },
      { label: "Điều lệ", href: "/dieu-le" },
    ],
  },
  { label: "Liên hệ", href: "/lien-he" },
]

/** Strip locale prefix (/vi, /en, ...) để so khớp với href đã khai báo. */
function stripLocale(path: string): string {
  for (const loc of locales) {
    if (path === `/${loc}`) return "/"
    if (path.startsWith(`/${loc}/`)) return path.slice(loc.length + 1)
  }
  return path
}

/** Match exact hoặc prefix (để trang detail `/tin-tuc/foo` vẫn highlight
 *  parent `/tin-tuc`). Trang chủ `/` phải match chính xác, không ăn mọi path. */
function matchesPath(itemHref: string, pathname: string): boolean {
  if (itemHref === "/") return pathname === "/"
  return pathname === itemHref || pathname.startsWith(itemHref + "/")
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (matchesPath(item.href, pathname)) return true
  if ("children" in item && item.children) {
    return item.children.some((c) => matchesPath(c.href, pathname))
  }
  return false
}

const BASE_TRIGGER =
  "inline-flex items-center gap-1 px-3.5 py-2.5 text-[13px] font-semibold uppercase tracking-wide transition-colors"

/** Guest → hiện 2 CTA auth prominent (Đăng nhập + Đăng ký hội viên) ở cuối
 *  CategoryBar. Logged-in → skip vì UserMenu đã ở utility strip. */
type Props = {
  loggedIn?: boolean
}

export function CategoryBar({ loggedIn = false }: Props) {
  const pathname = stripLocale(usePathname() || "/")

  return (
    <nav
      aria-label="Chuyên mục"
      /* `sticky top-0` — thanh pin đầu viewport khi scroll.
         `shadow-md` + `isolation-isolate`: visual feedback rõ hơn khi stuck
         và tạo stacking context riêng để tránh bị content overlay trên
         một số trình duyệt mobile.
         `will-change: transform` hint cho GPU layer → giảm jitter iOS Safari
         khi URL bar collapse/expand lúc scroll. */
      className="sticky top-0 z-40 isolate bg-brand-700 text-white shadow-md will-change-transform"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        {/* overflow-x-auto on mobile để scroll ngang; lg:overflow-visible để
            dropdown của "Giới thiệu" không bị clip trên desktop. */}
        <ul className="category-scroll flex overflow-x-auto whitespace-nowrap lg:overflow-visible">
          {CATEGORIES.map((item) => {
            const active = isItemActive(item, pathname)
            const triggerClass = [
              BASE_TRIGGER,
              active
                ? "bg-brand-900 text-white"
                : "text-white/95 hover:bg-brand-800",
              // Giữ highlight trên parent khi dropdown đang mở (hover submenu).
              "children" in item && item.children && !active
                ? "lg:group-hover:bg-brand-800 lg:group-focus-within:bg-brand-800"
                : "",
            ]
              .filter(Boolean)
              .join(" ")

            return "children" in item && item.children ? (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={triggerClass}
                  aria-haspopup="true"
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                  <Chevron />
                </Link>
                <ul
                  className="
                    invisible absolute left-0 top-full z-50 min-w-[220px]
                    bg-brand-800 opacity-0 shadow-lg transition-opacity
                    lg:group-hover:visible lg:group-hover:opacity-100
                    lg:group-focus-within:visible lg:group-focus-within:opacity-100
                  "
                >
                  {item.children.map((sub) => {
                    const subActive = matchesPath(sub.href, pathname)
                    return (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          className={[
                            "block px-4 py-2.5 text-[13px] font-medium uppercase tracking-wide transition-colors",
                            subActive
                              ? "bg-brand-900 text-white"
                              : "text-white/95 hover:bg-brand-900",
                          ].join(" ")}
                          aria-current={subActive ? "page" : undefined}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ) : (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={triggerClass}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}

          {/* Auth CTAs — chỉ hiện cho guest. Desktop: push right với ml-auto.
              Mobile: append cuối scroll list (natural flow). Button "Đăng ký"
              dùng amber để tạo contrast mạnh trên nền nâu → user mới dễ thấy. */}
          {!loggedIn && (
            <>
              <li className="lg:ml-auto">
                <Link
                  href="/login"
                  className="inline-flex items-center px-3.5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/95 border border-white/40 ml-2 transition-colors hover:bg-white/10"
                >
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link
                  href="/dang-ky"
                  className="inline-flex items-center px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide text-brand-900 bg-amber-400 ml-2 transition-colors hover:bg-amber-300"
                >
                  Đăng ký hội viên
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

function Chevron() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 opacity-70"
    >
      <path d="m3 4.5 3 3 3-3" />
    </svg>
  )
}
