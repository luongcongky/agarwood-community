import { prisma } from "@/lib/prisma"
import { STATIC_PAGES, type StaticPageKey } from "@/lib/static-page-meta"
import { StaticPageWorkbench } from "./StaticPageWorkbench"
import { getTranslations } from "next-intl/server"

export const metadata = {
  title: "Cấu hình Trang tĩnh | Admin",
}

export default async function AdminStaticPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const sp = await searchParams
  const currentPageKey = (sp.page as StaticPageKey) || "about"

  // Fetch all configs for the current page
  const configs = await prisma.staticPageConfig.findMany({
    where: { pageKey: currentPageKey },
  })

  const configMap = Object.fromEntries(configs.map((c) => [c.itemKey, c]))

  const safeT = async (locale: string) => {
    try {
      const t = await getTranslations({ locale, namespace: currentPageKey })
      return (key: string) => {
        try { return t(key) } catch { return "" }
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
  
  const defaultValuesAllLocales = Object.fromEntries(
    pageMeta.items.map((item) => [
      item.key,
      {
        vi: defaultValues[item.key] || "",
        en: tEn(item.key) || "",
        zh: tZh(item.key) || "",
        ar: tAr(item.key) || "",
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
