import { getRequestConfig } from "next-intl/server"
import { headers } from "next/headers"
import { defaultLocale, isValidLocale, type Locale } from "./config"
import vi from "@/messages/vi.json"
import en from "@/messages/en.json"
import zh from "@/messages/zh.json"
import ar from "@/messages/ar.json"

// Static-imported messages: bundled at build time, no per-request async load.
// Lookup is O(1) and avoids the dynamic import() overhead each render path.
const messages: Record<Locale, typeof vi> = { vi, en, zh, ar }

export default getRequestConfig(async ({ requestLocale }) => {
  // Ưu tiên explicit locale do caller truyền vào (vd
  // `getTranslations({ locale: "en" })` ở admin CMS load 4 ngôn ngữ trong 1
  // request). Nếu không có → fallback về header x-locale do proxy.ts set theo
  // URL/ cookie. Trước đây handler này luôn dùng header → admin gọi
  // `getTranslations({ locale: "en" })` ở route /admin/* nhận về vi messages
  // (vì admin route bypass URL locale, header luôn "vi").
  const explicit = await requestLocale
  let locale: Locale
  if (explicit && isValidLocale(explicit)) {
    locale = explicit
  } else {
    const h = await headers()
    const headerLocale = h.get("x-locale")
    locale = headerLocale && isValidLocale(headerLocale) ? headerLocale : defaultLocale
  }

  return {
    locale,
    messages: messages[locale],
  }
})
