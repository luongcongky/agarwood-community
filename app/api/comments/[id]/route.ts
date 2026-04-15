import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/comments/:id — edit own comment
 * Body: { content }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, deletedAt: true },
  })
  if (!comment || comment.deletedAt) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 })
  }
  if (comment.authorId !== session.user.id && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const content = (body.content as string)?.trim()
  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { content },
  })

  return NextResponse.json({ comment: updated })
}

/**
 * DELETE /api/comments/:id — soft delete (own + admin)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, deletedAt: true },
  })
  if (!comment || comment.deletedAt) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 })
  }
  if (comment.authorId !== session.user.id && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.comment.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
