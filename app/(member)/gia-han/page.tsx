import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { RenewalClient } from "./RenewalClient"

export const metadata: Metadata = {
  title: "Gia hạn hội viên | Hội Trầm Hương Việt Nam",
}

export default async function GiaHanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      membershipExpires: true,
      contributionTotal: true,
      displayPriority: true,
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
  })
  if (!user) redirect("/login")

  const expiresStr = user.membershipExpires?.toISOString() ?? null
  const daysLeft = user.membershipExpires
    ? Math.ceil(
        (user.membershipExpires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <RenewalClient
      userId={user.id}
      name={user.name}
      email={user.email}
      membershipExpires={expiresStr}
      daysLeft={daysLeft}
      contributionTotal={user.contributionTotal}
      displayPriority={user.displayPriority}
      history={user.memberships.map((m) => ({
        amountPaid: m.amountPaid,
        validFrom: m.validFrom.toISOString(),
        validTo: m.validTo.toISOString(),
        status: m.status,
        year: m.validFrom.getFullYear(),
      }))}
    />
  )
}
