import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ProductGallery } from "./ProductGallery"

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug, isPublished: true },
    select: { name: true, description: true, imageUrls: true, category: true },
  })
  if (!product) return { title: "Không tìm thấy sản phẩm" }
  return {
    title: `${product.name} | Hội Trầm Hương Việt Nam`,
    description: product.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? undefined,
      images: product.imageUrls.length > 0 ? [{ url: product.imageUrls[0] as string }] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const product = await prisma.product.findUnique({
    where: { slug, isPublished: true },
    include: {
      company: {
        select: {
          name: true, slug: true, logoUrl: true, isVerified: true,
          ownerId: true, phone: true, website: true,
        },
      },
      certifications: {
        where: { status: "APPROVED" },
        orderBy: { approvedAt: "desc" },
        take: 1,
        select: { id: true, approvedAt: true, isOnlineReview: true },
      },
    },
  })
  if (!product) notFound()

  // Related products: same category OR same company, cert products first
  const relatedProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      slug: { not: slug },
      OR: [
        { category: product.category },
        { companyId: product.companyId },
      ],
    },
    take: 3,
    orderBy: { certStatus: "desc" },
    select: {
      id: true, name: true, slug: true, imageUrls: true,
      category: true, priceRange: true, certStatus: true,
      company: { select: { name: true } },
    },
  })

  const imageUrls = product.imageUrls as string[]
  const approvedCert = product.certifications[0] ?? null
  const certDate = approvedCert?.approvedAt
    ? new Date(approvedCert.approvedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null

  // Role-based CTA logic
  const isOwner = session?.user?.id === product.company.ownerId
  const isAdmin = session?.user?.role === "ADMIN"

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description?.slice(0, 300),
    image: imageUrls[0] ?? undefined,
    category: product.category ?? undefined,
    brand: { "@type": "Organization", name: product.company.name },
    ...(product.certStatus === "APPROVED" && certDate ? {
      certification: {
        "@type": "Certification",
        name: "Chứng nhận Hội Trầm Hương Việt Nam",
        certificationStatus: "CertificationActive",
        datePublished: approvedCert?.approvedAt ? new Date(approvedCert.approvedAt).toISOString() : undefined,
        issuedBy: { "@type": "Organization", name: "Hội Trầm Hương Việt Nam" },
      },
    } : {}),
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-brand-500 mb-6 flex-wrap">
        <Link href="/" className="hover:text-brand-700">Trang chủ</Link>
        <span>/</span>
        <Link href="/san-pham-chung-nhan" className="hover:text-brand-700">Sản phẩm Chứng nhận</Link>
        {product.category && (
          <>
            <span>/</span>
            <span className="text-brand-500">{product.category}</span>
          </>
        )}
        <span>/</span>
        <span className="text-brand-800 font-medium line-clamp-1">{product.name}</span>
      </nav>

      {/* Main: two-column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Left: gallery */}
        <ProductGallery imageUrls={imageUrls} productName={product.name} />

        {/* Right: info */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-900 leading-tight">
              {product.name}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-200 overflow-hidden shrink-0">
                {product.company.logoUrl ? (
                  <img src={product.company.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-brand-700">
                    {product.company.name[0]}
                  </span>
                )}
              </div>
              <Link href={`/doanh-nghiep/${product.company.slug}`} className="text-sm text-brand-600 hover:text-brand-800">
                {product.company.name}
              </Link>
              {product.company.isVerified && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">✓ Đã xác minh</span>
              )}
            </div>
          </div>

          {/* Category & price */}
          <div className="flex flex-wrap gap-3">
            {product.category && (
              <span className="bg-brand-100 text-brand-700 text-sm px-3 py-1 rounded-full">{product.category}</span>
            )}
            {product.priceRange && (
              <span className="bg-brand-500 text-white text-sm font-semibold px-3 py-1 rounded-full">{product.priceRange}</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="prose prose-sm max-w-none text-brand-700 leading-relaxed">
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* ── Certification section (most prominent) ────────────────── */}
          {product.certStatus === "APPROVED" && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                {product.badgeUrl && (
                  <img src={product.badgeUrl} alt="Badge" className="w-14 h-14 rounded-lg object-contain shrink-0" />
                )}
                <div>
                  <p className="text-amber-900 font-bold text-base uppercase tracking-wide">
                    ✓ Sản phẩm đã được chứng nhận
                  </p>
                  <p className="text-amber-800 text-sm mt-0.5">Hội Trầm Hương Việt Nam</p>
                </div>
              </div>
              <div className="text-sm text-amber-800 space-y-1">
                {certDate && <p>Ngày cấp: <span className="font-semibold">{certDate}</span></p>}
                {approvedCert?.isOnlineReview !== undefined && (
                  <p>Hình thức: <span className="font-semibold">{approvedCert.isOnlineReview ? "Kiểm tra trực tuyến" : "Kiểm tra trực tiếp"}</span></p>
                )}
              </div>
            </div>
          )}

          {product.certStatus === "PENDING" || product.certStatus === "UNDER_REVIEW" ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 font-medium text-sm">Đang chờ xét duyệt chứng nhận</p>
            </div>
          ) : product.certStatus !== "APPROVED" ? (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
              <p className="text-brand-500 text-sm">Sản phẩm chưa có chứng nhận từ Hội</p>
            </div>
          ) : null}

          {/* ── Role-based CTAs ────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 pt-2">
            {isOwner && (
              <>
                <Link
                  href={`/san-pham/${slug}/sua`}
                  className="rounded-lg bg-brand-700 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-800 transition-colors"
                >
                  Chỉnh sửa sản phẩm
                </Link>
                {product.certStatus === "DRAFT" && (
                  <Link
                    href="/chung-nhan/nop-don"
                    className="rounded-lg border border-brand-300 text-brand-700 px-4 py-2.5 text-sm font-medium hover:bg-brand-50 transition-colors"
                  >
                    Nộp đơn chứng nhận
                  </Link>
                )}
              </>
            )}
            {isAdmin && (
              <Link
                href={`/san-pham/${slug}/sua`}
                className="rounded-lg bg-brand-700 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-800 transition-colors"
              >
                Chỉnh sửa
              </Link>
            )}
            {!isOwner && !isAdmin && (
              <Link
                href={`/doanh-nghiep/${product.company.slug}`}
                className="rounded-lg bg-brand-700 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-800 transition-colors"
              >
                Liên hệ doanh nghiệp
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-brand-200 pt-8">
          <h2 className="text-xl font-semibold text-brand-900 mb-5">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {relatedProducts.map((rp) => {
              const rpImages = rp.imageUrls as string[]
              return (
                <Link
                  key={rp.id}
                  href={`/san-pham/${rp.slug}`}
                  className="group block bg-white border border-brand-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-brand-100">
                    {rpImages.length > 0 ? (
                      <img src={rpImages[0]} alt={rp.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-brand-200 to-brand-300">
                        <span className="text-3xl">🌿</span>
                      </div>
                    )}
                    {rp.certStatus === "APPROVED" && (
                      <span className="absolute top-2 right-2 bg-brand-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full shadow">✓</span>
                    )}
                  </div>
                  <div className="p-3 space-y-0.5">
                    <p className="text-sm font-semibold text-brand-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">{rp.name}</p>
                    <p className="text-xs text-brand-500">{rp.company.name}</p>
                    {rp.category && <p className="text-xs text-brand-400">{rp.category}</p>}
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
