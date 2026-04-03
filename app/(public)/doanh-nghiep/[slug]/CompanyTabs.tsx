"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
  foundedYear?: number | null
  employeeCount?: string | null
  businessLicense?: string | null
  address?: string | null
  phone?: string | null
  website?: string | null
}

const TABS = [
  { id: "intro", label: "Giới thiệu" },
  { id: "products", label: "Sản phẩm" },
  { id: "info", label: "Thông tin" },
] as const

type TabId = (typeof TABS)[number]["id"]

export function CompanyTabs({
  description,
  products,
  companyName,
  foundedYear,
  employeeCount,
  businessLicense,
  address,
  phone,
  website,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("intro")

  return (
    <div className="mt-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-brand-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-brand-600 text-brand-800"
                : "border-transparent text-brand-500 hover:text-brand-700 hover:border-brand-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {/* Giới thiệu */}
        {activeTab === "intro" && (
          <div className="prose max-w-none text-brand-800 leading-relaxed">
            {description ? (
              <p className="whitespace-pre-wrap">{description}</p>
            ) : (
              <p className="text-brand-400 italic">Chưa có mô tả</p>
            )}
          </div>
        )}

        {/* Sản phẩm */}
        {activeTab === "products" && (
          <div>
            {products.length === 0 ? (
              <p className="text-brand-400 italic text-sm">
                Doanh nghiệp chưa có sản phẩm nào được đăng.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/san-pham/${product.slug}`}
                    className="group block bg-white border border-brand-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Image with cert badge overlay */}
                    <div className="relative aspect-square bg-brand-100">
                      {product.imageUrls.length > 0 ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-200 to-brand-300">
                          <span className="text-3xl">🌿</span>
                        </div>
                      )}

                      {/* APPROVED cert badge — most important visual */}
                      {product.certStatus === "APPROVED" && (
                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 bg-brand-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                            🏅 Đã chứng nhận
                          </span>
                          {product.badgeUrl && (
                            <img
                              src={product.badgeUrl}
                              alt="Badge chứng nhận"
                              className="w-8 h-8 rounded-full shadow"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="p-3 space-y-1">
                      <h3 className="text-sm font-semibold text-brand-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                      {product.category && (
                        <p className="text-xs text-brand-500">{product.category}</p>
                      )}
                      {product.priceRange && (
                        <p className="text-xs font-medium text-brand-700">
                          {product.priceRange}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Thông tin */}
        {activeTab === "info" && (
          <dl className="divide-y divide-brand-100 text-sm">
            <InfoRow label="Tên doanh nghiệp" value={companyName} />
            {foundedYear && (
              <InfoRow label="Năm thành lập" value={String(foundedYear)} />
            )}
            {employeeCount && (
              <InfoRow label="Quy mô nhân sự" value={employeeCount} />
            )}
            {businessLicense && (
              <InfoRow label="Mã số doanh nghiệp" value={businessLicense} />
            )}
            {address && <InfoRow label="Địa chỉ" value={address} />}
            {phone && <InfoRow label="Điện thoại" value={phone} />}
            {website && (
              <div className="py-3 flex items-start gap-4">
                <dt className="w-40 shrink-0 text-brand-500 font-medium">Website</dt>
                <dd>
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 hover:underline break-all"
                  >
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
