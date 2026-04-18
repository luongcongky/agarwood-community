import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { isValidLocale, defaultLocale } from "@/i18n/config"

// Legacy bookmark compatibility. The unified composer lives under
// /[locale]/feed/tao-bai, so we have to inject the locale prefix here —
// a bare /feed/tao-bai would 404 because next-intl's [locale] segment
// expects one of vi/en/zh.
export default async function CreateProductPage() {
  const cookieStore = await cookies()
  const raw = cookieStore.get("NEXT_LOCALE")?.value
  const locale = raw && isValidLocale(raw) ? raw : defaultLocale
  redirect(`/${locale}/feed/tao-bai?category=PRODUCT`)
}
