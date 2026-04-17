import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import DOMPurify from "isomorphic-dompurify"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const {
    title, title_en, title_zh,
    slug,
    excerpt, excerpt_en, excerpt_zh,
    content, content_en, content_zh,
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
      title_en: title_en || null,
      title_zh: title_zh || null,
      slug,
      excerpt: excerpt ?? null,
      excerpt_en: excerpt_en || null,
      excerpt_zh: excerpt_zh || null,
      content: content ? DOMPurify.sanitize(content) : "",
      content_en: content_en ? DOMPurify.sanitize(content_en) : null,
      content_zh: content_zh ? DOMPurify.sanitize(content_zh) : null,
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
