import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/config"

/**
 * Lấy column DB tương ứng locale — KHÔNG cross-language fallback (vd
 * value_en rỗng → KHÔNG dùng value_zh hay value vi). Vì static texts có
 * messages.{locale}.json sẵn → fallback đúng là messages, không phải vi.
 *
 * Khác `localize()` (i18n/localize.ts) dùng cho Leaders/Companies/Products —
 * những content KHÔNG có translation file, fallback xuống vi là phương án
 * cuối "có còn hơn không". Static texts thì không cần vì messages files đã
 * đầy đủ 4 ngôn ngữ.
 */
function pickColumn<T extends Record<string, unknown>>(
  row: T,
  locale: Locale,
): string | null {
  const key = locale === "vi" ? "value" : `value_${locale}`
  const v = row[key]
  if (typeof v === "string" && v.trim() !== "") return v
  return null
}

/**
 * Lấy text cho trang tĩnh. Ưu tiên lấy từ database (StaticPageConfig),
 * nếu không có thì fallback về file messages/*.json (next-intl).
 */
export async function getStaticText(
  pageKey: string,
  itemKey: string,
  locale: Locale,
  fallbackNamespace?: string
) {
  const config = await prisma.staticPageConfig.findUnique({
    where: { pageKey_itemKey: { pageKey, itemKey } },
  })

  if (config) {
    const fromColumn = pickColumn(config, locale)
    if (fromColumn) return fromColumn
  }

  // Fallback to next-intl
  try {
    const t = await getTranslations(fallbackNamespace || pageKey)
    return t(itemKey)
  } catch {
    return ""
  }
}

/**
 * Lấy toàn bộ text cho một trang để tránh query nhiều lần.
 *
 * @param fallbackNamespace - Khi messages namespace ≠ pageKey (vd page "home"
 *   đọc text từ namespace "footer"). Mặc định fallback dùng namespace = pageKey.
 */
export async function getStaticTexts(
  pageKey: string,
  locale: Locale,
  fallbackNamespace?: string,
) {
  const configs = await prisma.staticPageConfig.findMany({
    where: { pageKey },
  })

  const dbTexts = Object.fromEntries(
    configs.map((c) => [c.itemKey, pickColumn(c, locale)])
  )

  // We still need the fallback from next-intl for items not in DB
  const t = await getTranslations(fallbackNamespace ?? pageKey)
  
  // Create a proxy or a helper that prefers dbTexts
  return (itemKey: string, values?: Record<string, string | number>): string => {
    let dbValue = dbTexts[itemKey]
    if (typeof dbValue === "string" && dbValue.trim() !== "") {
      if (values) {
        Object.entries(values).forEach(([k, v]) => {
          dbValue = (dbValue as string).replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        })
      }
      return dbValue
    }
    try {
      // Dùng t.raw() để bypass ICU formatter — message có thể chứa <em>/<strong>
      // (vd "Những người <em>dẫn dắt</em>"); t() sẽ throw FORMATTING_ERROR
      // vì coi `em`/`strong` là rich-text tag thiếu binding. Sau đó tự
      // interpolate {placeholder} thủ công.
      let raw = t.raw(itemKey)
      if (typeof raw !== "string") {
        return t(itemKey as Parameters<typeof t>[0], values) as string
      }
      if (values) {
        for (const [k, v] of Object.entries(values)) {
          raw = raw.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
        }
      }
      return raw
    } catch {
      return ""
    }
  }
}
