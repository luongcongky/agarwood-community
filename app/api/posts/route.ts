import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getQuotaUsage } from "@/lib/quota"
import DOMPurify from "isomorphic-dompurify"
import type { PostCategory } from "@prisma/client"

const VALID_CATEGORIES: PostCategory[] = ["GENERAL", "NEWS", "PRODUCT"]

// GET /api/posts?cursor=<postId>
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor")
  const session = await auth()
  const userId = session?.user?.id

  const posts = await prisma.post.findMany({
    where: { status: { in: ["PUBLISHED", "LOCKED"] } },
    orderBy: [
      { isPromoted: "desc" },
      { authorPriority: "desc" },
      { createdAt: "desc" },
    ],
    take: 20,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      authorId: true,
      title: true,
      content: true,
      imageUrls: true,
      status: true,
      isPremium: true,
      isPromoted: true,
      authorPriority: true,
      viewCount: true,
      reportCount: true,
      lockedBy: true,
      lockReason: true,
      createdAt: true,
      updatedAt: true,
      lockedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
          accountType: true,
          contributionTotal: true,
          company: { select: { name: true, slug: true } },
        },
      },
      reactions: {
        where: { userId: userId ?? "none" },
        select: { type: true },
      },
      _count: { select: { reactions: true } },
    },
  })

  const response = NextResponse.json({
    posts: posts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      lockedAt: p.lockedAt?.toISOString() ?? null,
    })),
  })
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
  return response
}

// POST /api/posts
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, content, category } = await request.json()
  if (!content || content.trim().length < 50) {
    return NextResponse.json({ error: "Nội dung quá ngắn (tối thiểu 50 ký tự)" }, { status: 400 })
  }

  // Validate category — default GENERAL nếu không truyền
  const cat: PostCategory = VALID_CATEGORIES.includes(category) ? category : "GENERAL"

  // Quota tháng — thay thế anti-spam 3 bài/ngày cũ
  const usage = await getQuotaUsage(session.user.id)
  if (usage.limit !== -1 && usage.used >= usage.limit) {
    return NextResponse.json(
      {
        error: `Bạn đã đăng ${usage.used}/${usage.limit} bài tháng này. Hạn mức sẽ được làm mới vào đầu tháng sau. Nâng cấp VIP để tăng hạn mức.`,
        quota: usage,
      },
      { status: 429 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayPriority: true, contributionTotal: true },
  })

  const sanitizedContent = DOMPurify.sanitize(content)

  const post = await prisma.post.create({
    data: {
      authorId: session.user.id,
      title: title || null,
      content: sanitizedContent,
      imageUrls: [],
      category: cat,
      isPremium: session.user.role === "VIP",
      authorPriority: user?.displayPriority ?? 0,
    },
  })

  return NextResponse.json({ post }, { status: 201 })
}
