import type { Locale } from "./config"
import { defaultLocale } from "./config"

/**
 * Get a localized field value from a DB record, falling back through a
 * locale-aware chain when the primary translation is missing.
 *
 * Fallback chain:
 *   locale="vi" → field
 *   locale="en" → field_en → field_zh → field
 *   locale="zh" → field_zh → field_en → field
 *
 * Vietnamese is the final source-of-truth; the "other foreign" language is
 * preferred over VI so a user who picks EN/ZH doesn't get pushed back to VI
 * when a sibling translation exists.
 *
 * Note: the record must have all three columns selected in the Prisma query
 * for the middle fallback to resolve; otherwise the chain drops straight to VI.
 */
export function localize<T extends Record<string, unknown>>(
  record: T,
  field: string,
  locale: Locale,
): unknown {
  if (locale === defaultLocale) return record[field]
  const primary = record[`${field}_${locale}`] as unknown
  if (primary != null && primary !== "") return primary
  const otherForeign = locale === "en" ? "zh" : "en"
  const secondary = record[`${field}_${otherForeign}`] as unknown
  if (secondary != null && secondary !== "") return secondary
  return record[field]
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
