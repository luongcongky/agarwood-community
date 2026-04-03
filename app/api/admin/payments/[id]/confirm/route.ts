import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { id: true, userId: true, type: true, amount: true, status: true, membershipId: true, certificationId: true },
  })
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "Thanh toán này đã được xử lý" }, { status: 400 })
  }

  // Mark payment SUCCESS
  await prisma.payment.update({ where: { id }, data: { status: "SUCCESS" } })

  if (payment.type === "MEMBERSHIP_FEE" && payment.membershipId) {
    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
      select: { membershipExpires: true, contributionTotal: true },
    })

    // Stack expiry from current date or existing expiry, whichever is later
    const baseDate =
      user?.membershipExpires && user.membershipExpires > new Date()
        ? user.membershipExpires
        : new Date()
    const newExpiry = new Date(baseDate)
    newExpiry.setFullYear(newExpiry.getFullYear() + 1)

    const newContrib = (user?.contributionTotal ?? 0) + payment.amount
    const newPriority = Math.floor(newContrib / 1_000_000)

    await Promise.all([
      prisma.membership.update({
        where: { id: payment.membershipId },
        data: { status: "ACTIVE", validFrom: new Date(), validTo: newExpiry },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: {
          membershipExpires: newExpiry,
          contributionTotal: newContrib,
          displayPriority: newPriority,
        },
      }),
    ])
  }

  if (payment.type === "CERTIFICATION_FEE" && payment.certificationId) {
    await prisma.certification.update({
      where: { id: payment.certificationId },
      data: { status: "PENDING" },
    })
  }

  return NextResponse.json({ success: true })
}
