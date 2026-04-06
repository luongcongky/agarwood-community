import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
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

  // Only author or admin can delete
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.post.update({
    where: { id },
    data: { status: "DELETED" },
  })

  return NextResponse.json({ success: true })
}
