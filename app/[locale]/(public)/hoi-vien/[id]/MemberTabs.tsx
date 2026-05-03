"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { sanitizeArticleHtml } from "@/lib/sanitize"
import { cn } from "@/lib/utils"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"

type Product = {
  id: string
  name: string
  name_en: string | null
  name_zh: string | null
  name_ar: string | null
  slug: string
  imageUrls: string[]
  category: string | null
  priceRange: string | null
  certStatus: string | null
}

type Props = {
  bio: string | null
  products: Product[]
  canEdit?: boolean
}

export function MemberTabs({ bio, products, canEdit }: Props) {
  const t = useTranslations("memberDetail")
  const tC = useTranslations("companyTabs")
  const locale = useLocale() as Locale
  const [activeTab, setActiveTab] = useState<"bio" | "products">("bio")

  const l = <T extends Record<string, any>>(record: T, field: string) => localize(record, field, locale) as string

  const tabs = [
    { id: "bio", label: t("intro") },
    { id: "products", label: t("tabProducts", { count: products.length }) },
  ] as const

  // If no products, we don't really need the tab system, but it's better for consistency
  // However, the user said "nếu hội viên đó có đăng bài sản phẩm".
  // The parent component will handle whether to show tabs or just bio.
  // But if we are here, we might want to show them.

  return (
    <div className="mt-8">
      <div className="flex border-b border-brand-100 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-brand-600 text-brand-900"
                : "border-transparent text-brand-500 hover:text-brand-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* Bio Tab */}
        {activeTab === "bio" && (
          <div className="prose max-w-none text-brand-800 leading-relaxed">
            {bio ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(bio) }} />
            ) : (
              <p className="text-brand-400 italic">{t("introEmpty")}</p>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            {canEdit && (
              <div className="mb-4">
                <Link
                  href={`/${locale}/feed/tao-bai?category=PRODUCT`}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-700 text-white px-4 py-2 text-sm font-medium hover:bg-brand-800 transition-colors"
                >
                  {tC("addProduct")}
                </Link>
              </div>
            )}

            {products.length === 0 ? (
              <p className="text-brand-400 italic text-sm">{t("noProducts")}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/san-pham/${product.slug}`}
                    className="group block bg-white border border-brand-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-square bg-brand-100">
                      {product.imageUrls.length > 0 ? (
                        <Image
                          src={product.imageUrls[0]}
                          alt={l(product, "name")}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      ) : (
                        <AgarwoodPlaceholder className="w-full h-full" size="md" shape="square" tone="light" />
                      )}
                      {product.certStatus === "APPROVED" && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-brand-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-brand-900 text-sm line-clamp-2 group-hover:text-brand-700 transition-colors">
                        {l(product, "name")}
                      </h3>
                      {product.priceRange && (
                        <p className="text-amber-700 font-bold text-xs mt-1">{product.priceRange}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
