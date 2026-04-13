import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { OfficialChannelsBlock } from "@/components/features/layout/OfficialChannelsBlock"

export const revalidate = 600

export const metadata = {
  title: "Giới thiệu — Hội Trầm Hương Việt Nam",
  description:
    "Tìm hiểu về lịch sử, sứ mệnh, tầm nhìn và ban lãnh đạo của Hội Trầm Hương Việt Nam.",
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hội Trầm Hương Việt Nam",
  alternateName: "VAWA — Vietnam Agarwood Association",
  url: "https://hoitramhuong.vn",
  logo: "https://hoitramhuong.vn/logo.png",
  foundingDate: "2010-01-11",
  description:
    "Tổ chức xã hội nghề nghiệp kết nối, phát triển cộng đồng doanh nghiệp trầm hương Việt Nam.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Số 150, Đường Lý Chính Thắng, Phường Xuân Hòa",
    addressLocality: "Thành phố Hồ Chí Minh",
    postalCode: "700000",
    addressCountry: "VN",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+84-913-810-060",
      contactType: "Chủ tịch Hội",
      email: "hoitramhuongvietnam2010@gmail.com",
    },
    {
      "@type": "ContactPoint",
      telephone: "+84-938-334-647",
      contactType: "Phó Chủ tịch Hội",
    },
  ],
  sameAs: ["https://www.facebook.com/hoitramhuongvietnam.org"],
}

function InitialsAvatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-brand-700 text-white font-bold",
        className
      )}
    >
      {initials}
    </div>
  )
}

