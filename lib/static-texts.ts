import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"

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
    const localized = localize(config, "value", locale)
    if (localized) return localized
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
 */
export async function getStaticTexts(pageKey: string, locale: Locale) {
  const configs = await prisma.staticPageConfig.findMany({
    where: { pageKey },
  })

  const dbTexts = Object.fromEntries(
    configs.map((c) => [c.itemKey, localize(c, "value", locale)])
  )

  // We still need the fallback from next-intl for items not in DB
  const t = await getTranslations(pageKey)
  
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
      return t(itemKey as Parameters<typeof t>[0], values) as string
    } catch {
      return ""
    }
  }
}
