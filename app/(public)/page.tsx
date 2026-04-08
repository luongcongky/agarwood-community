import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hội Trầm Hương Việt Nam — Cộng đồng Doanh nghiệp Trầm Hương",
  description: "Nền tảng kết nối doanh nghiệp trầm hương Việt Nam. Chứng nhận sản phẩm, chia sẻ kinh nghiệm, dịch vụ truyền thông chuyên ngành.",
  alternates: { canonical: "/" },
  openGraph: { title: "Hội Trầm Hương Việt Nam", description: "Cộng đồng kết nối doanh nghiệp trầm hương uy tín trên toàn quốc.", type: "website" },
}

export const revalidate = 3600

async function getHomePageData() {
  const [memberCount, certifiedProducts, companies, newsCount, latestNews, featuredMembers] =
    await Promise.all([
      prisma.user.count({ where: { role: "VIP", isActive: true } }),
      prisma.product.count({ where: { certStatus: "APPROVED" } }),
      prisma.company.count({ where: { isPublished: true } }),
      prisma.news.count({ where: { isPublished: true } }),
      prisma.news.findMany({
        where: { isPublished: true },
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          publishedAt: true,
        },
      }),
      prisma.company.findMany({
        where: { isPublished: true, isVerified: true },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      }),
    ])

  return {
    statsData: { memberCount, certifiedProducts, companies, newsCount },
    latestNews,
    featuredMembers,
  }
}

function getInitials(name?: string | null) {
  if (!name || name.trim() === "") return "🌿"
  const words = name.trim().split(/\s+/)
  const initials = words
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return initials || "🌿"
}

