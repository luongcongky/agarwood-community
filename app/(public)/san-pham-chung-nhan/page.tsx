import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Sản phẩm được chứng nhận | Hội Trầm Hương Việt Nam",
  description:
    "Danh sách các sản phẩm trầm hương đã được Hội Trầm Hương Việt Nam kiểm định và cấp chứng nhận chất lượng chính thức.",
  openGraph: {
    title: "Sản phẩm được chứng nhận | Hội Trầm Hương Việt Nam",
    description:
      "Danh sách các sản phẩm trầm hương đã được Hội Trầm Hương Việt Nam kiểm định và cấp chứng nhận chất lượng chính thức.",
    type: "website",
  },
}

export default async function CertifiedProductsPage() {
  const products = await prisma.product.findMany({
    where: { certStatus: "APPROVED", isPublished: true },
    orderBy: { certApprovedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrls: true,
      category: true,
      priceRange: true,
      badgeUrl: true,
      certApprovedAt: true,
      company: {
        select: { name: true, slug: true, logoUrl: true, isVerified: true },
      },
    },
  })

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-800 text-white py-14">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="text-4xl mb-4">🏅</div>
          <h1 className="text-3xl font-bold sm:text-4xl">Sản phẩm được Chứng nhận</h1>
          <p className="mt-4 text-brand-200 max-w-xl mx-auto">
            Các sản phẩm trầm hương đã qua kiểm định và được Hội Trầm Hương Việt Nam
            cấp chứng nhận chất lượng chính thức.
          </p>
          <p className="mt-2 text-brand-300 font-semibold text-lg">
            {products.length} sản phẩm
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 bg-brand-50">
        <div className="mx-auto max-w-6xl px-4">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🌿</div>
              <p className="text-brand-600 text-lg">Chưa có sản phẩm nào được chứng nhận.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const firstImage = product.imageUrls[0] ?? null
                return (
                  <Link
                    key={product.id}
                    href={`/san-pham/${product.slug}`}
                    className="group bg-white rounded-xl border border-brand-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-brand-100">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl">🌿</span>
                        </div>
                      )}
                      {/* Cert badge overlay */}
                      <div className="absolute top-3 right-3 bg-brand-400 text-brand-900 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                        🏅 Đã chứng nhận
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="font-semibold text-brand-900 text-base leading-snug group-hover:text-brand-700 transition-colors">
                        {product.name}
                      </h2>

                      {product.category && (
                        <p className="mt-1 text-xs text-brand-500">{product.category}</p>
                      )}

                      {/* Company */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-brand-700 flex-shrink-0 flex items-center justify-center">
                          {product.company.logoUrl ? (
                            <img
                              src={product.company.logoUrl}
                              alt={product.company.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-brand-100">
                              {product.company.name[0]}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-brand-600 line-clamp-1">
                          {product.company.name}
                          {product.company.isVerified && (
                            <span className="ml-1 text-green-600">✓</span>
                          )}
                        </span>
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between">
                        {product.priceRange && (
                          <span className="text-xs text-brand-500">{product.priceRange}</span>
                        )}
                        {product.certApprovedAt && (
                          <span className="text-xs text-brand-400">
                            CN:{" "}
                            {new Date(product.certApprovedAt).toLocaleDateString("vi-VN", {
                              month: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-800 py-14 text-center text-white">
        <p className="text-brand-200 mb-4">Bạn muốn đăng ký chứng nhận sản phẩm của mình?</p>
        <Link
          href="/chung-nhan/nop-don"
          className={cn(
            "inline-flex items-center justify-center rounded-lg",
            "bg-brand-400 text-brand-900 font-semibold px-6 py-3",
            "hover:bg-brand-300 transition-colors"
          )}
        >
          Nộp đơn chứng nhận
        </Link>
      </section>
    </>
  )
}
