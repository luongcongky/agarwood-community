import { headers } from "next/headers"
import { defaultLocale, isValidLocale, type Locale } from "./config"

/**
 * Read the current locale from request headers (set by proxy.ts).
 * Falls back to the default locale if missing or invalid.
 */
export async function getLocale(): Promise<Locale> {
  const h = await headers()
  const value = h.get("x-locale")
  return value && isValidLocale(value) ? value : defaultLocale
}