export default async function GioiThieuPage() {
  // Only show Ban Thường vụ on this page — full list at /ban-lanh-dao
  const btvLeaders = await prisma.leader.findMany({
    where: { isActive: true, category: "BTV" },
    orderBy: [{ term: "desc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      title: true,
      workTitle: true,
      photoUrl: true,
      term: true,
    },
  })

  // Show the most recent term's BTV
  const currentTerm = btvLeaders[0]?.term ?? null
  const currentBtv = btvLeaders.filter((l) => l.term === currentTerm)

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* ── Hero ── */}
      <section className="bg-brand-800 text-white py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Về Hội Trầm Hương Việt Nam
          </h1>
          <p className="mt-3 text-brand-200 max-w-2xl">
            Tổ chức xã hội nghề nghiệp đại diện cho cộng đồng doanh nghiệp,
            cơ sở sản xuất và người yêu thích trầm hương trên toàn quốc.
          </p>
        </div>
      </section>

      {/* ── History / Mission / Vision ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Lịch sử */}
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-8">
              <div className="mb-4 text-3xl">📜</div>
              <h2 className="text-lg font-bold text-brand-900">
                Lịch sử hình thành
              </h2>
              <p className="mt-3 text-sm text-brand-700 leading-relaxed">
                Hội Trầm Hương Việt Nam (tên viết tắt: <strong>VAWA</strong>{" "}
                — Vietnam Agarwood Association) được thành lập ngày{" "}
                <strong>11/01/2010</strong> theo Quyết định số{" "}
                <strong>23/QĐ-BNV</strong> của Bộ Nội vụ. Điều lệ Hội được Bộ
                Nội vụ phê duyệt theo Quyết định số{" "}
                <strong>688/QĐ-BNV ngày 23/06/2010</strong>, và sửa đổi, bổ
                sung theo Quyết định số{" "}
                <strong>1086/QĐ-BNV ngày 29/12/2023</strong>. Hội hiện hoạt
                động theo nhiệm kỳ III (2023–2028), không ngừng mở rộng mạng
                lưới hội viên, xây dựng tiêu chuẩn ngành và đưa trầm hương Việt
                Nam vươn ra thị trường quốc tế.
              </p>
            </div>

            {/* Sứ mệnh */}
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-8">
              <div className="mb-4 text-3xl">🎯</div>
              <h2 className="text-lg font-bold text-brand-900">Sứ mệnh</h2>
              <p className="mt-3 text-sm text-brand-700 leading-relaxed">
                Kết nối doanh nghiệp trầm hương toàn quốc, chuẩn hóa chất lượng
                sản phẩm và xây dựng hệ thống chứng nhận minh bạch. Chúng tôi
                đồng hành cùng hội viên trong việc phát triển thương hiệu, mở
                rộng thị trường và nâng cao giá trị của trầm hương Việt Nam trên
                trường quốc tế.
              </p>
            </div>

            {/* Tầm nhìn */}
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-8">
              <div className="mb-4 text-3xl">🌏</div>
              <h2 className="text-lg font-bold text-brand-900">Tầm nhìn</h2>
              <p className="mt-3 text-sm text-brand-700 leading-relaxed">
                Trở thành tổ chức trầm hương uy tín nhất Đông Nam Á vào năm
                2030. Hội Trầm Hương Việt Nam hướng tới xây dựng một hệ sinh
                thái ngành trầm hương bền vững, nơi mà mọi doanh nghiệp đều có
                cơ hội phát triển và đóng góp vào sự thịnh vượng chung của
                ngành.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Leadership (Ban Thường vụ only) ── */}
      <section className="bg-brand-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-2 text-center text-2xl font-bold text-brand-900 sm:text-3xl">
            Ban Thường vụ
          </h2>
          {currentTerm && (
            <p className="mb-10 text-center text-sm text-brand-500">
              {currentTerm}
            </p>
          )}

          {currentBtv.length === 0 ? (
            <div className="rounded-xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
              Thông tin ban lãnh đạo sẽ được cập nhật sớm.
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {currentBtv.map((leader) => (
                <div
                  key={leader.id}
                  className="flex flex-col items-center rounded-xl border border-brand-200 bg-white p-8 text-center shadow-sm"
                >
                  {leader.photoUrl ? (
                    <div className="relative h-20 w-20 rounded-full overflow-hidden mb-4">
                      <Image
                        src={leader.photoUrl}
                        alt={leader.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <InitialsAvatar
                      name={leader.name}
                      className="h-20 w-20 text-xl mb-4"
                    />
                  )}
                  <h3 className="font-bold text-brand-900">{leader.name}</h3>
                  <p className="mt-1 text-sm font-medium text-amber-700">
                    {leader.title}
                  </p>
                  {leader.workTitle && (
                    <p className="mt-2 text-xs text-brand-500 leading-relaxed">
                      {leader.workTitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/ban-lanh-dao"
              className="inline-flex items-center text-sm font-semibold text-brand-700 hover:text-brand-900 underline underline-offset-4"
            >
              Xem toàn bộ Ban Chấp hành, Ban Kiểm tra →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Membership Benefits ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-900 sm:text-3xl">
            Quyền lợi hội viên
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🏅",
                title: "Badge chứng nhận sản phẩm",
                desc: "Nhận badge chứng nhận chính thức từ Hội, khẳng định chất lượng sản phẩm trên thị trường.",
              },
              {
                icon: "📋",
                title: "Hiển thị trên danh sách hội viên",
                desc: "Doanh nghiệp của bạn được niêm yết nổi bật trong danh sách hội viên công khai trên website.",
              },
              {
                icon: "💬",
                title: "Tham gia diễn đàn nội bộ",
                desc: "Tiếp cận diễn đàn nội bộ dành riêng cho hội viên, nơi trao đổi kinh nghiệm và thông tin ngành.",
              },
              {
                icon: "📣",
                title: "Ưu đãi dịch vụ truyền thông",
                desc: "Được hưởng mức chiết khấu đặc biệt khi sử dụng các gói dịch vụ truyền thông của Hội.",
              },
              {
                icon: "🤝",
                title: "Kết nối mạng lưới doanh nghiệp",
                desc: "Mở rộng quan hệ kinh doanh với hàng trăm doanh nghiệp trầm hương trên toàn quốc.",
              },
              {
                icon: "📰",
                title: "Cập nhật tin tức ngành",
                desc: "Nhận bản tin nội bộ và được cập nhật các chính sách, xu hướng mới nhất của ngành trầm hương.",
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="flex gap-4 rounded-xl border border-brand-200 bg-brand-50 p-6"
              >
                <span className="shrink-0 text-2xl">{benefit.icon}</span>
                <div>
                  <h3 className="font-semibold text-brand-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-sm text-brand-700 leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Organization Chart ── */}
      <section className="bg-brand-50 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-2 text-center text-2xl font-bold text-brand-900 sm:text-3xl">
            Cơ cấu tổ chức
          </h2>
          <p className="mb-10 text-center text-sm text-brand-500">
            Theo Điều 12 Điều lệ Hội (sửa đổi, bổ sung) 2023
          </p>
          <div className="flex flex-col items-center gap-0">
            {/* Top: Đại hội */}
            <div className="rounded-lg border-2 border-brand-600 bg-brand-700 px-8 py-3 text-center text-white font-semibold shadow">
              Đại hội
            </div>
            <div className="h-8 w-px bg-brand-400" />

            {/* Ban chấp hành */}
            <div className="rounded-lg border-2 border-brand-500 bg-brand-600 px-8 py-3 text-center text-white font-semibold shadow">
              Ban Chấp hành
            </div>
            <div className="h-8 w-px bg-brand-400" />

            {/* Ban Thường vụ */}
            <div className="rounded-lg border-2 border-brand-400 bg-brand-500 px-8 py-3 text-center text-white font-semibold shadow">
              Ban Thường vụ
            </div>
            <div className="h-8 w-px bg-brand-400" />

            {/* 3 units: Ban Kiểm tra / Văn phòng & ban chuyên môn / Tổ chức trực thuộc */}
            <div className="relative w-full max-w-3xl mx-auto">
              {/* Horizontal connector line */}
              <div
                className="absolute top-0 h-0.5 bg-brand-400"
                style={{ left: "calc(100% / 6)", right: "calc(100% / 6)" }}
              />

              <div className="grid grid-cols-3 gap-2">
                {[
                  "Ban Kiểm tra",
                  "Văn phòng & các ban chuyên môn",
                  "Tổ chức trực thuộc",
                ].map((dept) => (
                  <div key={dept} className="flex flex-col items-center">
                    <div className="h-8 w-px bg-brand-400" />
                    <div className="rounded-lg border border-brand-300 bg-white px-2 sm:px-4 py-2 sm:py-2.5 text-center text-xs sm:text-sm font-medium text-brand-800 shadow-sm min-h-12 flex items-center justify-center">
                      {dept}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Map & Address ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-brand-900 sm:text-3xl">
            Địa chỉ trụ sở
          </h2>
          <div className="overflow-hidden rounded-xl border border-brand-200 shadow-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125411.87690118406!2d106.62966155!3d10.7544272!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4670702e31%3A0xa25c43e2beaadca4!2zVFAuIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1svi!2svn!4v1700000000000"
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              allow=""
              title="Bản đồ Hội Trầm Hương Việt Nam"
            />
          </div>
          <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-6">
            <p className="font-semibold text-brand-900">
              Hội Trầm Hương Việt Nam (VAWA)
            </p>
            <p className="mt-1 text-brand-700">
              📍 Số 150, Đường Lý Chính Thắng, Phường Xuân Hòa, TP. Hồ Chí Minh
            </p>
            <p className="mt-1 text-brand-700">
              📞 0913 810 060 (Chủ tịch) · 0938 334 647 (Phó Chủ tịch)
            </p>
            <p className="mt-1 text-brand-700">
              📧 hoitramhuongvietnam2010@gmail.com
            </p>
            <p className="mt-1 text-brand-700">
              🌐 hoitramhuong.vn
            </p>
            <p className="mt-1 text-brand-700">
              🕐 Thứ 2 - Thứ 6: 8:00 - 17:00
            </p>
          </div>
        </div>
      </section>

      {/* ── Kênh truyền thông chính thức + cảnh báo giả mạo ── */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <OfficialChannelsBlock variant="compact" />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-brand-800 py-16 text-white text-center">
        <div className="mx-auto max-w-xl px-4">
          <h2 className="text-2xl font-bold">Sẵn sàng tham gia?</h2>
          <p className="mt-3 text-brand-200">
            Đăng ký hội viên ngay hôm nay và cùng phát triển ngành trầm hương
            Việt Nam.
          </p>
          <div className="mt-6">
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
