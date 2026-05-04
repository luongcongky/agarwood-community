import Link from "next/link"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { OfficialChannelsBlock } from "@/components/features/layout/OfficialChannelsBlock"
import { LeadershipTabs, type LeaderItem } from "./LeadershipTabs"
import { MembersGrid, type MemberItem } from "./MembersGrid"
import { getStaticTexts } from "@/lib/static-texts"

export const revalidate = 600

/** Leaders + VIP/INFINITE members đều thay đổi chậm (admin CRUD),
 *  cache 10 phút để chia sẻ across visitor requests. */
const getLeadersAndMembers = unstable_cache(
  () =>
    Promise.all([
      prisma.leader.findMany({
        where: { isActive: true },
        orderBy: [{ term: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          name: true, name_en: true, name_zh: true, name_ar: true,
          honorific: true, honorific_en: true, honorific_zh: true, honorific_ar: true,
          title: true, title_en: true, title_zh: true, title_ar: true,
          workTitle: true, workTitle_en: true, workTitle_zh: true, workTitle_ar: true,
          bio: true, bio_en: true, bio_zh: true, bio_ar: true,
          photoUrl: true,
          term: true,
          category: true,
          user: { select: { avatarUrl: true, bio: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: { in: ["VIP", "INFINITE"] }, isActive: true },
        orderBy: [
          { contributionTotal: "desc" },
          { displayPriority: "desc" },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          company: {
            select: { name: true, logoUrl: true, representativePosition: true },
          },
        },
      }),
    ]),
  ["gioi-thieu_leaders_members"],
  { revalidate: 600, tags: ["gioi-thieu", "leaders", "members"] },
)

export async function generateMetadata() {
  const t = await getTranslations("about")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
  }
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
      contactType: "Chairman",
      email: "hoitramhuongvietnam2010@gmail.com",
    },
    {
      "@type": "ContactPoint",
      telephone: "+84-938-334-647",
      contactType: "Vice Chairman",
    },
  ],
  sameAs: ["https://www.facebook.com/hoitramhuongvietnam.org"],
}

