import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/comments?postId=xxx  OR  ?productId=xxx  OR  ?newsId=xxx
 * Returns comments tree (flat with parentId) for a target.
 * Guest-accessible (no auth required for reading).
 *
 * Phase 3.4 (2026-04): newsId target — dùng cho /tin-tuc + /nghien-cuu.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const postId = searchParams.get("postId")
  const productId = searchParams.get("productId")
  const newsId = searchParams.get("newsId")

  const targets = [postId, productId, newsId].filter(Boolean)
  if (targets.length === 0) {
    return NextResponse.json({ error: "postId, productId, or newsId required" }, { status: 400 })
  }
  if (targets.length > 1) {
    return NextResponse.json({ error: "Only one target id at a time" }, { status: 400 })
  }

  const session = await auth()
  const userId = session?.user?.id

  const comments = await prisma.comment.findMany({
    where: {
      ...(postId ? { postId } : productId ? { productId } : { newsId }),
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
      likes: userId
        ? { where: { userId }, select: { id: true } }
        : false,
      _count: { select: { likes: true, replies: true } },
    },
  })

  // Map to safe response shape
  const mapped = comments.map((c) => ({
    id: c.id,
    content: c.content,
    parentId: c.parentId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    author: c.author,
    likeCount: c._count.likes,
    replyCount: c._count.replies,
    isLiked: Array.isArray(c.likes) ? c.likes.length > 0 : false,
  }))

  return NextResponse.json({ comments: mapped })
}

/**
 * POST /api/comments
 * Body: { content, postId?, productId?, parentId? }
 * Requires login.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { content, postId, productId, newsId, parentId } = body as {
    content?: string
    postId?: string
    productId?: string
    newsId?: string
    parentId?: string
  }

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }
  if (content.trim().length > 5000) {
    return NextResponse.json({ error: "Comment too long (max 5000 chars)" }, { status: 400 })
  }
  const targetIds = [postId, productId, newsId].filter(Boolean)
  if (targetIds.length === 0) {
    return NextResponse.json({ error: "postId, productId, or newsId required" }, { status: 400 })
  }
  if (targetIds.length > 1) {
    return NextResponse.json({ error: "Cannot target multiple entities" }, { status: 400 })
  }

  // Verify target exists
  if (postId) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
  }
  if (newsId) {
    // Chỉ cho comment trên News đã publish — tránh spam vào draft.
    const news = await prisma.news.findUnique({
      where: { id: newsId },
      select: { id: true, isPublished: true },
    })
    if (!news) return NextResponse.json({ error: "News not found" }, { status: 404 })
    if (!news.isPublished) {
      return NextResponse.json({ error: "Cannot comment on unpublished news" }, { status: 403 })
    }
  }

  // Verify parent exists if replying
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { id: true, deletedAt: true } })
    if (!parent || parent.deletedAt) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 })
    }
  }

  const comment = await prisma.comment.create({
    data: {
      authorId: session.user.id,
      content: content.trim(),
      postId: postId || null,
      productId: productId || null,
      newsId: newsId || null,
      parentId: parentId || null,
    },
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
      _count: { select: { likes: true, replies: true } },
    },
  })

  return NextResponse.json({
    comment: {
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author,
      likeCount: comment._count.likes,
      replyCount: comment._count.replies,
      isLiked: false,
    },
  }, { status: 201 })
}
