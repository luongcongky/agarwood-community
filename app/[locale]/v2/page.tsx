import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { NewsSectionV2 } from "@/components/features/homepage/v2/NewsSectionV2"
import { MemberRailV2 } from "@/components/features/homepage/v2/MemberRailV2"
import { MultimediaSectionV2 } from "@/components/features/homepage/v2/MultimediaSectionV2"
import { CertifiedProductsV2 } from "@/components/features/homepage/v2/CertifiedProductsV2"
import { ResearchSectionV2 } from "@/components/features/homepage/v2/ResearchSectionV2"
import { PostsSectionV2 } from "@/components/features/homepage/v2/PostsSectionV2"
import { FeaturedCompaniesV2 } from "@/components/features/homepage/v2/FeaturedCompaniesV2"
import { PartnersV2 } from "@/components/features/homepage/v2/PartnersV2"
import { HomepageBannerSlotV2 } from "@/components/features/homepage/v2/HomepageBannerSlotV2"
import { BreakingTickerV2 } from "@/components/features/homepage/v2/BreakingTickerV2"
import {
  BannerSlotSkeleton,
  LatestPostsSkeleton,
  NewsSectionSkeleton,
  MemberRailSkeleton,
} from "@/components/features/homepage/skeletons"

export async function generateMetadata() {
  const t = await getTranslations("meta")
  return {
    title: `${t("titleDefault")} — v2 (prototype)`,
    description: t("description"),
    alternates: { canonical: "/v2" },
    robots: { index: false, follow: false },
  }
}

export const revalidate = 300

export default async function HomeV2() {
  const t = await getTranslations("homepage")

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-4 sm:px-6 lg:px-8 lg:py-6 lg:space-y-10">
      <Suspense fallback={<BannerSlotSkeleton />}>
        <HomepageBannerSlotV2 position="TOP" />
      </Suspense>

      <Suspense fallback={null}>
        <BreakingTickerV2 />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="min-w-0 lg:col-span-3">
          <Suspense fallback={<NewsSectionSkeleton />}>
            <NewsSectionV2 />
          </Suspense>
        </div>
        <div className="min-w-0 lg:col-span-1">
          <Suspense fallback={<MemberRailSkeleton />}>
            <MemberRailV2 />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<LatestPostsSkeleton />}>
        <MultimediaSectionV2 />
      </Suspense>

      <Suspense fallback={<LatestPostsSkeleton />}>
        <CertifiedProductsV2 />
      </Suspense>

      <Suspense fallback={<BannerSlotSkeleton />}>
        <HomepageBannerSlotV2 position="MID" />
      </Suspense>

      <Suspense fallback={<LatestPostsSkeleton />}>
        <ResearchSectionV2 />
      </Suspense>

      <Suspense fallback={<LatestPostsSkeleton />}>
        <PostsSectionV2
          category="NEWS"
          title={t("businessNews")}
          emptyText={t("businessNewsEmpty")}
          variant="feature-list"
        />
      </Suspense>

      <Suspense fallback={<LatestPostsSkeleton />}>
        <PostsSectionV2
          category="PRODUCT"
          title={t("productNews")}
          emptyText={t("productNewsEmpty")}
          variant="hero-list"
        />
      </Suspense>

      <Suspense fallback={null}>
        <FeaturedCompaniesV2 />
      </Suspense>

      <Suspense fallback={null}>
        <PartnersV2 />
      </Suspense>
    </div>
  )
}
