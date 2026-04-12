import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/comments/:id/like — toggle like on a comment
 * Returns { liked: boolean, likeCount: number }
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: commentId } = await params
  const userId = session.user.id

  // Verify comment exists
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, deletedAt: true },
  })
  if (!comment || comment.deletedAt) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 })
  }

  // Toggle: if already liked, unlike; otherwise like
  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId } },
  })

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } })
  } else {
    await prisma.commentLike.create({
      data: { commentId, userId },
    })
  }

  const likeCount = await prisma.commentLike.count({ where: { commentId } })

  return NextResponse.json({
    liked: !existing,
    likeCount,
  })
}
