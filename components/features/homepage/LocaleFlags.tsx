"use client"

import { usePathname } from "next/navigation"
import { locales, type Locale } from "@/i18n/config"
import { Flag } from "@/components/features/layout/flag-icons"

const localeLabels: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
  ar: "العربية",
}

/**
 * Compact locale switcher tuned for light-bg utility strip — inactive
 * flags are dimmed, active gets a brown ring, hover bumps opacity.
 */
export function LocaleFlags({ current }: { current: Locale }) {
  const pathname = usePathname() ?? "/"
  const pathnameWithoutLocale =
    pathname.replace(new RegExp(`^/(${locales.join("|")})`), "") || "/"

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
            className={`inline-flex h-7 w-8 items-center justify-center rounded-sm transition-opacity ${
              isActive
                ? "ring-1 ring-brand-700"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            <Flag locale={locale} className="h-4 w-5 rounded-[2px] shadow-sm" />
          </a>
        )
      })}
    </div>
  )
}
