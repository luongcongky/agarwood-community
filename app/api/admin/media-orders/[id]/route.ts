import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const data = await req.json()

  // Only allow known fields to be updated
  const {
    status,
    assignedTo,
    quotedPrice,
    internalNote,
    deliveryFileUrls,
    cancelReason,
  } = data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {}

  if (status !== undefined) updateData.status = status
  if (assignedTo !== undefined) updateData.assignedTo = assignedTo
  if (quotedPrice !== undefined) updateData.quotedPrice = quotedPrice
  if (internalNote !== undefined) updateData.internalNote = internalNote
  if (deliveryFileUrls !== undefined)
    updateData.deliveryFileUrls = deliveryFileUrls
  if (cancelReason !== undefined) updateData.cancelReason = cancelReason

  // Set timestamps based on status transitions
  if (status === "DELIVERED") {
    updateData.deliveredAt = new Date()
  } else if (status === "COMPLETED") {
    updateData.completedAt = new Date()
  }

  await prisma.mediaOrder.update({ where: { id }, data: updateData })

  return NextResponse.json({ success: true })
}
