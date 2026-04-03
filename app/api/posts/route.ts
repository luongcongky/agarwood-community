import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/posts?page=N&skip=N
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const skip = Number(searchParams.get("skip") ?? 0)

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ authorPriority: "desc" }, { createdAt: "desc" }],
    skip,
    take: 20,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
          company: { select: { name: true, slug: true } },
        },
      },
      _count: { select: { reactions: true } },
    },
  })

  return NextResponse.json({
    posts: posts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      lockedAt: p.lockedAt?.toISOString() ?? null,
      reactions: [],
    })),
  })
}

// POST /api/posts
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role === "GUEST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, content } = await request.json()
  if (!content || content.trim().length < 50) {
    return NextResponse.json({ error: "Nội dung quá ngắn" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayPriority: true, role: true },
  })

  const post = await prisma.post.create({
    data: {
      authorId: session.user.id,
      title: title || null,
      content,
      imageUrls: [],
      isPremium: session.user.role === "VIP",
      authorPriority: user?.displayPriority ?? 0,
    },
  })

  return NextResponse.json({ post }, { status: 201 })
}
