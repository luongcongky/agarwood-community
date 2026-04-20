import { auth } from "@/lib/auth"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { prisma } from "@/lib/prisma"
import { getMemberTier } from "@/lib/tier"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { CompanyTabs } from "./CompanyTabs"

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const company = await prisma.company.findUnique({
    where: { slug, isPublished: true },
    select: { name: true, name_en: true, name_zh: true, name_ar: true, description: true, description_en: true, description_zh: true, description_ar: true, logoUrl: true, coverImageUrl: true, address: true, address_en: true, address_zh: true, address_ar: true, foundedYear: true },
  })
  if (!company) return { title: "Not found" }
  return {
    title: `${company.name} | Hội Trầm Hương Việt Nam`,
    description: company.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: company.name,
      images: company.coverImageUrl ? [{ url: company.coverImageUrl }] : company.logoUrl ? [{ url: company.logoUrl }] : [],
      type: "profile",
    },
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: company.name,
        description: company.description?.slice(0, 300),
        foundingDate: company.foundedYear ? String(company.foundedYear) : undefined,
        address: company.address ?? undefined,
      }),
    },
  }
}

export default async function CompanyProfilePage({ params }: Props) {
  const tC = await getTranslations("companyDetail")

  const locale = await getLocale() as Locale
  const l = <T extends Record<string, unknown>>(record: T, field: string) => localize(record, field, locale) as string
  const { slug } = await params
  const session = await auth()
  const currentUserId = session?.user?.id
  const currentUserRole = session?.user?.role

  const company = await prisma.company.findUnique({
    where: { slug, isPublished: true },
    include: {
      owner: { select: { id: true, name: true, role: true, contributionTotal: true } },
      products: {
        where: { isPublished: true },
        orderBy: { certStatus: "desc" },
        select: {
          id: true, name: true, name_en: true, name_zh: true, name_ar: true, slug: true, imageUrls: true,
          category: true, priceRange: true, certStatus: true, badgeUrl: true,
        },
      },
    },
  })
  if (!company) notFound()

  const isOwner = currentUserId === company.ownerId
  const isAdmin = currentUserRole === "ADMIN"
  const canEdit = isOwner || isAdmin

  // VIP tier
  const tier = await getMemberTier(company.owner.contributionTotal, "BUSINESS")

  // Posts count for tab label
  const postCount = await prisma.post.count({
    where: { authorId: company.ownerId, status: "PUBLISHED" },
  })

  return (
    <div className="bg-brand-50/60 min-h-screen">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* White card wrapping all company content */}
      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
      {/* Cover image — no overflow-hidden so the logo can half-overlap into
          the content area below. The outer card still clips to its rounded-2xl. */}
      <div className="relative w-full h-48 sm:h-64 md:h-72">
        {company.coverImageUrl ? (
          <Image src={company.coverImageUrl} alt={l(company, "name")} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 1024px" priority />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-brand-800 via-brand-700 to-brand-900" />
        )}

        {/* Logo overlay — half-sits below the cover's bottom edge */}
        <div className="absolute -bottom-10 left-6 sm:left-10 z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-brand-700">
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={l(company, "name")} fill className="object-cover" sizes="96px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-100">
                {company.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
            )}
          </div>
        </div>

        {/* Edit button */}
        {canEdit && (
          <div className="absolute top-4 right-4">
            <Link
              href="/doanh-nghiep/chinh-sua"
              className="bg-white/90 text-brand-800 px-3 py-1.5 rounded-lg text-sm font-medium shadow hover:bg-white transition-colors"
            >
              Chỉnh sửa
            </Link>
          </div>
        )}
      </div>

      {/* Company info */}
      <div className="mt-14 sm:mt-16 px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-900">{l(company, "name")}</h1>
          {company.isVerified && (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
              ✓ Đã xác minh
            </span>
          )}
          {company.owner.role === "VIP" && (
            <span className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 text-xs font-medium px-2 py-1 rounded-full">
              Thành viên Hội
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
          {company.foundedYear && <span className="text-sm text-brand-700 font-medium">Thành lập {company.foundedYear}</span>}
          {l(company, "address") && <span className="text-sm text-brand-600">{l(company, "address")}</span>}
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-sm font-semibold px-2 py-0.5 rounded-full">
            {"★".repeat(tier.stars)} {tier.label}
          </span>
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          {company.phone && (
            <a href={`tel:${company.phone}`} className="text-brand-600 hover:text-brand-800">{company.phone}</a>
          )}
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-800 underline">
              {company.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        <CompanyTabs
          description={l(company, "description")}
          products={company.products.map((p) => ({ ...p, imageUrls: p.imageUrls as string[] }))}
          companyName={l(company, "name")}
          companySlug={company.slug}
          foundedYear={company.foundedYear}
          employeeCount={company.employeeCount}
          businessLicense={company.businessLicense}
          address={l(company, "address")}
          phone={company.phone}
          website={company.website}
          postCount={postCount}
          canEdit={canEdit}
        />
      </div>
      </div>
    </div>
    </div>
  )
}
