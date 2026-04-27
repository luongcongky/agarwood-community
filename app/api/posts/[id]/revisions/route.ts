import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/posts/:id/revisions — list audit history.
 * Phase 3.6 (2026-04): owner xem được history của bài mình + bản admin sửa
 * gì; admin xem được history mọi bài. Không cho người khác xem (privacy:
 * revision có thể chứa nội dung admin reject — không phải content public).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  })
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (post.authorId !== session.user.id && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const revisions = await prisma.postRevision.findMany({
    where: { postId: id },
    orderBy: { version: "desc" },
    include: {
      editor: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
    },
  })

  return NextResponse.json({ revisions })
}
