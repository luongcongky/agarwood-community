import { Suspense } from "react"
import type { Metadata } from "next"
import { MemberNewsRail } from "@/components/features/homepage/MemberNewsRail"
import { CertifiedProductsCarousel } from "@/components/features/homepage/CertifiedProductsCarousel"
import { HomepageBannerSlot } from "@/components/features/homepage/HomepageBannerSlot"
import { PartnersCarousel } from "@/components/features/homepage/PartnersCarousel"
import { NewsSection } from "@/components/features/homepage/NewsSection"
import { LatestPostsSection } from "@/components/features/homepage/LatestPostsSection"
import {
  CarouselSkeleton,
  LatestPostsSkeleton,
  BannerSlotSkeleton,
  PartnersCarouselSkeleton,
} from "@/components/features/homepage/skeletons"

export const metadata: Metadata = {
  title: "Hội Trầm Hương Việt Nam — Cộng đồng Doanh nghiệp Trầm Hương",
  description:
    "Nền tảng kết nối doanh nghiệp trầm hương Việt Nam. Tin tức, sản phẩm chứng nhận, bản tin hội viên cập nhật liên tục.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hội Trầm Hương Việt Nam",
    description: "Cộng đồng kết nối doanh nghiệp trầm hương uy tín trên toàn quốc.",
    type: "website",
  },
}

export const revalidate = 300

export default function HomePage() {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* ── Banner TOP — stream ── */}
      <Suspense fallback={<BannerSlotSkeleton />}>
        <HomepageBannerSlot position="TOP" />
      </Suspense>

      {/*
        Section 1 + 2: Tin Hội + Bản tin hội viên — KHÔNG bọc Suspense.
        Next.js sẽ chờ 2 component này resolve xong mới flush HTML đầu tiên,
        đảm bảo "khối nội dung chính" luôn hiện ngay khi trang hiện ra.
        Các section khác (banners, carousels, latest posts, partners) vẫn stream sau.
      */}
      <section className="bg-brand-50 py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <NewsSection />
            <div className="min-w-0 lg:col-span-1">
              <MemberNewsRail />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Sản phẩm chứng nhận ── */}
      <Suspense fallback={<CarouselSkeleton />}>
        <CertifiedProductsCarousel />
      </Suspense>

      {/* ── Section 4: Banner MID ── */}
      <Suspense fallback={<BannerSlotSkeleton />}>
        <HomepageBannerSlot position="MID" />
      </Suspense>

      {/* ── Section 5: Tin doanh nghiệp mới nhất ── */}
      <Suspense fallback={<LatestPostsSkeleton />}>
        <LatestPostsSection
          category="NEWS"
          title="Tin doanh nghiệp mới nhất"
          subtitle="Tin tức từ các doanh nghiệp hội viên"
          emptyText="Chưa có tin tức nào từ doanh nghiệp hội viên."
        />
      </Suspense>

      {/* ── Section 6: Tin sản phẩm mới nhất ── */}
      <Suspense fallback={<LatestPostsSkeleton />}>
        <LatestPostsSection
          category="PRODUCT"
          title="Tin sản phẩm mới nhất"
          subtitle="Sản phẩm mới giới thiệu hoặc vừa được chứng nhận"
          emptyText="Chưa có tin sản phẩm nào."
        />
      </Suspense>

      {/* ── Section 7: Đối tác ── */}
      <Suspense fallback={<PartnersCarouselSkeleton />}>
        <PartnersCarousel />
      </Suspense>
    </>
  )
}
