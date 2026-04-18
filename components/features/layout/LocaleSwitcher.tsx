"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { locales, type Locale } from "@/i18n/config"
import { Flag } from "./flag-icons"

const localeLabels: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
}

export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Strip current locale prefix from pathname to get the "real" path
  const pathnameWithoutLocale =
    pathname.replace(new RegExp(`^/(${locales.join("|")})`), "") || "/"

  // Close on outside click + ESC
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Ngôn ngữ hiện tại: ${localeLabels[current]}`}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-brand-200 hover:bg-brand-700 hover:text-brand-100 transition-colors"
      >
        <Flag locale={current} className="h-4 w-6 rounded-sm border border-brand-700 shadow-sm" />
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1 min-w-[160px] rounded-lg bg-brand-800 border border-brand-700 shadow-lg py-1 z-50"
        >
          {locales.map((locale) => {
            const isActive = locale === current
            return (
              <a
                key={locale}
                href={`/${locale}${pathnameWithoutLocale}`}
                onClick={() => {
                  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
                  setOpen(false)
                }}
                role="option"
                aria-selected={isActive}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-brand-700 text-brand-100 font-semibold"
                    : "text-brand-200 hover:bg-brand-700 hover:text-brand-100"
                }`}
              >
                <Flag locale={locale} className="h-4 w-6 shrink-0 rounded-sm border border-brand-700 shadow-sm" />
                <span>{localeLabels[locale]}</span>
                {isActive && (
                  <span className="ml-auto text-xs text-brand-300">✓</span>
                )}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
