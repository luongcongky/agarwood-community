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
    select: { id: true, status: true, membershipId: true, certificationId: true },
  })
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "Thanh toán này đã được xử lý" }, { status: 400 })
  }

  await prisma.payment.update({ where: { id }, data: { status: "FAILED" } })

  if (payment.membershipId) {
    await prisma.membership.update({
      where: { id: payment.membershipId },
      data: { status: "EXPIRED" },
    })
  }
  if (payment.certificationId) {
    await prisma.certification.update({
      where: { id: payment.certificationId },
      data: { status: "REJECTED" },
    })
  }

  return NextResponse.json({ success: true })
}
