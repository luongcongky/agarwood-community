import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id }, select: { status: true } })
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const newStatus = post.status === "LOCKED" ? "PUBLISHED" : "LOCKED"

  await prisma.post.update({
    where: { id },
    data: {
      status: newStatus,
      lockedAt: newStatus === "LOCKED" ? new Date() : null,
      lockedBy: newStatus === "LOCKED" ? session.user.id : null,
    },
  })

  return NextResponse.json({ status: newStatus })
}
