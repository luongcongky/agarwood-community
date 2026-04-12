import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { calcTier } from "@/lib/tier"
import { getTierThresholds } from "@/lib/tier"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hội viên VIP",
  description:
    "Danh sách hội viên VIP đang hoạt động — Hội Trầm Hương Việt Nam.",
  alternates: { canonical: "/hoi-vien" },
}

export const revalidate = 600

function TierBadge({ stars, label }: { stars: number; label: string }) {
  const colors =
    stars === 3
      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
      : stars === 2
        ? "bg-gray-100 text-gray-700 border-gray-300"
        : "bg-brand-100 text-brand-700 border-brand-300"

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${colors}`}
    >
      {"★".repeat(stars)} {label}
    </span>
  )
}

export default async function VipMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const q = params.q ?? ""

  const [members, businessThresholds, individualThresholds] = await Promise.all(
    [
      prisma.user.findMany({
        where: {
          role: "VIP",
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
          accountType: true,
          contributionTotal: true,
          memberCategory: true,
          company: {
            select: {
              name: true,
              slug: true,
              logoUrl: true,
              address: true,
              isVerified: true,
            },
          },
        },
      }),
      getTierThresholds("BUSINESS"),
      getTierThresholds("INDIVIDUAL"),
    ],
  )

  return (
    <div>
      {/* Page Banner */}
      <section className="bg-brand-800 py-16 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">
          Hội viên VIP
        </h1>
        <p className="mt-2 text-brand-300 text-lg">
          {members.length} hội viên VIP đang hoạt động
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
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
            placeholder="Tìm kiếm hội viên..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-700 text-brand-100 px-5 py-2.5 text-sm font-medium hover:bg-brand-800 transition-colors"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Members Grid */}
        {members.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground font-medium">
              Không tìm thấy hội viên nào
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {q
                ? `Không có kết quả cho "${q}". Thử từ khóa khác nhé.`
                : "Chưa có hội viên VIP nào."}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => {
              const thresholds =
                member.accountType === "INDIVIDUAL"
                  ? individualThresholds
                  : businessThresholds
              const tier = calcTier(
                member.contributionTotal,
                thresholds.silver,
                thresholds.gold,
              )
              const logo = member.company?.logoUrl ?? member.avatarUrl

              return (
                <div
                  key={member.id}
                  className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
                >
                  {/* Avatar + Name Row */}
                  <div className="flex items-center gap-3">
                    {logo ? (
                      <div className="relative w-16 h-16 shrink-0">
                        <Image
                          src={logo}
                          alt={member.name}
                          fill
                          className="rounded-full object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <AgarwoodPlaceholder
                        className="w-16 h-16"
                        shape="full"
                        size="sm"
                      />
                    )}
                    <div className="min-w-0">
                      <h2 className="font-bold text-foreground text-base leading-tight">
                        {member.name}
                      </h2>
                      <TierBadge stars={tier.stars} label={tier.label} />
                    </div>
                  </div>

                  {/* Company */}
                  {member.company && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      {member.company.isVerified && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                      <span className="text-sm font-medium text-brand-700 truncate">
                        {member.company.name}
                      </span>
                    </div>
                  )}

                  {/* Address */}
                  {member.company?.address && (
                    <p className="text-muted-foreground text-xs truncate flex items-center gap-1">
                      <span>📍</span> {member.company.address}
                    </p>
                  )}

                  {/* Phone */}
                  {member.phone && (
                    <p className="text-muted-foreground text-xs flex items-center gap-1">
                      <span>📞</span> {member.phone}
                    </p>
                  )}

                  {/* Member Category */}
                  <p className="text-xs text-muted-foreground">
                    {member.memberCategory === "HONORARY"
                      ? "Hội viên danh dự"
                      : member.memberCategory === "AFFILIATE"
                        ? "Hội viên liên kết"
                        : "Hội viên chính thức"}
                  </p>

                  {/* CTA */}
                  {member.company?.slug && (
                    <div className="mt-auto pt-2">
                      <Link
                        href={`/doanh-nghiep/${member.company.slug}`}
                        className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
                      >
                        Xem doanh nghiệp →
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