export default async function GioiThieuPage() {
  const [t, locale] = await Promise.all([
    getStaticTexts("about", (await getLocale()) as Locale),
    getLocale() as Promise<Locale>,
  ])

  // Fetch leaders + TẤT CẢ hội viên VIP/INFINITE active — qua cache 10 phút.
  const [rawLeaders, rawMembers] = await getLeadersAndMembers()
  const totalMemberCount = rawMembers.length

  const currentTerm = rawLeaders[0]?.term ?? null
  const l = <T extends Record<string, unknown>>(record: T, field: string) =>
    localize(record, field, locale) as string | null
  const currentLeaders: LeaderItem[] = rawLeaders
    .filter((leader) => leader.term === currentTerm)
    .map((leader) => ({
      id: leader.id,
      name: l(leader, "name") ?? leader.name,
      honorific: l(leader, "honorific"),
      title: l(leader, "title") ?? leader.title,
      titleVi: leader.title,
      workTitle: l(leader, "workTitle"),
      bio: l(leader, "bio") ?? leader.user?.bio ?? null,
      photoUrl: leader.photoUrl ?? leader.user?.avatarUrl ?? null,
      term: leader.term,
      category: leader.category as "BTV" | "BCH" | "BKT" | "HDTD",
    }))

  const members: MemberItem[] = rawMembers.map((m) => ({
    id: m.id,
    name: m.name,
    avatarUrl: m.avatarUrl ?? m.company?.logoUrl ?? null,
    companyName: m.company?.name ?? null,
    position: m.company?.representativePosition ?? null,
  }))

  const orgDepts = [
    t("inspectionBoard"),
    t("departments"),
    t("affiliates"),
  ]

  return (
    <div>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* ── Page content wrapper ── */}
      <div className="mx-auto max-w-7xl px-4 py-8">
      <div>

      {/* ── Intro — mở rộng max-w-5xl cho cân với các section grid khác
           (leadership/members ở max-w-7xl). Text column vẫn giữ leading dễ
           đọc, không stretch tới viewport. ──────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("introTitle")}
          </h2>
          <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-8 sm:p-10 lg:p-12">
            <p className="text-brand-800 leading-relaxed text-[15px] sm:text-base whitespace-pre-line">
              {t("introContent")}
            </p>
          </div>
        </div>
      </section>

      {/* ── Leadership — tabs cho BTV / BCH / BKT / HDTD ── */}
      <section className="bg-brand-50/50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("leadershipTitle")}
          </h2>

          <LeadershipTabs leaders={currentLeaders} />
        </div>
      </section>

      {/* ── Organization Chart ── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-2 text-center text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("orgChartTitle")}
          </h2>
          <p className="mb-10 text-center text-sm text-brand-500">
            {t("orgChartSubtitle")}
          </p>
          <div className="flex flex-col items-center gap-0">
            <div className="rounded-lg border-2 border-brand-600 bg-brand-700 px-8 py-3 text-center text-white font-semibold shadow">
              {t("congress")}
            </div>
            <div className="h-8 w-px bg-brand-400" />

            <div className="rounded-lg border-2 border-brand-500 bg-brand-600 px-8 py-3 text-center text-white font-semibold shadow">
              {t("executiveBoard")}
            </div>
            <div className="h-8 w-px bg-brand-400" />

            <div className="rounded-lg border-2 border-brand-400 bg-brand-500 px-8 py-3 text-center text-white font-semibold shadow">
              {t("standingBoard")}
            </div>
            <div className="h-8 w-px bg-brand-400" />

            <div className="relative w-full max-w-3xl mx-auto">
              <div
                className="absolute top-0 h-0.5 bg-brand-400"
                style={{ left: "calc(100% / 6)", right: "calc(100% / 6)" }}
              />

              <div className="grid grid-cols-3 gap-2">
                {orgDepts.map((dept) => (
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

      {/* ── Members list — dưới cơ cấu tổ chức, layout giống Ban Thường vụ ── */}
      <section className="bg-brand-50/50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-center text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("membersTitle")}
          </h2>
          <p className="mt-2 mb-10 text-center text-sm text-brand-500">
            {totalMemberCount > 0
              ? t("membersSubtitle", { count: totalMemberCount })
              : t("membersEmpty")}
          </p>

          <MembersGrid members={members} />
        </div>
      </section>

      {/* ── Map & Address ── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("addressTitle")}
          </h2>
          <div className="overflow-hidden rounded-xl border border-brand-200 shadow-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125411.87690118406!2d106.62966155!3d10.7544272!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4670702e31%3A0xa25c43e2beaadca4!2zVFAuIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1svi!2svn!4v1700000000000"
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              allow=""
              title={t("mapTitle")}
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
              📞 0913 810 060 · 0938 334 647
            </p>
            <p className="mt-1 text-brand-700">
              📧 hoitramhuongvietnam2010@gmail.com
            </p>
            <p className="mt-1 text-brand-700">
              🌐 hoitramhuong.vn
            </p>
          </div>
        </div>
      </section>

      {/* ── Kênh truyền thông chính thức + cảnh báo giả mạo ── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <OfficialChannelsBlock variant="compact" />
        </div>
      </section>

      </div>
      </div>

      {/* ── CTA — flat, border-t thay cho full-width dark banner cũ ── */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-10">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="text-xl font-bold text-neutral-900">{t("ctaTitle")}</h2>
          <p className="mt-2 text-sm text-neutral-600">
            {t("ctaDesc")}
          </p>
          <div className="mt-5">
            <Link
              href="/dang-ky"
              className="inline-flex items-center gap-2 border border-brand-700 bg-brand-700 px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-800"
            >
              {t("ctaButton")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
