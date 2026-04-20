/** Supported locales and default locale for the app */
export const locales = ["vi", "en", "zh", "ar"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "vi"

/** Locales that render right-to-left. Used to set <html dir="rtl"> and
 *  pick an RTL-aware font stack. */
export const rtlLocales: readonly Locale[] = ["ar"]
export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale)
}

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}
