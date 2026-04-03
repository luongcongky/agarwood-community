import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ProductGallery } from "./ProductGallery"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug, isPublished: true },
    select: { name: true, description: true, imageUrls: true },
  })
  if (!product) return { title: "Không tìm thấy sản phẩm" }
  return {
    title: `${product.name} | Hội Trầm Hương Việt Nam`,
    description: product.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? undefined,
      images:
        product.imageUrls.length > 0
          ? [{ url: product.imageUrls[0] as string }]
          : [],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug, isPublished: true },
    include: {
      company: {
        select: {
          name: true,
          slug: true,
          logoUrl: true,
          isVerified: true,
        },
      },
      certifications: {
        where: { status: "APPROVED" },
        orderBy: { approvedAt: "desc" },
        take: 1,
      },
    },
  })
  if (!product) notFound()

  // Related products from same company (up to 4, excluding current)
  const relatedProducts = await prisma.product.findMany({
    where: {
      companyId: product.companyId,
      isPublished: true,
      slug: { not: slug },
    },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrls: true,
      category: true,
      priceRange: true,
      certStatus: true,
    },
  })

  const approvedCert = product.certifications[0] ?? null
  const imageUrls = product.imageUrls as string[]

  // Determine cert status display
  const certApprovedDate = approvedCert?.approvedAt
    ? new Date(approvedCert.approvedAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-brand-500 mb-6 flex-wrap">
        <Link href="/hoi-vien" className="hover:text-brand-700 transition-colors">
          Hội viên
        </Link>
        <span>/</span>
        <Link
          href={`/doanh-nghiep/${product.company.slug}`}
          className="hover:text-brand-700 transition-colors"
        >
          {product.company.name}
        </Link>
        <span>/</span>
        <span className="text-brand-800 font-medium line-clamp-1">
          {product.name}
        </span>
      </nav>

      {/* Main content: two-column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Left: image gallery */}
        <ProductGallery imageUrls={imageUrls} productName={product.name} />

        {/* Right: product info */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-brand-900 leading-tight">
              {product.name}
            </h1>
            {/* Company link */}
            <div className="mt-2 flex items-center gap-2">
              {product.company.logoUrl && (
                <img
                  src={product.company.logoUrl}
                  alt={product.company.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <Link
                href={`/doanh-nghiep/${product.company.slug}`}
                className="text-sm text-brand-600 hover:text-brand-800 transition-colors"
              >
                {product.company.name}
              </Link>
              {product.company.isVerified && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                  ✓ Đã xác minh
                </span>
              )}
            </div>
          </div>

          {/* Category & price */}
          <div className="flex flex-wrap gap-3">
            {product.category && (
              <span className="inline-block bg-brand-100 text-brand-700 text-sm px-3 py-1 rounded-full">
                {product.category}
              </span>
            )}
            {product.priceRange && (
              <span className="inline-block bg-brand-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                {product.priceRange}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="prose prose-sm max-w-none text-brand-700 leading-relaxed">
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Certification status box */}
          <div>
            {product.certStatus === "APPROVED" ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {product.badgeUrl && (
                    <img
                      src={product.badgeUrl}
                      alt="Badge chứng nhận"
                      className="w-12 h-12 rounded-lg object-contain shrink-0"
                    />
                  )}
                  <div>
                    <p className="text-green-800 font-semibold text-sm">
                      🏅 Sản phẩm đã được Hội Trầm Hương Việt Nam chứng nhận
                    </p>
                    {certApprovedDate && (
                      <p className="text-green-600 text-xs mt-1">
                        Ngày cấp: {certApprovedDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : product.certStatus === "PENDING" ||
              product.certStatus === "UNDER_REVIEW" ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800 font-medium text-sm">
                  ⏳ Đang chờ xét duyệt chứng nhận
                </p>
              </div>
            ) : (
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                <p className="text-brand-500 text-sm">
                  Sản phẩm chưa có chứng nhận từ Hội
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-brand-100 pt-8">
          <h2 className="font-heading text-xl font-semibold text-brand-900 mb-5">
            Sản phẩm khác từ {product.company.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((rp) => {
              const rpImages = rp.imageUrls as string[]
              return (
                <Link
                  key={rp.id}
                  href={`/san-pham/${rp.slug}`}
                  className="group block bg-white border border-brand-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-brand-100">
                    {rpImages.length > 0 ? (
                      <img
                        src={rpImages[0]}
                        alt={rp.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-200 to-brand-300">
                        <span className="text-3xl">🌿</span>
                      </div>
                    )}
                    {rp.certStatus === "APPROVED" && (
                      <span className="absolute top-2 right-2 bg-brand-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full shadow">
                        🏅
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-0.5">
                    <p className="text-sm font-semibold text-brand-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                      {rp.name}
                    </p>
                    {rp.category && (
                      <p className="text-xs text-brand-500">{rp.category}</p>
                    )}
                    {rp.priceRange && (
                      <p className="text-xs font-medium text-brand-700">
                        {rp.priceRange}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
