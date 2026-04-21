import { locales, defaultLocale, type Locale } from "@/i18n/config"

export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://hoitramhuong.vn"

export const SITE_NAME = "Hội Trầm Hương Việt Nam"

const LOCALE_PATH_PREFIX: Record<Locale, string> = {
  vi: "",
  en: "/en",
  zh: "/zh",
  ar: "/ar",
}

function normalizePath(path: string): string {
  if (!path || path === "/") return ""
  return path.startsWith("/") ? path : `/${path}`
}

export function localizedUrl(path: string, locale: Locale = defaultLocale): string {
  const prefix = LOCALE_PATH_PREFIX[locale] ?? ""
  const normalized = normalizePath(path)
  return `${BASE_URL}${prefix}${normalized || "/"}`
}

export function canonicalUrl(path: string, locale: Locale = defaultLocale): string {
  return localizedUrl(path, locale)
}

export function hreflangAlternates(path: string): {
  canonical: string
  languages: Record<string, string>
} {
  const languages: Record<string, string> = {}
  for (const loc of locales) {
    const tag = loc === "vi" ? "vi-VN" : loc === "en" ? "en" : loc === "zh" ? "zh-CN" : "ar"
    languages[tag] = localizedUrl(path, loc)
  }
  languages["x-default"] = localizedUrl(path, defaultLocale)
  return {
    canonical: localizedUrl(path, defaultLocale),
    languages,
  }
}
