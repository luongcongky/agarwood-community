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

export default getRequestConfig(async () => {
  // Read locale from the x-locale header set by proxy.ts
  const h = await headers()
  const headerLocale = h.get("x-locale")
  const locale: Locale =
    headerLocale && isValidLocale(headerLocale) ? headerLocale : defaultLocale

  return {
    locale,
    messages: messages[locale],
  }
})
