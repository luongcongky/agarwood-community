import { prisma } from "@/lib/prisma"
import { STATIC_PAGES, type StaticPageKey } from "@/lib/static-page-meta"
import { StaticPageWorkbench } from "./StaticPageWorkbench"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/config"

export const metadata = {
  title: "Cấu hình Trang tĩnh | Admin",
}

export default async function AdminStaticPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const sp = await searchParams
  const requested = sp.page as StaticPageKey | undefined
  const currentPageKey: StaticPageKey =
    requested && requested in STATIC_PAGES ? requested : "about"

  // Fetch all configs for the current page
  const configs = await prisma.staticPageConfig.findMany({
    where: { pageKey: currentPageKey },
  })

  const configMap = Object.fromEntries(configs.map((c) => [c.itemKey, c]))

  // Dùng `t.raw()` để bypass ICU formatting — cần raw template string ("Những
  // người <em>dẫn dắt</em>", "{count} hội viên...") để hiển thị placeholder
  // trong CMS editor, không phải kết quả format.
  const safeT = async (locale: string) => {
    try {
      const t = await getTranslations({ locale, namespace: currentPageKey })
      return (key: string) => {
        try {
          const raw = t.raw(key)
          return typeof raw === "string" ? raw : ""
        } catch {
          return ""
        }
      }
    } catch {
      return () => ""
    }
  }

  const tVi = await safeT("vi")
  const tEn = await safeT("en")
  const tZh = await safeT("zh")
  const tAr = await safeT("ar")

  const pageMeta = STATIC_PAGES[currentPageKey]
  const defaultValues = Object.fromEntries(
    pageMeta.items.map((item) => [item.key, tVi(item.key)])
  )

  // Match public viewer (lib/static-texts.ts): per-locale column trực tiếp
  // (value_en/value_zh/value_ar/value), KHÔNG cross-language fallback. Khi
  // cột rỗng → messages.{locale}.json. Như vậy admin và public hoàn toàn
  // đồng bộ — text user thấy trong form chính là text đang render publicly.
  const messagesFallback: Record<Locale, (key: string) => string> = {
    vi: tVi, en: tEn, zh: tZh, ar: tAr,
  }
  const dbColumn = (loc: Locale) => loc === "vi" ? "value" as const : `value_${loc}` as const
  const resolveLocale = (item: typeof pageMeta.items[number], loc: Locale): string => {
    const row = configMap[item.key]
    const colVal = row?.[dbColumn(loc)]
    if (typeof colVal === "string" && colVal.trim() !== "") return colVal
    return messagesFallback[loc](item.key) || ""
  }

  const defaultValuesAllLocales = Object.fromEntries(
    pageMeta.items.map((item) => [
      item.key,
      {
        vi: resolveLocale(item, "vi"),
        en: resolveLocale(item, "en"),
        zh: resolveLocale(item, "zh"),
        ar: resolveLocale(item, "ar"),
      }
    ])
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-900">Cấu hình Trang tĩnh</h1>
        <p className="mt-1 text-sm text-brand-500">
          Chỉnh sửa nội dung text của các trang tĩnh. Click vào vùng text trên mockup bên trái để chỉnh sửa.
        </p>
      </header>

      <StaticPageWorkbench 
        currentPageKey={currentPageKey} 
        configMap={configMap} 
        defaultValues={defaultValues}
        defaultValuesAllLocales={defaultValuesAllLocales}
      />
    </div>
  )
}
