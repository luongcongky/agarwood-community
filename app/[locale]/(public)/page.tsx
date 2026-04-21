import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { MemberNewsRail } from "@/components/features/homepage/MemberNewsRail"
import { CertifiedProductsCarousel } from "@/components/features/homepage/CertifiedProductsCarousel"
import { HomepageBannerSlot } from "@/components/features/homepage/HomepageBannerSlot"
import { PartnersCarousel } from "@/components/features/homepage/PartnersCarousel"
import { NewsSection } from "@/components/features/homepage/NewsSection"
import { LatestPostsSection } from "@/components/features/homepage/LatestPostsSection"
import { LatestResearchSection } from "@/components/features/homepage/LatestResearchSection"
import { FeaturedCompaniesCarousel } from "@/components/features/homepage/FeaturedCompaniesCarousel"
import { BreakingTicker } from "@/components/features/layout/BreakingTicker"
import {
  CarouselSkeleton,
  LatestPostsSkeleton,
  BannerSlotSkeleton,
  PartnersCarouselSkeleton,
  NewsSectionSkeleton,
  MemberRailSkeleton,
} from "@/components/features/homepage/skeletons"

export async function generateMetadata() {
  const t = await getTranslations("meta")
  return {
    title: t("titleDefault"),
    description: t("description"),
    alternates: { canonical: "/" },
    openGraph: {
      title: t("titleDefault"),
      description: t("description"),
      type: "website",
    },
  }
}

export const revalidate = 300

export default async function HomePage() {
  const t = await getTranslations("homepage")

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hội Trầm Hương Việt Nam",
    alternateName: "VAWA — Vietnam Agarwood Association",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoitramhuong.vn",
    description:
      "Cộng đồng kết nối, chứng nhận và truyền thông sản phẩm trầm hương Việt Nam.",
    foundingDate: "2010-01-11",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Số 150, Đường Lý Chính Thắng, Phường Xuân Hòa",
      addressLocality: "Thành phố Hồ Chí Minh",
      addressCountry: "VN",
    },
    sameAs: ["https://www.facebook.com/hoitramhuongvietnam.org"],
  }

  return (
    // data-page="home" scopes the Option-A typography refinement pass
    // (see .home in globals.css). Only the homepage is touched — every
    // other public page keeps the original typography.
    <div data-page="home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* ── Banner TOP — stream ── */}
      <Suspense fallback={<BannerSlotSkeleton />}>
        <HomepageBannerSlot position="TOP" />
      </Suspense>

      {/* ── Breaking news ticker — stream, ẩn nếu không có tin ghim/văn bản
           trong 30 ngày. Đặt sau banner TOP theo yêu cầu. ── */}
      <Suspense fallback={null}>
        <BreakingTicker />
      </Suspense>

      {/* Section 1 + 2: Tin Hội + Bản tin hội viên — stream song song. */}
      <section className="bg-brand-50/85 backdrop-blur-[2px] py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <Suspense fallback={<NewsSectionSkeleton />}>
                <NewsSection />
              </Suspense>
            </div>
            <div className="min-w-0 lg:col-span-1">
              <Suspense fallback={<MemberRailSkeleton />}>
                <MemberNewsRail />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Sản phẩm chứng nhận ── */}
      <Suspense fallback={<CarouselSkeleton />}>
        <CertifiedProductsCarousel />
      </Suspense>

      {/* ── Section 3b: Nghiên cứu mới nhất ── */}
      <Suspense fallback={<LatestPostsSkeleton />}>
        <LatestResearchSection />
      </Suspense>

      {/* ── Section 4: Banner MID ── */}
      <Suspense fallback={<BannerSlotSkeleton />}>
        <HomepageBannerSlot position="MID" />
      </Suspense>

      {/* ── Section 5: Tin doanh nghiệp mới nhất ── */}
      <Suspense fallback={<LatestPostsSkeleton />}>
        <LatestPostsSection
          category="NEWS"
          title={t("businessNews")}
          subtitle={t("businessNewsSubtitle")}
          emptyText={t("businessNewsEmpty")}
        />
      </Suspense>

      {/* ── Section 6: Tin sản phẩm mới nhất ── */}
      <Suspense fallback={<LatestPostsSkeleton />}>
        <LatestPostsSection
          category="PRODUCT"
          title={t("productNews")}
          subtitle={t("productNewsSubtitle")}
          emptyText={t("productNewsEmpty")}
        />
      </Suspense>

      {/* ── Section 6b: Doanh nghiệp tiêu biểu — marquee tương tự Partners ── */}
      <Suspense fallback={<PartnersCarouselSkeleton />}>
        <FeaturedCompaniesCarousel />
      </Suspense>

      {/* ── Section 7: Đối tác ── */}
      <Suspense fallback={<PartnersCarouselSkeleton />}>
        <PartnersCarousel />
      </Suspense>
    </div>
  )
}
