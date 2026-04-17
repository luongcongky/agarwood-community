import { getTranslations } from "next-intl/server"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { calcTier, getTierThresholds } from "@/lib/tier"
import type { Metadata } from "next"

// ── Metadata động theo user ──────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const member = await prisma.user.findFirst({
    where: { id, role: { in: ["VIP", "INFINITE"] }, isActive: true },
    select: { name: true, bio: true },
  })
  if (!member) return { title: "Not found" }
  return {
    title: `${member.name} — Hội viên Trầm Hương Việt Nam`,
    description: member.bio?.slice(0, 160) ?? `Thông tin hội viên ${member.name} — Hội Trầm Hương Việt Nam.`,
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

// MEMBER_CATEGORY_LABEL moved inside component for t() access

function fmtDate(d: Date | null): string {
  if (!d) return "—"
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const tM = await getTranslations("memberDetail")
  const MEMBER_CATEGORY_LABEL: Record<string, string> = {
    OFFICIAL: tM("official"), AFFILIATE: tM("affiliate"), HONORARY: tM("honorary"),
  }

  const { id } = await params

  const [member, businessThresholds, individualThresholds] = await Promise.all([
    prisma.user.findFirst({
      where: { id, role: { in: ["VIP", "INFINITE"] }, isActive: true },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
        accountType: true,
        memberCategory: true,
        contributionTotal: true,
        membershipExpires: true,
        createdAt: true,
        company: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
            representativeName: true,
            representativePosition: true,
            isPublished: true,
          },
        },
      },
    }),
    getTierThresholds("BUSINESS"),
    getTierThresholds("INDIVIDUAL"),
  ])

  if (!member) notFound()

  const thresholds =
    member.accountType === "INDIVIDUAL" ? individualThresholds : businessThresholds
  const tierInfo = calcTier(member.contributionTotal, thresholds.silver, thresholds.gold)
  const categoryLabel = MEMBER_CATEGORY_LABEL[member.memberCategory] ?? "—"
  const isBusiness = member.accountType === "BUSINESS"
  const companyPublic = member.company && member.company.isPublished

  return (
    <div>
      {/* Header banner */}
      <section className="bg-brand-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/hoi-vien"
            className="inline-block text-sm text-brand-300 hover:text-brand-100 mb-4"
          >
            &larr; Danh sách hội viên
          </Link>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-brand-600 bg-brand-900 shrink-0">
              {member.avatarUrl ? (
                <Image src={member.avatarUrl} alt={member.name} fill className="object-cover" sizes="96px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-brand-200">
                  {member.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-100">{member.name}</h1>
              <p className="text-sm text-brand-300 mt-1">
                {isBusiness ? tM("businessMember") : tM("individualMember")}
                <span className="mx-2">·</span>
                Hạng {categoryLabel}
                {tierInfo.stars > 0 && <span className="ml-2 text-amber-300">{"★".repeat(tierInfo.stars)} {tierInfo.label}</span>}
              </p>
              {isBusiness && member.company && (
                <p className="text-sm text-brand-400 mt-0.5">
                  {member.company.representativePosition ? `${member.company.representativePosition} · ` : ""}
                  {companyPublic ? (
                    <Link href={`/doanh-nghiep/${member.company.slug}`} className="underline hover:text-brand-200">
                      {member.company.name}
                    </Link>
                  ) : (
                    member.company.name
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="bg-brand-50/60">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        {/* Bio */}
        <section className="bg-white rounded-xl border border-brand-200 p-6">
          <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide mb-3">
            Giới thiệu
          </h2>
          {member.bio?.trim() ? (
            <p className="text-sm leading-relaxed text-brand-800 whitespace-pre-wrap">
              {member.bio}
            </p>
          ) : (
            <p className="text-sm text-brand-400 italic">Hội viên chưa cập nhật phần giới thiệu.</p>
          )}
        </section>

        {/* Membership info grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-brand-200 p-5">
            <p className="text-xs text-brand-400 uppercase tracking-wide mb-1">{tM("joinedSince")}</p>
            <p className="text-base font-semibold text-brand-900">{fmtDate(member.createdAt)}</p>
          </div>
          <div className="bg-white rounded-xl border border-brand-200 p-5">
            <p className="text-xs text-brand-400 uppercase tracking-wide mb-1">{tM("validUntil")}</p>
            <p className="text-base font-semibold text-brand-900">{fmtDate(member.membershipExpires)}</p>
          </div>
          <div className="bg-white rounded-xl border border-brand-200 p-5">
            <p className="text-xs text-brand-400 uppercase tracking-wide mb-1">{tM("tier")}</p>
            <p className="text-base font-semibold text-brand-900">{categoryLabel}</p>
          </div>
        </section>

        {/* Quick actions */}
        <section className="flex flex-wrap gap-3">
          {isBusiness && companyPublic && (
            <Link
              href={`/doanh-nghiep/${member.company!.slug}`}
              className="inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
            >
              Xem trang doanh nghiệp →
            </Link>
          )}
          <Link
            href="/hoi-vien"
            className="inline-flex items-center rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
          >
            Quay lại danh sách
          </Link>
        </section>
      </div>
      </div>
    </div>
  )
}
