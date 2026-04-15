import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { action } = await req.json()

  const report = await prisma.report.findUnique({
    where: { id },
    include: { post: true },
  })

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const now = new Date()
  const adminId = session.user.id

  if (action === "dismiss") {
    await prisma.report.update({
      where: { id },
      data: {
        status: "DISMISSED",
        reviewedBy: adminId,
        reviewedAt: now,
      },
    })
  } else if (action === "lock") {
    await Promise.all([
      prisma.post.update({
        where: { id: report.postId },
        data: {
          status: "LOCKED",
          lockedAt: now,
          lockedBy: adminId,
        },
      }),
      prisma.report.update({
        where: { id },
        data: {
          status: "ACTIONED",
          reviewedBy: adminId,
          reviewedAt: now,
        },
      }),
    ])
  } else if (action === "unlock") {
    await Promise.all([
      prisma.post.update({
        where: { id: report.postId },
        data: {
          status: "PUBLISHED",
          lockedAt: null,
          lockedBy: null,
        },
      }),
      prisma.report.update({
        where: { id },
        data: {
          status: "REVIEWED",
          reviewedBy: adminId,
          reviewedAt: now,
        },
      }),
    ])
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
