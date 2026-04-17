/** Supported locales and default locale for the app */
export const locales = ["vi", "en", "zh"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "vi"

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}
