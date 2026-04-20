import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { ProductGallery } from "./ProductGallery"
import { CommentsSection } from "@/components/features/comments/CommentsSection"

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug, isPublished: true },
    select: { name: true, name_en: true, name_zh: true, name_ar: true, description: true, description_en: true, description_zh: true, description_ar: true, imageUrls: true, category: true },
  })
  if (!product) return { title: "Not found" }
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
  const tP = await getTranslations("productDetail")

  const locale = await getLocale() as Locale
  const l = <T extends Record<string, unknown>>(record: T, field: string) => localize(record, field, locale) as string
  const { slug } = await params
  const session = await auth()

  const product = await prisma.product.findUnique({
    where: { slug, isPublished: true },
    include: {
      owner: {
        select: {
          id: true, name: true, avatarUrl: true, phone: true,
          role: true, contributionTotal: true,
        },
      },
      company: {
        select: {
          name: true, name_en: true, name_zh: true, name_ar: true, slug: true, logoUrl: true, isVerified: true,
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

  // Related products: same category OR same company/owner, cert products first
  const relatedProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      slug: { not: slug },
      OR: [
        { category: product.category },
        ...(product.companyId ? [{ companyId: product.companyId }] : []),
        { ownerId: product.ownerId },
      ],
    },
    take: 3,
    orderBy: { certStatus: "desc" },
    select: {
      id: true, name: true, name_en: true, name_zh: true, name_ar: true, slug: true, imageUrls: true,
      category: true, category_en: true, category_zh: true, category_ar: true, priceRange: true, certStatus: true,
      company: { select: { name: true } },
    },
  })

  const imageUrls = product.imageUrls as string[]
  const approvedCert = product.certifications[0] ?? null
  const certDate = approvedCert?.approvedAt
    ? new Date(approvedCert.approvedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null

  // Role-based CTA logic
  const isOwner = session?.user?.id === product.owner.id
  const viewerIsAdmin = isAdmin(session?.user?.role)
  const hasCompany = !!product.company

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description?.slice(0, 300),
    image: imageUrls[0] ?? undefined,
    category: product.category ?? undefined,
    brand: product.company
      ? { "@type": "Organization", name: product.company.name }
      : { "@type": "Person", name: product.owner.name },
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
    <div className="bg-brand-50/60 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      {/* Breadcrumb — outside the card, on page background */}
      <nav className="flex items-center gap-2 text-sm text-brand-500 mb-6 flex-wrap">
        <Link href="/" className="hover:text-brand-700">Trang chủ</Link>
        <span>/</span>
        <Link href="/san-pham-chung-nhan" className="hover:text-brand-700">Sản phẩm Chứng nhận</Link>
        {l(product, "category") && (
          <>
            <span>/</span>
            <span className="text-brand-500">{l(product, "category")}</span>
          </>
        )}
        <span>/</span>
        <span className="text-brand-800 font-medium line-clamp-1">{l(product, "name")}</span>
      </nav>

      {/* Main content card */}
      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-6 sm:p-8 mb-10">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Left: gallery */}
          <ProductGallery imageUrls={imageUrls} productName={l(product, "name")} />

          {/* Right: info */}
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-900 leading-tight">
                {l(product, "name")}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                {hasCompany ? (
                  <>
                    <div className="relative w-6 h-6 rounded-full bg-brand-200 overflow-hidden shrink-0">
                      {product.company!.logoUrl ? (
                        <Image src={product.company!.logoUrl} alt={product.company!.name} fill className="object-cover" sizes="24px" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-brand-700">
                          {product.company!.name[0]}
                        </span>
                      )}
                    </div>
                    <Link href={`/doanh-nghiep/${product.company!.slug}`} className="text-sm text-brand-600 hover:text-brand-800">
                      {product.company!.name}
                    </Link>
                    {product.company!.isVerified && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{tP("verified")}</span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="relative w-6 h-6 rounded-full bg-brand-200 overflow-hidden shrink-0">
                      {product.owner.avatarUrl ? (
                        <Image src={product.owner.avatarUrl} alt={product.owner.name} fill className="object-cover" sizes="24px" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-brand-700">
                          {product.owner.name[0]}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-brand-600">{product.owner.name}</span>
                    {product.owner.role === "VIP" && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">{tP("member")}</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Category & price */}
            <div className="flex flex-wrap gap-3">
              {l(product, "category") && (
                <span className="bg-brand-100 text-brand-700 text-sm px-3 py-1 rounded-full">{l(product, "category")}</span>
              )}
              {product.priceRange && (
                <span className="bg-brand-500 text-white text-sm font-semibold px-3 py-1 rounded-full">{product.priceRange}</span>
              )}
            </div>

            {/* Description */}
            {l(product, "description") && (
              <div
                className="prose prose-sm max-w-none text-brand-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(l(product, "description") ?? "") }}
              />
            )}

            {/* ── Certification section (most prominent) ────────────────── */}
            {product.certStatus === "APPROVED" && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  {product.badgeUrl && (
                    <Image src={product.badgeUrl} alt="Badge" width={56} height={56} className="rounded-lg object-contain shrink-0" />
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
              {viewerIsAdmin && (
                <Link
                  href={`/san-pham/${slug}/sua`}
                  className="rounded-lg bg-brand-700 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-800 transition-colors"
                >
                  Chỉnh sửa
                </Link>
              )}
              {!isOwner && !viewerIsAdmin && hasCompany && (
                <Link
                  href={`/doanh-nghiep/${product.company!.slug}`}
                  className="rounded-lg bg-brand-700 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-800 transition-colors"
                >
                  Liên hệ doanh nghiệp
                </Link>
              )}
              {!isOwner && !viewerIsAdmin && !hasCompany && product.owner.phone && (
                <a
                  href={`tel:${product.owner.phone}`}
                  className="rounded-lg bg-brand-700 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-800 transition-colors"
                >
                  Gọi: {product.owner.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Comments / Discussion section — inside the card */}
        <CommentsSection
          productId={product.id}
          currentUserId={session?.user?.id ?? null}
          currentUserRole={session?.user?.role}
          currentUserName={session?.user?.name}
          currentUserAvatar={session?.user?.image}
        />
      </div>

      {/* Related products — outside the card, on page background */}
      {relatedProducts.length > 0 && (
        <section className="pt-8">
          <h2 className="text-xl font-semibold text-brand-900 mb-5">{tP("relatedProducts")}</h2>
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
                      <Image src={rpImages[0]} alt={l(rp, "name")} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
                    ) : (
                      <AgarwoodPlaceholder className="w-full h-full" size="md" shape="square" tone="light" />
                    )}
                    {rp.certStatus === "APPROVED" && (
                      <span className="absolute top-2 right-2 bg-brand-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full shadow">✓</span>
                    )}
                  </div>
                  <div className="p-3 space-y-0.5">
                    <p className="text-sm font-semibold text-brand-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">{l(rp, "name")}</p>
                    <p className="text-xs text-brand-500">{rp.company?.name ?? ""}</p>
                    {l(rp, "category") && <p className="text-xs text-brand-400">{l(rp, "category")}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
      </div>
    </div>
  )
}
