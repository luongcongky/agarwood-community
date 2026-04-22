import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { calcTier } from "@/lib/tier"
import { getTierThresholds } from "@/lib/tier"
import { MemberCardFlip } from "@/components/features/member-card/MemberCardFlip"
import { MemberCardFront } from "@/components/features/member-card/MemberCardFront"
import { MemberCardBack } from "@/components/features/member-card/MemberCardBack"
import { generateMemberCardId, tierFromRole } from "@/lib/memberCard"
import { getMemberQrDataUrl } from "@/lib/memberQrCache"
export async function generateMetadata() {
  const t = await getTranslations("members")
  return { title: t("metaTitle"), alternates: { canonical: "/hoi-vien" } }
}

export const revalidate = 600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoitramhuong.vn"

export default async function VipMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const q = params.q ?? ""
  const [t, tPrintCard] = await Promise.all([
    getTranslations("members"),
    getTranslations("printCard"),
  ])
  const cardFrontLabels = {
    cardId: tPrintCard("cardIdLabel"),
    validity: tPrintCard("validityLabel"),
  }
  const cardBackLabels = {
    verifyMember: tPrintCard("verifyMemberLabel"),
    qrAlt: tPrintCard("qrAlt"),
    established: tPrintCard("establishedText"),
  }

  const [members, businessThresholds, individualThresholds, configs] =
    await Promise.all([
      prisma.user.findMany({
        where: {
          role: { in: ["VIP", "INFINITE"] },
          isActive: true,
          ...(q && {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              {
                company: {
                  name: { contains: q, mode: "insensitive" as const },
                },
              },
            ],
          }),
        },
        orderBy: [
          { contributionTotal: "desc" },
          { displayPriority: "desc" },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          phone: true,
          role: true,
          accountType: true,
          contributionTotal: true,
          memberCategory: true,
          membershipExpires: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              slug: true,
              logoUrl: true,
              address: true,
              isVerified: true,
              representativePosition: true,
            },
          },
        },
      }),
      getTierThresholds("BUSINESS"),
      getTierThresholds("INDIVIDUAL"),
      prisma.siteConfig.findMany({
        where: {
          key: {
            in: ["association_email", "association_phone", "association_website"],
          },
        },
      }),
    ])

  const cfg = Object.fromEntries(configs.map((c) => [c.key, c.value]))

  // QR cache: mỗi QR deterministic theo memberId, unstable_cache giữ 24h →
  // chỉ tốn CPU một lần, các lần sau (kể cả page ISR revalidation) dùng lại.
  const cardsData = await Promise.all(
    members.map(async (member) => {
      const thresholds =
        member.accountType === "INDIVIDUAL" ? individualThresholds : businessThresholds
      const tierInfo = calcTier(
        member.contributionTotal,
        thresholds.silver,
        thresholds.gold,
      )
      const memberCardId = generateMemberCardId(member.id, member.createdAt)
      const verifyUrl = `${SITE_URL}/hoi-vien/${member.id}`
      const qrDataUrl = await getMemberQrDataUrl(member.id, SITE_URL)
      return { member, tierInfo, memberCardId, verifyUrl, qrDataUrl }
    }),
  )

  return (
    <div className="min-h-screen bg-brand-50/60">
      {/* Page Banner */}
      <section className="bg-brand-800 py-16 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-brand-300 text-lg">
          {t("pageSubtitle", { count: members.length })}
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-4 sm:p-6 lg:p-8">
        {/* Search */}
        <form
          method="GET"
          action="/hoi-vien"
          className="mb-8 flex gap-2 max-w-lg mx-auto"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-700 text-brand-100 px-5 py-2.5 text-sm font-medium hover:bg-brand-800 transition-colors"
          >
            {t("searchBtn")}
          </button>
        </form>

        {/* Members Grid */}
        {members.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground font-medium">
              {t("emptyTitle")} nào
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {q
                ? `Không có kết quả cho "${q}". Thử từ khóa khác nhé.`
                : "Chưa có hội viên nào."}
            </p>
            {q && (
              <Link
                href="/hoi-vien"
                className="mt-4 inline-block text-brand-700 underline text-sm"
              >
                Xem tất cả hội viên
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-center text-xs text-brand-500 mb-4 italic">
              {t("flipHint")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cardsData.map(({ member, tierInfo, memberCardId, verifyUrl, qrDataUrl }) => {
                const tier = tierFromRole(member.role, tierInfo.stars)
                return (
                  <div key={member.id} className="space-y-2">
                    <MemberCardFlip
                      front={
                        <MemberCardFront
                          data={{
                            name: member.name,
                            avatarUrl: member.avatarUrl ?? member.company?.logoUrl ?? null,
                            title: member.company?.representativePosition ?? null,
                            companyName: member.company?.name ?? null,
                            memberCategory: member.memberCategory,
                            memberCardId,
                            validFrom: member.createdAt,
                            validTo: member.membershipExpires,
                            tier,
                          }}
                          labels={cardFrontLabels}
                        />
                      }
                      back={
                        <MemberCardBack
                          tier={tier}
                          memberCardId={memberCardId}
                          qrDataUrl={qrDataUrl}
                          verifyUrl={verifyUrl}
                          associationEmail={cfg.association_email ?? ""}
                          associationPhone={cfg.association_phone ?? ""}
                          associationWebsite={cfg.association_website ?? SITE_URL}
                          labels={cardBackLabels}
                        />
                      }
                    />

                    {/* Actions dưới card */}
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        href={`/hoi-vien/${member.id}`}
                        className="text-brand-600 font-medium hover:text-brand-900 hover:underline"
                        title="Xem tiểu sử hội viên"
                      >
                        {member.name}
                      </Link>
                      <div className="flex gap-3">
                        {member.company?.slug && (
                          <Link
                            href={`/doanh-nghiep/${member.company.slug}`}
                            className="text-brand-600 hover:text-brand-900 hover:underline"
                          >
                            {t("viewDetail")}
                          </Link>
                        )}
                        <Link
                          href={`/hoi-vien/${member.id}/the-in`}
                          className="text-brand-500 hover:text-brand-800 hover:underline"
                          title={t("printCardTooltip")}
                        >
                          {t("printCard")}
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  )
}
