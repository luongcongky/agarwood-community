"use client"

import { usePathname } from "next/navigation"
import { locales, type Locale } from "@/i18n/config"
import { Flag } from "./flag-icons"

const localeLabels: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
  ar: "العربية",
}

interface LocaleFlagsProps {
  current: Locale
  /** "compact" (default) for navbar — nhỏ, chỉ flag. "labeled" for mobile drawer — flag + tên. */
  variant?: "compact" | "labeled"
}

export function LocaleFlags({ current, variant = "compact" }: LocaleFlagsProps) {
  const pathname = usePathname() ?? "/"
  const pathnameWithoutLocale =
    pathname.replace(new RegExp(`^/(${locales.join("|")})`), "") || "/"

  if (variant === "labeled") {
    return (
      <div className="grid grid-cols-2 gap-1.5" aria-label="Chọn ngôn ngữ">
        {locales.map((locale) => {
          const isActive = locale === current
          return (
            <a
              key={locale}
              href={`/${locale}${pathnameWithoutLocale}`}
              onClick={() => {
                document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
              }}
              aria-current={isActive ? "true" : undefined}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-brand-700 text-brand-100 font-semibold"
                  : "text-brand-200 hover:bg-brand-700 hover:text-brand-100"
              }`}
            >
              <Flag
                locale={locale}
                className="h-4 w-6 shrink-0 rounded-sm border border-brand-700 shadow-sm"
              />
              <span className="truncate">{localeLabels[locale]}</span>
            </a>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5" aria-label="Chọn ngôn ngữ">
      {locales.map((locale) => {
        const isActive = locale === current
        return (
          <a
            key={locale}
            href={`/${locale}${pathnameWithoutLocale}`}
            onClick={() => {
              document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
            }}
            aria-current={isActive ? "true" : undefined}
            aria-label={`Chuyển sang ${localeLabels[locale]}`}
            title={localeLabels[locale]}
            className={`inline-flex h-7 w-8 items-center justify-center rounded-md transition-all ${
              isActive
                ? "ring-1 ring-brand-300 bg-brand-700/60"
                : "opacity-55 hover:opacity-100 hover:bg-brand-700"
            }`}
          >
            <Flag
              locale={locale}
              className="h-3.5 w-5 rounded-[2px] shadow-sm"
            />
          </a>
        )
      })}
    </div>
  )
}