export default async function HomePage() {
  const { statsData, latestNews, featuredMembers } = await getHomePageData()

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hội Trầm Hương Việt Nam",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoitramhuong.vn",
    description: "Cộng đồng kết nối, chứng nhận và truyền thông sản phẩm trầm hương Việt Nam.",
    foundingDate: "2007",
    address: { "@type": "PostalAddress", addressCountry: "VN" },
    sameAs: [],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      {/* ── Hero ── */}
      <section className="relative bg-brand-800 text-white overflow-hidden">
        {/* Decorative background pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 80%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:py-32">
          <div className="mb-6 text-5xl">🌿</div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Kết nối Cộng đồng Trầm Hương Việt Nam
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-brand-200 sm:text-xl">
            Hội Trầm Hương Việt Nam — tổ chức đại diện, kết nối và phát triển
            cộng đồng doanh nghiệp trầm hương trên toàn quốc. Cùng nhau xây
            dựng ngành trầm hương Việt Nam vươn tầm thế giới.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/gioi-thieu"
              className={cn(
                "inline-flex items-center justify-center rounded-md border-2 border-brand-300",
                "px-6 py-3 text-base font-medium text-brand-300 transition-colors",
                "hover:bg-brand-300 hover:text-brand-900"
              )}
            >
              Tìm hiểu thêm
            </Link>
            <Link
              href="/dang-ky"
              className={cn(
                "inline-flex items-center justify-center rounded-md",
                "bg-brand-400 px-6 py-3 text-base font-medium text-brand-900",
                "transition-colors hover:bg-brand-300"
              )}
            >
              Đăng ký hội viên
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { value: statsData.memberCount, label: "Hội viên", href: "/hoi-vien" },
              {
                value: statsData.certifiedProducts,
                label: "Sản phẩm được chứng nhận",
                href: "/san-pham-chung-nhan",
              },
              { value: statsData.companies, label: "Doanh nghiệp", href: "/hoi-vien" },
              {
                value: statsData.newsCount,
                label: "Tin tức & Thông báo",
                href: "/tin-tuc",
              },
            ].map(({ value, label, href }) => (
              <Link
                key={label}
                href={href}
                className="rounded-xl border border-brand-200 bg-brand-50 px-6 py-8 text-center shadow-sm hover:shadow-md hover:border-brand-300 transition-all block"
              >
                <p className="text-4xl font-bold text-brand-700">
                  {value.toLocaleString("vi-VN")}
                </p>
                <p className="mt-2 text-sm font-medium text-brand-600">
                  {label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Intro ── */}
      <section className="bg-brand-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-start">
            {/* Left: text */}
            <div>
              <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">
                Về Hội Trầm Hương Việt Nam
              </h2>
              <p className="mt-4 text-brand-700 leading-relaxed">
                Được thành lập năm 2010, Hội Trầm Hương Việt Nam là tổ chức xã
                hội nghề nghiệp hoạt động theo nguyên tắc tự nguyện, tự quản và
                tự chịu trách nhiệm. Hội quy tụ các doanh nghiệp, cơ sở sản
                xuất, nhà nghiên cứu và người yêu thích trầm hương trên toàn
                quốc.
              </p>
              <p className="mt-4 text-brand-700 leading-relaxed">
                Chúng tôi đặt sứ mệnh kết nối cộng đồng, nâng cao nhận thức về
                giá trị của trầm hương Việt Nam, đồng thời xây dựng các tiêu
                chuẩn chất lượng, chứng nhận sản phẩm minh bạch và uy tín.
              </p>
              <p className="mt-4 text-brand-700 leading-relaxed">
                Với tầm nhìn đến năm 2030, Hội Trầm Hương Việt Nam hướng tới
                trở thành tổ chức trầm hương uy tín nhất Đông Nam Á, đưa sản
                phẩm trầm hương Việt Nam ra thị trường quốc tế.
              </p>
            </div>

            {/* Right: benefits */}
            <div className="rounded-xl border border-brand-200 bg-white p-8 shadow-sm">
              <h3 className="mb-5 text-lg font-semibold text-brand-800">
                Lợi ích khi tham gia
              </h3>
              <ul className="space-y-3">
                {[
                  "Nhận badge chứng nhận sản phẩm chính thức",
                  "Hiển thị nổi bật trong danh sách hội viên",
                  "Tham gia diễn đàn nội bộ và trao đổi kinh nghiệm",
                  "Được ưu đãi về dịch vụ truyền thông ngành",
                  "Kết nối với mạng lưới doanh nghiệp toàn quốc",
                  "Cập nhật tin tức và chính sách ngành sớm nhất",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-brand-500 font-bold">
                      ✓
                    </span>
                    <span className="text-brand-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/gioi-thieu"
                  className={cn(
                    "inline-flex items-center text-sm font-medium text-brand-600",
                    "hover:text-brand-800 underline underline-offset-4"
                  )}
                >
                  Tìm hiểu thêm về quyền lợi hội viên →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest News ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              Tin tức mới nhất
            </h2>
            <Link
              href="/tin-tuc"
              className="hidden text-sm font-medium text-brand-600 hover:text-brand-800 underline underline-offset-4 sm:block"
            >
              Xem tất cả →
            </Link>
          </div>

          {latestNews.length === 0 ? (
            <p className="text-center text-brand-600 py-12">
              Chưa có tin tức nào được đăng.
            </p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {latestNews.map((news) => (
                <article
                  key={news.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-brand-200 bg-brand-50 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Cover image */}
                  <div className="relative h-48 w-full overflow-hidden">
                    {news.coverImageUrl ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={news.coverImageUrl}
                          alt={news.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-700">
                        <span className="text-4xl">🌿</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 font-semibold text-brand-900 group-hover:text-brand-700">
                      {news.title}
                    </h3>
                    {news.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm text-brand-600">
                        {news.excerpt}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <time className="text-sm text-brand-500">
                        {news.publishedAt
                          ? new Date(news.publishedAt).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )
                          : ""}
                      </time>
                      <Link
                        href={`/tin-tuc/${news.slug}`}
                        className="text-sm font-medium text-brand-600 hover:text-brand-800 underline underline-offset-2"
                      >
                        Đọc thêm →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link
              href="/tin-tuc"
              className={cn(
                "inline-flex items-center justify-center rounded-md border border-brand-600",
                "px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
              )}
            >
              Xem tất cả tin tức
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Members ── */}
      <section className="bg-brand-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-900 sm:text-3xl">
            Hội viên tiêu biểu
          </h2>

          {featuredMembers.length === 0 ? (
            <p className="text-center text-brand-600 py-12">
              Chưa có hội viên tiêu biểu.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredMembers.map((company) => (
                <Link
                  key={company.id}
                  href="/hoi-vien"
                  className="group flex flex-col items-center rounded-xl border border-brand-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Logo or initials */}
                  <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full border border-brand-200">
                    {company.logoUrl ? (
                      <Image
                        src={company.logoUrl}
                        alt={company.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-400">
                        <span className="text-xl font-bold text-brand-900">
                          {getInitials(company.name)}
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="line-clamp-2 text-sm font-semibold text-brand-900 group-hover:text-brand-700">
                    {company.name}
                  </h3>

                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-sm font-medium text-green-700">
                    ✓ Đã xác minh
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/hoi-vien"
              className={cn(
                "inline-flex items-center justify-center rounded-md border border-brand-600",
                "px-6 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
              )}
            >
              Xem tất cả hội viên
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-brand-700 py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Tham gia Hội Trầm Hương Việt Nam
          </h2>
          <p className="mt-4 text-brand-200">
            Cùng hàng trăm doanh nghiệp và cơ sở sản xuất trầm hương trên toàn
            quốc. Đăng ký hội viên để được hưởng đầy đủ quyền lợi và cùng nhau
            phát triển ngành trầm hương Việt Nam.
          </p>
          <div className="mt-8">
            <Link
              href="/dang-ky"
              className={cn(
                "inline-flex items-center justify-center rounded-md",
                "bg-brand-400 px-8 py-3 text-base font-semibold text-brand-900",
                "transition-colors hover:bg-brand-300"
              )}
            >
              Đăng ký hội viên
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
