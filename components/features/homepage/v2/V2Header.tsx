import Link from "next/link"
import Image from "next/image"
import { getLocale } from "next-intl/server"
import type { Locale } from "@/i18n/config"
import { CategoryBarV2 } from "./CategoryBarV2"
import { LocaleFlagsV2 } from "./LocaleFlagsV2"

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

export async function V2Header() {
  const today = formatToday()
  const locale = (await getLocale()) as Locale

  return (
    <header>
      {/* Top utility strip — báo chí style: ngày bên trái, locale + utility links bên phải */}
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 text-[13px] text-neutral-600 sm:px-6 lg:px-8">
          <span className="uppercase tracking-wide">{today}</span>
          <nav aria-label="Tiện ích" className="flex items-center gap-4 sm:gap-5">
            <LocaleFlagsV2 current={locale} />
            <span aria-hidden="true" className="text-neutral-300">
              |
            </span>
            <Link href="/login" className="hover:text-brand-700">
              Đăng nhập
            </Link>
            <Link href="/dang-ky" className="hover:text-brand-700">
              Đăng ký hội viên
            </Link>
          </nav>
        </div>
      </div>

      {/* Masthead — logo + association name + tagline */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <Link href="/v2" className="flex shrink-0 items-center gap-3">
            <Image
              src="/logo.png"
              alt="Hội Trầm Hương Việt Nam"
              width={64}
              height={64}
              priority
              className="h-14 w-14 object-contain lg:h-16 lg:w-16"
            />
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                Vietnam Agarwood Association
              </p>
              <h1 className="mt-0.5 text-xl font-black uppercase tracking-tight text-brand-900 sm:text-2xl lg:text-[26px]">
                Hội Trầm Hương Việt Nam
              </h1>
              <p className="mt-0.5 text-[11px] text-neutral-500">
                Cơ quan truyền thông chính thức · Thành lập theo QĐ 23/QĐ-BNV (11/01/2010)
              </p>
            </div>
          </Link>
        </div>
      </div>

      <CategoryBarV2 />
    </header>
  )
}
