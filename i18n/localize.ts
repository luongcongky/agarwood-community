import type { Locale } from "./config"
import { defaultLocale } from "./config"

/**
 * Get a localized field value from a DB record, falling back through a
 * locale-aware chain when the primary translation is missing.
 *
 * Fallback chain:
 *   locale="vi" → field
 *   locale="en" → field_en → field_zh → field_ar → field
 *   locale="zh" → field_zh → field_en → field_ar → field
 *   locale="ar" → field_ar → field_en → field_zh → field
 *
 * Vietnamese is the final source-of-truth; foreign-language siblings are
 * preferred over VI so a user who picks EN/ZH/AR doesn't get pushed back
 * to VI when any sibling translation exists. Arabic sits last in the
 * foreign-fallback order because it's the newest locale and is often
 * still untranslated — EN is the most common fallback for AR readers.
 *
 * Note: the record must have all four *_{locale} columns selected in the
 * Prisma query for the middle fallbacks to resolve; otherwise the chain
 * drops straight to VI.
 */
export function localize<T extends Record<string, unknown>>(
  record: T,
  field: string,
  locale: Locale,
): unknown {
  if (locale === defaultLocale) return record[field]
  const primary = record[`${field}_${locale}`] as unknown
  if (primary != null && primary !== "") return primary
  // Try each sibling foreign locale in priority order before dropping to VI.
  const siblings: Locale[] =
    locale === "en" ? ["zh", "ar"] :
    locale === "zh" ? ["en", "ar"] :
    /* ar */        ["en", "zh"]
  for (const sib of siblings) {
    const val = record[`${field}_${sib}`] as unknown
    if (val != null && val !== "") return val
  }
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
