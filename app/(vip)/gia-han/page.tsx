import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMemberTier } from "@/lib/tier"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { RenewalClient } from "./RenewalClient"

export const metadata: Metadata = {
  title: "Gia hạn hội viên | Hội Trầm Hương Việt Nam",
}

export const revalidate = 0

export default async function GiaHanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const feeKeys = [
    "membership_fee_min", "membership_fee_max",
    "individual_fee_min", "individual_fee_max",
  ]

  const [user, feeConfigs, totalVIP] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        accountType: true,
        membershipExpires: true,
        contributionTotal: true,
        displayPriority: true,
        bankName: true,
        memberships: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            amountPaid: true,
            validFrom: true,
            validTo: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.siteConfig.findMany({
      where: { key: { in: feeKeys } },
    }),
    prisma.user.count({ where: { role: "VIP" } }),
  ])

  if (!user) redirect("/login")

  const cfgMap = Object.fromEntries(feeConfigs.map((c) => [c.key, Number(c.value)]))

  const isIndividual = user.accountType === "INDIVIDUAL"
  const feeMin = isIndividual
    ? (cfgMap.individual_fee_min ?? 1_000_000)
    : (cfgMap.membership_fee_min ?? 2_000_000)
  const feeMax = isIndividual
    ? (cfgMap.individual_fee_max ?? 2_000_000)
    : (cfgMap.membership_fee_max ?? 10_000_000)

  const daysLeft = user.membershipExpires
    ? Math.ceil((user.membershipExpires.getTime() - Date.now()) / 86400000)
    : 0

  // Tier info — pass accountType for correct thresholds
  const tier = await getMemberTier(user.contributionTotal, user.accountType as "BUSINESS" | "INDIVIDUAL")

  // Generate initials for CK description
  const initials = user.name
    .split(" ")
    .map((w) => w[0]?.toUpperCase())
    .filter(Boolean)
    .join("")

  return (
    <RenewalClient
      name={user.name}
      initials={initials}
      accountType={user.accountType}
      membershipExpires={user.membershipExpires?.toISOString() ?? null}
      daysLeft={daysLeft}
      contributionTotal={user.contributionTotal}
      displayPriority={user.displayPriority}
      tierLabel={tier.label}
      tierStars={tier.stars}
      totalVIP={totalVIP}
      feeMin={feeMin}
      feeMax={feeMax}
      hasBankInfo={!!user.bankName}
      history={user.memberships.map((m) => ({
        amountPaid: m.amountPaid,
        validFrom: m.validFrom.toISOString(),
        validTo: m.validTo.toISOString(),
        status: m.status,
      }))}
    />
  )
}
