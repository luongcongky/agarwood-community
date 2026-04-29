import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { NewsSection } from "@/components/features/homepage/NewsSection"
import { MemberRail } from "@/components/features/homepage/MemberRail"
import { MultimediaSection } from "@/components/features/homepage/MultimediaSection"
import { CertifiedProducts } from "@/components/features/homepage/CertifiedProducts"
import { ResearchSection } from "@/components/features/homepage/ResearchSection"
import { AgricultureSection } from "@/components/features/homepage/AgricultureSection"
import { PostsSection } from "@/components/features/homepage/PostsSection"
import { FeaturedCompanies } from "@/components/features/homepage/FeaturedCompanies"
import { Partners } from "@/components/features/homepage/Partners"
import { HomepageBannerSlot } from "@/components/features/homepage/HomepageBannerSlot"
import { BreakingTicker } from "@/components/features/homepage/BreakingTicker"
import { HomepageJoinBanner } from "@/components/features/register-nudge/HomepageJoinBanner"
import {
  BannerSlotSkeleton,
  LatestPostsSkeleton,
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
    <>
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-4 sm:px-6 lg:px-8 lg:py-6 lg:space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      <Suspense fallback={<BannerSlotSkeleton />}>
        <HomepageBannerSlot position="TOP" />
      </Suspense>

      <Suspense fallback={null}>
        <BreakingTicker />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="min-w-0 lg:col-span-3">
          <Suspense fallback={<NewsSectionSkeleton />}>
            <NewsSection />
          </Suspense>
        </div>
        <div className="min-w-0 lg:col-span-1">
          <Suspense fallback={<MemberRailSkeleton />}>
            <MemberRail />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<LatestPostsSkeleton />}>
        <MultimediaSection />
      </Suspense>

      <Suspense fallback={<LatestPostsSkeleton />}>
        <CertifiedProducts />
      </Suspense>

      <Suspense fallback={<BannerSlotSkeleton />}>
        <HomepageBannerSlot position="MID" />
      </Suspense>

      <Suspense fallback={<LatestPostsSkeleton />}>
        <ResearchSection />
      </Suspense>

      <Suspense fallback={<LatestPostsSkeleton />}>
        <AgricultureSection />
      </Suspense>

      <Suspense fallback={<LatestPostsSkeleton />}>
        {/* Q0=C (Phase 3.3 2026-04): gộp Post.NEWS + News.BUSINESS — bài
            user-feed về tin doanh nghiệp + tin admin BUSINESS chung 1 list,
            sort theo date desc. */}
        <PostsSection
          category="NEWS"
          newsCategory="BUSINESS"
          title={t("businessNews")}
          emptyText={t("businessNewsEmpty")}
          variant="feature-list"
        />
      </Suspense>

      <Suspense fallback={<LatestPostsSkeleton />}>
        {/* Q0=C: gộp Post.PRODUCT + News.PRODUCT — admin tin sản phẩm vào
            chung list với bài user khoe sản phẩm. */}
        <PostsSection
          category="PRODUCT"
          newsCategory="PRODUCT"
          title={t("productNews")}
          emptyText={t("productNewsEmpty")}
          variant="hero-list"
        />
      </Suspense>

      <Suspense fallback={null}>
        <FeaturedCompanies />
      </Suspense>

      <Suspense fallback={null}>
        <Partners />
      </Suspense>
    </div>

    {/* Hero CTA banner — full-width, ngoài max-w-7xl container để gradient
        bg fill toàn viewport. Chỉ hiện cho guest, gate ở server-side. */}
    <Suspense fallback={null}>
      <HomepageJoinBanner />
    </Suspense>
    </>
  )
}
