import type { Locale } from "./config"
import { defaultLocale } from "./config"

/**
 * Get a localized field value from a DB record, falling back to the
 * default (Vietnamese) value when the translation is missing.
 *
 * Usage:
 *   localize(news, "title", locale)
 *   // returns news.title_en ?? news.title (when locale = "en")
 *   // returns news.title (when locale = "vi" or field_en is null)
 */
export function localize<T extends Record<string, unknown>>(
  record: T,
  field: string,
  locale: Locale,
): unknown {
  if (locale === defaultLocale) return record[field]
  const localizedKey = `${field}_${locale}`
  return (record[localizedKey] as unknown) ?? record[field]
}

/**
 * Shorthand: create a bound localizer for a specific locale.
 *
 * Usage:
 *   const l = makeLocalizer("en")
 *   l(news, "title") // news.title_en ?? news.title
 */
export function makeLocalizer(locale: Locale) {
  return <T extends Record<string, unknown>>(record: T, field: string) =>
    localize(record, field, locale)
}
