import Link from "next/link"
import Image from "next/image"
import { getFeaturedProductsForHomepage } from "@/lib/homepage"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"

/**
 * Section 3 — Sản phẩm tiêu biểu (carousel).
 *
 * CSS-only marquee scroll (không cần JS). Duplicate danh sách 2 lần để tạo
 * loop liên tục. Hover sẽ pause animation.
 *
 * Animation định nghĩa inline trong component này (không cần global CSS).
 *
 * Width: constrain trong max-w-7xl (không full bleed) — match các section khác.
 */
export async function CertifiedProductsCarousel() {
  const products = await getFeaturedProductsForHomepage()

  if (products.length === 0) {
    return (
      <section className="bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              Sản phẩm tiêu biểu
            </h2>
            <p className="text-sm text-brand-500 mt-1">
              Sản phẩm trầm hương được tuyển chọn từ các doanh nghiệp hội viên
            </p>
          </header>
          <div className="rounded-xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
            Chưa có sản phẩm tiêu biểu nào.
          </div>
        </div>
      </section>
    )
  }

  // Duplicate cho infinite loop
  const items = [...products, ...products]

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-brand-900 sm:text-2xl">
              Sản phẩm tiêu biểu
            </h2>
            <p className="text-sm text-brand-500 mt-0.5">
              Sản phẩm trầm hương được tuyển chọn từ các doanh nghiệp hội viên
            </p>
          </div>
          <Link
            href="/san-pham-doanh-nghiep"
            className="hidden sm:inline-block text-sm font-medium text-brand-600 hover:text-brand-800 underline underline-offset-4"
          >
            Xem tất cả →
          </Link>
        </div>

        {/* Marquee container — constrain bên trong max-w-7xl, overflow ẩn */}
        <div
          className="group relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
          }}
        >
          <div className="flex gap-4 w-max animate-[homepage-marquee_60s_linear_infinite] group-hover:paused">
            {items.map((product, idx) => (
              <Link
                key={`${product.id}-${idx}`}
                href={`/san-pham/${product.slug}`}
                className="block w-56 shrink-0 group/card"
              >
                <div className="relative h-56 w-full overflow-hidden rounded-lg border border-brand-200 bg-brand-50">
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <Image
                      src={product.imageUrls[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                      sizes="224px"
                    />
                  ) : (
                    <AgarwoodPlaceholder className="h-full w-full" size="lg" shape="square" />
                  )}
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
                    ⭐ Tiêu biểu
                  </span>
                  {product.certStatus === "APPROVED" && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
                      ✓ Chứng nhận
                    </span>
                  )}
                </div>
                <div className="mt-2 px-1">
                  <h3 className="line-clamp-1 text-sm font-semibold text-brand-900 group-hover/card:text-brand-700">
                    {product.name}
                  </h3>
                  <p className="line-clamp-1 text-xs text-brand-500 mt-0.5">
                    {product.company?.name ?? product.owner.name}
                  </p>
                  {product.priceRange && (
                    <p className="text-xs text-brand-700 font-medium mt-0.5">
                      {product.priceRange}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Animation keyframes — inline để không phụ thuộc global CSS */}
      <style>{`
        @keyframes homepage-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
