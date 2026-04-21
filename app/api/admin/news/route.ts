import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import DOMPurify from "isomorphic-dompurify"
import { scoreSeo } from "@/lib/seo/score"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const {
    title, title_en, title_zh, title_ar,
    slug,
    excerpt, excerpt_en, excerpt_zh, excerpt_ar,
    content, content_en, content_zh, content_ar,
    coverImageUrl,
    category,
    isPublished,
    isPinned,
    publishedAt,
    // SEO fields
    seoTitle, seoTitle_en, seoTitle_zh, seoTitle_ar,
    seoDescription, seoDescription_en, seoDescription_zh, seoDescription_ar,
    coverImageAlt, coverImageAlt_en, coverImageAlt_zh, coverImageAlt_ar,
    focusKeyword,
    secondaryKeywords,
  } = body

  if (!title || !slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Tiêu đề và slug là bắt buộc" },
      { status: 400 }
    )
  }

  const validCategory =
    category === "RESEARCH" ? "RESEARCH" : category === "LEGAL" ? "LEGAL" : "GENERAL"

  // Compute SEO score against VI content (source-of-truth). previousTitles
  // is fetched once per save; the live editor uses /api/admin/news/seo-score
  // for typing-time previews.
  const sanitizedContent = content ? DOMPurify.sanitize(content) : ""
  const previous = await prisma.news.findMany({
    where: { isPublished: true },
    select: { title: true },
    orderBy: { publishedAt: "desc" },
    take: 1000,
  })
  const translatedLocaleCount = [title_en, title_zh, title_ar].filter(
    (t) => typeof t === "string" && t.trim().length > 0,
  ).length
  const seoResult = scoreSeo({
    title,
    seoTitle: seoTitle || null,
    excerpt: excerpt ?? null,
    seoDescription: seoDescription || null,
    content: sanitizedContent,
    focusKeyword: focusKeyword || null,
    secondaryKeywords: Array.isArray(secondaryKeywords) ? secondaryKeywords : [],
    coverImageUrl: coverImageUrl ?? null,
    coverImageAlt: coverImageAlt || null,
    slug,
    previousTitles: previous.map((p) => p.title),
    translatedLocaleCount,
  })

  const news = await prisma.news.create({
    data: {
      title,
      title_en: title_en || null,
      title_zh: title_zh || null,
      title_ar: title_ar || null,
      slug,
      excerpt: excerpt ?? null,
      excerpt_en: excerpt_en || null,
      excerpt_zh: excerpt_zh || null,
      excerpt_ar: excerpt_ar || null,
      content: sanitizedContent,
      content_en: content_en ? DOMPurify.sanitize(content_en) : null,
      content_zh: content_zh ? DOMPurify.sanitize(content_zh) : null,
      content_ar: content_ar ? DOMPurify.sanitize(content_ar) : null,
      coverImageUrl: coverImageUrl ?? null,
      category: validCategory,
      isPublished: isPublished ?? false,
      isPinned: isPinned ?? false,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      authorId: session.user.id,
      // SEO
      seoTitle: seoTitle || null,
      seoTitle_en: seoTitle_en || null,
      seoTitle_zh: seoTitle_zh || null,
      seoTitle_ar: seoTitle_ar || null,
      seoDescription: seoDescription || null,
      seoDescription_en: seoDescription_en || null,
      seoDescription_zh: seoDescription_zh || null,
      seoDescription_ar: seoDescription_ar || null,
      coverImageAlt: coverImageAlt || null,
      coverImageAlt_en: coverImageAlt_en || null,
      coverImageAlt_zh: coverImageAlt_zh || null,
      coverImageAlt_ar: coverImageAlt_ar || null,
      focusKeyword: focusKeyword || null,
      secondaryKeywords: Array.isArray(secondaryKeywords) ? secondaryKeywords : [],
      seoScore: seoResult.legacyScore,
      seoScoreDetail: seoResult as unknown as object,
    },
  })

  return NextResponse.json({ news }, { status: 201 })
}
