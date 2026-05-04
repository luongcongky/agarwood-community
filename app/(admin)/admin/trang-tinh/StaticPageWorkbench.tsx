"use client"

import { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { STATIC_PAGES, type StaticPageKey, type StaticTextMeta } from "@/lib/static-page-meta"
import { AboutMockup } from "./AboutMockup"
import { TextConfigEditor } from "./TextConfigEditor"
import { cn } from "@/lib/utils"
import type { StaticPageConfig } from "@prisma/client"

interface Props {
  currentPageKey: StaticPageKey
  configMap: Record<string, StaticPageConfig>
  defaultValues: Record<string, string>
  defaultValuesAllLocales?: Record<string, { vi: string, en: string, zh: string, ar: string }>
}

export function StaticPageWorkbench({ currentPageKey, configMap, defaultValues, defaultValuesAllLocales }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)

  function handlePageChange(page: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page)
    setSelectedItemKey(null)
    router.push(`${pathname}?${params.toString()}`)
  }

  const pageMeta = STATIC_PAGES[currentPageKey]

  return (
    <div className="space-y-6">
      {/* ── Page Selector ── */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(STATIC_PAGES) as [StaticPageKey, (typeof STATIC_PAGES)[StaticPageKey]][]).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => handlePageChange(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              currentPageKey === key
                ? "bg-brand-700 text-white shadow-sm"
                : "bg-white border border-brand-200 text-brand-700 hover:bg-brand-50"
            )}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: Mockup ── */}
        <div className="space-y-4">
          <div className="bg-brand-50 rounded-xl p-6 border border-brand-100 lg:sticky lg:top-6">
            <h3 className="text-sm font-bold text-brand-900 mb-4 uppercase tracking-wider">
              Bố cục trang: {pageMeta.label}
            </h3>
            
            {currentPageKey === "about" && (
              <AboutMockup 
                selectedKey={selectedItemKey} 
                onSelect={setSelectedItemKey} 
                configMap={configMap}
                defaultValues={defaultValues}
              />
            )}

            {currentPageKey !== "about" && (
              <div className="bg-white rounded-lg border border-dashed border-brand-300 p-12 text-center text-brand-500">
                Mockup cho trang {pageMeta.label} đang được cập nhật...
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {pageMeta.items.map((item: StaticTextMeta) => (
                    <button
                      key={item.key}
                      onClick={() => setSelectedItemKey(item.key)}
                      className={cn(
                        "px-3 py-1.5 rounded border text-xs font-medium",
                        selectedItemKey === item.key
                          ? "border-amber-600 bg-amber-100 text-amber-900"
                          : "border-brand-200 bg-white text-brand-600 hover:border-brand-400"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <p className="mt-4 text-[11px] text-brand-500 italic">
              * Click vào các vùng màu vàng trên mockup để chỉnh sửa nội dung.
            </p>
          </div>
        </div>

        {/* ── Right: Editor ── */}
        <div className="space-y-6">
          {selectedItemKey ? (
            <TextConfigEditor
              key={selectedItemKey}
              pageKey={currentPageKey}
              itemMeta={pageMeta.items.find((i: StaticTextMeta) => i.key === selectedItemKey)!}
              initialData={configMap[selectedItemKey]}
              defaultTranslations={defaultValuesAllLocales?.[selectedItemKey]}
              onSuccess={() => {
                router.refresh()
              }}
            />
          ) : (
            <div className="bg-white rounded-xl border border-brand-200 p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-brand-900 mb-2">Chưa chọn nội dung</h4>
              <p className="text-sm text-brand-500 max-w-xs mx-auto">
                Vui lòng click vào một vùng text trên mockup bên trái để bắt đầu chỉnh sửa.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
