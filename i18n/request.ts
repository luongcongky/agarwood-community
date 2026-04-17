import { getRequestConfig } from "next-intl/server"
import { headers } from "next/headers"
import { defaultLocale, isValidLocale } from "./config"

export default getRequestConfig(async () => {
  // Read locale from the x-locale header set by proxy.ts
  const h = await headers()
  const headerLocale = h.get("x-locale")
  const locale =
    headerLocale && isValidLocale(headerLocale) ? headerLocale : defaultLocale

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  }
})
