import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role === "GUEST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { reason } = await req.json()

  if (!reason) {
    return NextResponse.json({ error: "Vui lòng nhập lý do" }, { status: 400 })
  }

  // Check if already reported by this user
  const existing = await prisma.report.findUnique({
    where: { postId_reporterId: { postId: id, reporterId: session.user.id } },
  })
  if (existing) {
    return NextResponse.json({ error: "Bạn đã báo cáo bài viết này rồi" }, { status: 409 })
  }

  await prisma.report.create({
    data: {
      postId: id,
      reporterId: session.user.id,
      reason,
      status: "PENDING",
    },
  })

  // Update report count on post
  await prisma.post.update({
    where: { id },
    data: { reportCount: { increment: 1 } },
  })

  // Auto-lock if 5+ reports
  const post = await prisma.post.findUnique({
    where: { id },
    select: { reportCount: true, status: true },
  })
  if (post && post.reportCount >= 5 && post.status === "PUBLISHED") {
    await prisma.post.update({
      where: { id },
      data: {
        status: "LOCKED",
        lockedAt: new Date(),
        lockReason: "Tự động khoá do nhận 5+ báo cáo",
      },
    })
  }

  return NextResponse.json({ success: true })
}
