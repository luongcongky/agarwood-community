import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { getTierThresholds } from "@/lib/tier"

export const revalidate = 600

export const metadata: Metadata = {
  title: "Quyền lợi Hội viên — Hội Trầm Hương Việt Nam",
  description:
    "Quyền lợi độc quyền dành cho hội viên VIP: hiển thị nổi bật trang chủ, chứng nhận sản phẩm, banner quảng cáo và mạng lưới doanh nghiệp trầm hương toàn quốc.",
  alternates: { canonical: "/landing" },
  openGraph: {
    title: "Quyền lợi Hội viên — Hội Trầm Hương Việt Nam",
    description:
      "Hơn 100 doanh nghiệp trầm hương đã tham gia. Hiển thị trang chủ, chứng nhận sản phẩm, banner quảng cáo và mạng lưới đối tác toàn quốc.",
    type: "website",
    images: [
      {
        url: "/landing-og.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quyền lợi Hội viên — Hội Trầm Hương Việt Nam",
    description:
      "Quyền lợi độc quyền dành cho hội viên VIP: hiển thị nổi bật trang chủ, chứng nhận sản phẩm và nhiều ưu đãi khác.",
  },
}

function formatVnd(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}tr`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toString()
}

export default async function LandingPage() {
  const [
    vipCount,
    productCount,
    companyCount,
    newsCount,
    featuredCompanies,
    featuredProducts,
    businessThresholds,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "VIP", isActive: true } }),
    prisma.product.count({ where: { certStatus: "APPROVED" } }),
    prisma.company.count({ where: { isPublished: true } }),
    prisma.news.count({ where: { isPublished: true } }),
    prisma.company.findMany({
      where: {
        isFeatured: true,
        isPublished: true,
        owner: { role: "VIP" },
      },
      orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        isVerified: true,
      },
    }),
    prisma.product.findMany({
      where: {
        isFeatured: true,
        isPublished: true,
        owner: { role: { in: ["VIP", "ADMIN"] } },
      },
      orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrls: true,
        priceRange: true,
        certStatus: true,
        owner: { select: { name: true } },
        company: { select: { name: true } },
      },
    }),
    getTierThresholds("BUSINESS"),
  ])

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
    member: {
      "@type": "QuantitativeValue",
      value: vipCount,
      unitText: "doanh nghiệp hội viên VIP",
    },
  }

  // Tier comparison data — quota từ Phase 2 + Phase 6 banner quota
  const tiers = [
    {
      name: "Khách",
      stars: "—",
      price: "Miễn phí",
      color: "border-brand-200 bg-white",
      features: {
        quota: "5 bài/tháng",
        homepage: false,
        certification: false,
        bannerQuota: "1 mẫu/tháng",
        prioritySupport: false,
        verifiedBadge: false,
      },
      cta: { label: "Đăng ký miễn phí", href: "/dang-ky" },
    },
    {
      name: "VIP ★",
      stars: "★",
      price: "Cơ bản",
      color: "border-brand-300 bg-brand-50",
      features: {
        quota: "15 bài/tháng",
        homepage: true,
        certification: true,
        bannerQuota: "5 mẫu/tháng",
        prioritySupport: false,
        verifiedBadge: true,
      },
      cta: { label: "Đăng ký VIP", href: "/dang-ky" },
    },
    {
      name: "VIP ★★ Bạc",
      stars: "★★",
      price: `Đóng góp ${formatVnd(businessThresholds.silver)}đ`,
      color: "border-amber-300 bg-amber-50 ring-2 ring-amber-200",
      popular: true,
      features: {
        quota: "30 bài/tháng",
        homepage: true,
        certification: true,
        bannerQuota: "10 mẫu/tháng",
        prioritySupport: true,
        verifiedBadge: true,
      },
      cta: { label: "Đăng ký VIP Bạc", href: "/dang-ky" },
    },
    {
      name: "VIP ★★★ Vàng",
      stars: "★★★",
      price: `Đóng góp ${formatVnd(businessThresholds.gold)}đ`,
      color: "border-yellow-400 bg-yellow-50",
      features: {
        quota: "Không giới hạn",
        homepage: true,
        certification: true,
        bannerQuota: "20 mẫu/tháng",
        prioritySupport: true,
        verifiedBadge: true,
      },
      cta: { label: "Đăng ký VIP Vàng", href: "/dang-ky" },
    },
  ] as const

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* ── Page Banner ─────────────────────────────────────────────────── */}
      <div className="bg-brand-800 py-14 px-4 text-center">
        <Image
          src="/logo.png"
          alt="Hội Trầm Hương Việt Nam"
          width={96}
          height={96}
          className="h-20 w-20 mx-auto mb-3"
          priority
        />
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">Quyền lợi Hội viên</h1>
        <p className="mt-2 text-brand-300 text-base">
          Đặc quyền độc quyền dành cho doanh nghiệp trầm hương Việt Nam
        </p>
      </div>

      {/* ── Hero intro + CTAs ───────────────────────────────────────────── */}
      <section className="bg-white border-b border-brand-100 py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl lg:text-4xl leading-tight">
            Đưa thương hiệu trầm hương của bạn{" "}
            <span className="text-brand-700">vươn tầm quốc gia</span>
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base sm:text-lg text-brand-600">
            Tham gia cộng đồng <strong className="text-brand-900">{vipCount}+ doanh nghiệp</strong>{" "}
            trầm hương uy tín nhất Việt Nam. Hiển thị trang chủ, chứng nhận sản phẩm,
            banner quảng cáo và mạng lưới đối tác toàn quốc.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dang-ky"
              className="inline-flex items-center justify-center rounded-lg bg-brand-700 px-8 py-5 text-base font-bold text-white shadow-sm transition-all hover:bg-brand-800 hover:shadow-md hover:-translate-y-0.5"
            >
              Đăng ký Hội viên VIP →
            </Link>
            <Link
              href="#tier-comparison"
              className="inline-flex items-center justify-center rounded-lg border-2 border-brand-300 px-8 py-5 text-base font-medium text-brand-700 transition-colors hover:bg-brand-50"
            >
              Xem các gói hội viên
            </Link>
          </div>

          <p className="mt-5 text-xs text-brand-500">
            Đăng ký miễn phí • Không cần thẻ tín dụng • Kích hoạt ngay
          </p>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-brand-100">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: vipCount, label: "Hội viên VIP", icon: "👥" },
              { value: companyCount, label: "Doanh nghiệp", icon: "🏢" },
              { value: productCount, label: "SP đã chứng nhận", icon: "✓" },
              { value: newsCount, label: "Tin tức ngành", icon: "📰" },
            ].map(({ value, label, icon }) => (
              <div key={label} className="text-center">
                <div className="text-3xl mb-1">{icon}</div>
                <p className="text-3xl font-bold text-brand-900 sm:text-4xl">
                  {value.toLocaleString("vi-VN")}+
                </p>
                <p className="mt-1 text-sm font-medium text-brand-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top 10 Doanh nghiệp tiêu biểu ────────────────────────────────── */}
      <section className="bg-brand-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <header className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider font-semibold text-brand-500 mb-2">
              Top 10
            </p>
            <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
              Doanh nghiệp tiêu biểu
            </h2>
            <p className="mt-2 text-brand-600 max-w-2xl mx-auto">
              Những thương hiệu trầm hương được Hội Trầm Hương Việt Nam tuyển chọn
            </p>
          </header>

          {featuredCompanies.length === 0 ? (
            <div className="rounded-2xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
              Top doanh nghiệp tiêu biểu sẽ được công bố sớm.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {featuredCompanies.map((company, idx) => (
                <Link
                  key={company.id}
                  href={`/doanh-nghiep/${company.slug}`}
                  className="group relative flex flex-col items-center rounded-2xl border-2 border-brand-200 bg-white p-5 text-center transition-all hover:border-brand-400 hover:shadow-lg hover:-translate-y-1"
                >
                  <span className="absolute -top-2 -left-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-xs shadow-md">
                    #{idx + 1}
                  </span>
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-brand-100 mb-3 bg-brand-50">
                    {company.logoUrl ? (
                      <Image
                        src={company.logoUrl}
                        alt={company.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-700 text-2xl font-bold text-brand-100">
                        {company.name[0]}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-brand-900 line-clamp-2 group-hover:text-brand-700">
                    {company.name}
                  </h3>
                  {company.isVerified && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                      ✓ Verified
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Top 20 Sản phẩm tiêu biểu ────────────────────────────────────── */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <header className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider font-semibold text-brand-500 mb-2">
              Top 20
            </p>
            <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
              Sản phẩm hot trend
            </h2>
            <p className="mt-2 text-brand-600 max-w-2xl mx-auto">
              Bộ sưu tập sản phẩm trầm hương được tuyển chọn từ các doanh nghiệp VIP
            </p>
          </header>

          {featuredProducts.length === 0 ? (
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-12 text-center text-brand-500 italic">
              Top sản phẩm hot trend sẽ được công bố sớm.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {featuredProducts.map((product, idx) => {
                const cover = product.imageUrls[0] ?? null
                return (
                  <Link
                    key={product.id}
                    href={`/san-pham/${product.slug}`}
                    className="group relative bg-white rounded-xl border border-brand-200 shadow-sm overflow-hidden hover:shadow-lg hover:border-brand-400 transition-all"
                  >
                    <div className="relative h-40 bg-brand-100 overflow-hidden">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-brand-700 text-3xl">🌿</div>
                      )}
                      <span className="absolute top-2 left-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-xs shadow-md">
                        #{idx + 1}
                      </span>
                      {product.certStatus === "APPROVED" && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-2 text-sm font-semibold text-brand-900 group-hover:text-brand-700">
                        {product.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-brand-500 line-clamp-1">
                        {product.company?.name ?? product.owner.name}
                      </p>
                      {product.priceRange && (
                        <p className="mt-1 text-xs font-bold text-brand-700">{product.priceRange}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/san-pham-doanh-nghiep"
              className="inline-flex items-center text-sm font-semibold text-brand-700 hover:text-brand-900 underline underline-offset-4"
            >
              Xem tất cả sản phẩm tiêu biểu →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tier Comparison ──────────────────────────────────────────────── */}
      <section id="tier-comparison" className="bg-linear-to-b from-brand-50 to-white py-16 lg:py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4">
          <header className="text-center mb-12">
            <p className="text-xs uppercase tracking-wider font-semibold text-brand-500 mb-2">
              Quyền lợi
            </p>
            <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
              Chọn gói hội viên phù hợp
            </h2>
            <p className="mt-3 text-brand-600 max-w-2xl mx-auto">
              Hội viên VIP được ưu tiên hiển thị trang chủ, hạn mức bài viết cao hơn
              và nhiều quyền lợi độc quyền.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border-2 p-6 shadow-sm ${tier.color}`}
              >
                {/*  popular badge — top-right corner, half above / half inside the card
                    Contrast: amber-500 bg + brand-900 text ≈ 9:1 (WCAG AAA)  */}
                {"popular" in tier && tier.popular && (
                  <span className="absolute top-0 right-4 -translate-y-1/2 whitespace-nowrap inline-flex items-center gap-1 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-brand-900 shadow-lg ring-2 ring-white z-10">
                    ⭐ Phổ biến nhất
                  </span>
                )}
                <div className="text-center mb-5">
                  <p className="text-2xl font-bold text-amber-600 mb-1 min-h-8">
                    {tier.stars}
                  </p>
                  <h3 className="text-lg font-bold text-brand-900">{tier.name}</h3>
                  <p className="mt-1 text-sm text-brand-600">{tier.price}</p>
                </div>

                <ul className="flex-1 space-y-3 text-sm border-t border-brand-200 pt-5">
                  <FeatureRow label="Hạn mức bài viết">
                    <span className="font-semibold text-brand-900">{tier.features.quota}</span>
                  </FeatureRow>
                  <FeatureRow label="Hiển thị trang chủ">
                    <FeatureCheck on={tier.features.homepage} />
                  </FeatureRow>
                  <FeatureRow label="Chứng nhận sản phẩm">
                    <FeatureCheck on={tier.features.certification} />
                  </FeatureRow>
                  <FeatureRow label="Badge xác minh">
                    <FeatureCheck on={tier.features.verifiedBadge} />
                  </FeatureRow>
                  <FeatureRow label="Banner quảng cáo">
                    <span className="text-xs font-semibold text-brand-900">
                      {tier.features.bannerQuota}
                    </span>
                  </FeatureRow>
                  <FeatureRow label="Hỗ trợ ưu tiên">
                    <FeatureCheck on={tier.features.prioritySupport} />
                  </FeatureRow>
                </ul>

                <Link
                  href={tier.cta.href}
                  className="mt-6 inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors bg-brand-700 text-white hover:bg-brand-800"
                >
                  {tier.cta.label}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-brand-500">
            * Hạng tự động nâng cấp khi tổng đóng góp đạt ngưỡng tương ứng. Liên hệ Ban quản trị để biết chi tiết.
          </p>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-900 text-white py-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, white 2px, transparent 2px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Sẵn sàng đưa thương hiệu của bạn lên tầm cao mới?
          </h2>
          <p className="mt-4 text-brand-200 text-lg">
            Đăng ký miễn phí ngay hôm nay. Không cần thẻ tín dụng.
            Bạn có thể nâng cấp lên VIP bất cứ lúc nào.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/dang-ky"
              className="inline-flex items-center justify-center rounded-lg bg-brand-400 px-8 py-4 text-base font-bold text-brand-900 shadow-lg transition-all hover:bg-brand-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              Đăng ký ngay →
            </Link>
            <Link
              href="/lien-he"
              className="inline-flex items-center justify-center rounded-lg border-2 border-brand-300 px-8 py-4 text-base font-medium text-brand-300 transition-colors hover:bg-brand-300/10"
            >
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function FeatureRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-brand-600 text-xs">{label}</span>
      {children}
    </li>
  )
}

function FeatureCheck({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs">
      ✓
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-300 text-xs">
      —
    </span>
  )
}
