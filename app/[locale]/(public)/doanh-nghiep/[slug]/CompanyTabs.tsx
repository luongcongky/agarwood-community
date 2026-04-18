"use client"

import { useTranslations } from "next-intl"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"
import { cn } from "@/lib/utils"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"

type Product = {
  id: string
  name: string
  slug: string
  imageUrls: string[]
  category: string | null
  priceRange: string | null
  certStatus: string
  badgeUrl: string | null
}

type Props = {
  description: string | null | undefined
  products: Product[]
  companyName: string
  companySlug: string
  foundedYear?: number | null
  employeeCount?: string | null
  businessLicense?: string | null
  address?: string | null
  phone?: string | null
  website?: string | null
  postCount: number
  canEdit: boolean
}

type TabId = "intro" | "products" | "info"

export function CompanyTabs({
  description,
  products,
  companyName,
  companySlug,
  foundedYear,
  employeeCount,
  businessLicense,
  address,
  phone,
  website,
  postCount,
  canEdit,
}: Props) {
  const t = useTranslations("companyTabs")

  const [activeTab, setActiveTab] = useState<TabId>("intro")

  const tabs: { id: TabId; label: string }[] = [
    { id: "intro", label: t("tabIntro") },
    { id: "products", label: `${t("tabProducts")} (${products.length})` },
    { id: "info", label: t("tabInfo") },
  ]

  return (
    <div className="mt-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-brand-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-brand-600 text-brand-800"
                : "border-transparent text-brand-500 hover:text-brand-700 hover:border-brand-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* ── {t("tabIntro")} ──────────────────────────────────────────────── */}
        {activeTab === "intro" && (
          <div className="prose max-w-none text-brand-800 leading-relaxed">
            {description ? (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} />
            ) : (
              <p className="text-brand-400 italic">{t("noDescription")}</p>
            )}
          </div>
        )}

        {/* ── {t("tabProducts")} ────────────────────────────────────────────────── */}
        {activeTab === "products" && (
          <div>
            {canEdit && (
              <div className="mb-4">
                <Link
                  href="/san-pham/tao-moi"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-700 text-white px-4 py-2 text-sm font-medium hover:bg-brand-800 transition-colors"
                >
                  {t("addProduct")}
                </Link>
              </div>
            )}

            {products.length === 0 ? (
              <p className="text-brand-400 italic text-sm">Doanh nghiệp chưa có sản phẩm nào.</p>
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
                        <Image src={product.imageUrls[0]} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                      ) : (
                        <AgarwoodPlaceholder className="w-full h-full" size="md" shape="square" tone="light" />
                      )}
                      {product.certStatus === "APPROVED" && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-brand-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                          {t("certified")}
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <h3 className="text-sm font-semibold text-brand-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                      {product.category && <p className="text-xs text-brand-500">{product.category}</p>}
                      {product.priceRange && <p className="text-xs font-medium text-brand-700">{product.priceRange}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── {t("tabInfo")} ────────────────────────────────────────────────── */}
        {activeTab === "info" && (
          <dl className="divide-y divide-brand-100 text-sm">
            <InfoRow label={t("companyName")} value={companyName} />
            {foundedYear && <InfoRow label={t("foundedYear")} value={String(foundedYear)} />}
            {employeeCount && <InfoRow label={t("employeeCount")} value={`${employeeCount} người`} />}
            {businessLicense && <InfoRow label={t("businessLicense")} value={businessLicense} />}
            {address && <InfoRow label={t("address")} value={address} />}
            {phone && <InfoRow label={t("phone")} value={phone} />}
            {website && (
              <div className="py-3 flex items-start gap-4">
                <dt className="w-40 shrink-0 text-brand-500 font-medium">{t("website")}</dt>
                <dd>
                  <a href={website} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline break-all">
                    {website}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 flex items-start gap-4">
      <dt className="w-40 shrink-0 text-brand-500 font-medium">{label}</dt>
      <dd className="text-brand-800">{value}</dd>
    </div>
  )
}
