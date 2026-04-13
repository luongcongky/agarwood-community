import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import DOMPurify from "isomorphic-dompurify"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const {
    title,
    slug,
    excerpt,
    content,
    coverImageUrl,
    category,
    isPublished,
    isPinned,
    publishedAt,
  } = await req.json()

  if (!title || !slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Tiêu đề và slug là bắt buộc" },
      { status: 400 }
    )
  }

  const validCategory =
    category === "RESEARCH" ? "RESEARCH" : category === "LEGAL" ? "LEGAL" : "GENERAL"

  const news = await prisma.news.create({
    data: {
      title,
      slug,
      excerpt: excerpt ?? null,
      content: content ? DOMPurify.sanitize(content) : "",
      coverImageUrl: coverImageUrl ?? null,
      category: validCategory,
      isPublished: isPublished ?? false,
      isPinned: isPinned ?? false,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      authorId: session.user.id,
    },
  })

  return NextResponse.json({ news }, { status: 201 })
}
