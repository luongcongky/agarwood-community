import Link from "next/link"
import Image from "next/image"
import { getLocale } from "next-intl/server"
import { auth } from "@/lib/auth"
import type { Locale } from "@/i18n/config"
import { CategoryBar } from "./CategoryBar"
import { LocaleFlags } from "./LocaleFlags"
import { UserMenu } from "@/components/features/layout/UserMenu"

const DATE_FMT = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
})

function formatToday(): string {
  const parts = DATE_FMT.formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  const weekday = get("weekday")
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${cap}, ${get("day")}/${get("month")}/${get("year")}`
}

export async function SiteHeader() {
  const today = formatToday()
  const [locale, session] = await Promise.all([
    getLocale() as Promise<Locale>,
    auth(),
  ])
  const user = session?.user

  return (
    // Fragment — để header + CategoryBar rơi trực tiếp vào parent layout
    // (data-page="public" div với min-h-screen). Nếu bọc trong <div> không
    // có height, sticky range sẽ bị giới hạn trong div đó → nav scroll mất.
    <>
      <header>
        {/* Top utility strip — báo chí style: ngày bên trái, locale + utility links bên phải */}
        <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 text-[13px] text-neutral-600 sm:px-6 lg:px-8">
          <span className="uppercase tracking-wide">{today}</span>
          <nav aria-label="Tiện ích" className="flex items-center gap-4 sm:gap-5">
            <LocaleFlags current={locale} />
            {/* Login/register CTA cho guest đã chuyển sang CategoryBar;
                UserMenu (khi đã login) đã move xuống masthead bên phải để
                đối xứng với logo. Utility strip giờ chỉ có date + locale. */}
          </nav>
        </div>
      </div>

      {/* Masthead — logo trái, UserMenu phải (khi đã login) đối xứng. */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:gap-4 sm:px-6 lg:px-8 lg:py-6">
          {/* Logo block: mobile compact (ẩn eyebrow + tagline + title nhỏ hơn)
              để chừa chỗ cho UserMenu bên phải. `min-w-0` + `truncate` ở text
              block tránh overflow khi title dài + viewport hẹp. */}
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo.png"
              alt="Hội Trầm Hương Việt Nam"
              width={64}
              height={64}
              priority
              className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16"
            />
            <div className="min-w-0 leading-tight">
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700 sm:block">
                Vietnam Agarwood Association
              </p>
              <h1 className="truncate text-base font-black uppercase tracking-tight text-brand-900 sm:mt-0.5 sm:text-2xl lg:text-[26px]">
                Hội Trầm Hương Việt Nam
              </h1>
              <p className="mt-0.5 hidden text-[11px] text-neutral-500 sm:block">
                Cơ quan truyền thông chính thức · Thành lập theo QĐ 23/QĐ-BNV (11/01/2010)
              </p>
            </div>
          </Link>

          {/* UserMenu — phía phải masthead, đối xứng với logo Hội.
              variant="light": avatar 56–64px bằng logo, tên user TRƯỚC avatar
              với màu + weight match H1 masthead. Guest dùng CTA ở CategoryBar. */}
          {user && (
            <div className="shrink-0">
              <UserMenu
                name={user.name}
                email={user.email}
                image={user.image}
                role={user.role}
                variant="light"
              />
            </div>
          )}
        </div>
      </div>
      </header>

      {/* CategoryBar RA NGOÀI <header> để position:sticky không bị containing
          block của <header> chặn — khi scroll, top strip + masthead đi lên
          mất, nhưng category bar pin cứng top viewport.
          loggedIn={!!user} → guest thấy thêm 2 CTA Đăng nhập + Đăng ký ở cuối
          dãy menu. */}
      <CategoryBar loggedIn={!!user} />
    </>
  )
}
