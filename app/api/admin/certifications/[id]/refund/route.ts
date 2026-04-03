import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const cert = await prisma.certification.findUnique({
    where: { id },
    select: { status: true },
  })

  if (!cert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (cert.status !== "REJECTED") {
    return NextResponse.json(
      { error: "Chỉ có thể hoàn tiền cho đơn đã từ chối" },
      { status: 400 }
    )
  }

  await prisma.certification.update({
    where: { id },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
