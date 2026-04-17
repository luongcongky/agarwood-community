"use client"

import { usePathname } from "next/navigation"
import { locales, type Locale } from "@/i18n/config"

const localeLabels: Record<Locale, string> = {
  vi: "VI",
  en: "EN",
  zh: "中文",
}

const localeFlags: Record<Locale, string> = {
  vi: "🇻🇳",
  en: "🇬🇧",
  zh: "🇨🇳",
}

export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname()

  // Strip current locale prefix from pathname to get the "real" path
  const pathnameWithoutLocale = pathname.replace(
    new RegExp(`^/(${locales.join("|")})`),
    "",
  ) || "/"

  return (
    <div className="flex items-center gap-0.5">
      {locales.map((locale) => {
        const isActive = locale === current
        return (
          <a
            key={locale}
            href={`/${locale}${pathnameWithoutLocale}`}
            onClick={() => {
              document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
            }}
            className={`
              px-1.5 py-1 rounded text-xs font-medium transition-colors
              ${isActive
                ? "bg-brand-600 text-white"
                : "text-brand-300 hover:text-brand-100 hover:bg-brand-700"
              }
            `}
            aria-label={`Switch to ${localeLabels[locale]}`}
            aria-current={isActive ? "true" : undefined}
          >
            <span className="mr-0.5">{localeFlags[locale]}</span>
            {localeLabels[locale]}
          </a>
        )
      })}
    </div>
  )
}
