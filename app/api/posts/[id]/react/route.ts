import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Toggle reaction
  const existing = await prisma.postReaction.findUnique({
    where: { postId_userId: { postId: id, userId: session.user.id } },
  })

  if (existing) {
    await prisma.postReaction.delete({
      where: { postId_userId: { postId: id, userId: session.user.id } },
    })
    return NextResponse.json({ liked: false })
  } else {
    await prisma.postReaction.create({
      data: { postId: id, userId: session.user.id, type: "LIKE" },
    })
    return NextResponse.json({ liked: true })
  }
}
