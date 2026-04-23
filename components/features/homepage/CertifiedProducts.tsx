import Link from "next/link"
import Image from "next/image"
import { getFeaturedProductsForHomepage } from "@/lib/homepage"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { Section } from "./Section"

/**
 * Sản phẩm tiêu biểu — infinite marquee, flat / flush VTV-style.
 * Đặc trưng:
 *  - Ảnh vuông aspect-square, flush không rounded + không border
 *  - Hover chỉ đổi màu + gạch chân title (không scale ảnh)
 *  - Badge "Chứng nhận" dạng block chữ nhật nâu (không pill amber)
 *  - Header gọn trên cùng 1 line với link "/san-pham-doanh-nghiep"
 */
export async function CertifiedProducts() {
  const [products, t, locale] = await Promise.all([
    getFeaturedProductsForHomepage(),
    getTranslations("homepage"),
    getLocale() as Promise<Locale>,
  ])

  if (products.length === 0) return null

  // Duplicate cho infinite loop
  const items = [...products, ...products]

  return (
    <Section
      title={t("certProductsTitle")}
      titleHref="/san-pham-doanh-nghiep"
    >
      <div
        className="group relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
        }}
      >
        <div className="flex w-max animate-[homepage-marquee_60s_linear_infinite] gap-4 group-hover:paused">
          {items.map((product, idx) => {
            const productName = localize(product, "name", locale) as string
            const companyName = product.company
              ? (localize(product.company, "name", locale) as string)
              : null
            return (
              <Link
                key={`${product.id}-${idx}`}
                href={`/san-pham/${product.slug}`}
                className="group/card block w-56 shrink-0"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-brand-100">
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <Image
                      src={product.imageUrls[0]}
                      alt={productName}
                      fill
                      placeholder="blur"
                      blurDataURL={BRAND_BLUR_DATA_URL}
                      className="object-cover"
                      sizes="224px"
                    />
                  ) : (
                    <AgarwoodPlaceholder
                      className="h-full w-full"
                      size="lg"
                      shape="square"
                    />
                  )}
                  {product.certStatus === "APPROVED" && (
                    <span className="absolute top-0 left-0 bg-brand-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {t("certProductsCertified")}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 line-clamp-2 text-[14px] font-bold leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover/card:text-brand-700 group-hover/card:underline">
                  {productName}
                </h3>
                <p className="mt-1 line-clamp-1 text-[11px] uppercase tracking-wide text-neutral-500">
                  {companyName ?? product.owner.name}
                </p>
                {product.priceRange && (
                  <p className="mt-0.5 text-[12px] font-semibold text-brand-700">
                    {product.priceRange}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes homepage-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </Section>
  )
}
