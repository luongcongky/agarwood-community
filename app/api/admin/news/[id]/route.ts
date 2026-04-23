import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { isAdmin, canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { sanitizeArticleHtml } from "@/lib/sanitize"
import { scoreSeo } from "@/lib/seo/score"

function revalidateNewsSurfaces() {
  revalidatePath("/sitemap.xml")
  revalidatePath("/feed.xml")
  revalidatePath("/[locale]/tin-tuc", "layout")
  revalidatePath("/[locale]/nghien-cuu", "layout")
  revalidateTag("homepage", "max")
  revalidateTag("news", "max")
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const news = await prisma.news.findUnique({ where: { id } })
  if (!news) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ news })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
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
    seoTitle, seoTitle_en, seoTitle_zh, seoTitle_ar,
    seoDescription, seoDescription_en, seoDescription_zh, seoDescription_ar,
    coverImageAlt, coverImageAlt_en, coverImageAlt_zh, coverImageAlt_ar,
    focusKeyword,
    secondaryKeywords,
  } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {}
  if (title !== undefined) data.title = title
  if ("title_en" in body) data.title_en = title_en || null
  if ("title_zh" in body) data.title_zh = title_zh || null
  if ("title_ar" in body) data.title_ar = title_ar || null
  if (slug !== undefined) data.slug = slug
  if (excerpt !== undefined) data.excerpt = excerpt
  if ("excerpt_en" in body) data.excerpt_en = excerpt_en || null
  if ("excerpt_zh" in body) data.excerpt_zh = excerpt_zh || null
  if ("excerpt_ar" in body) data.excerpt_ar = excerpt_ar || null
  if (content !== undefined) data.content = content ? sanitizeArticleHtml(content) : ""
  if ("content_en" in body) data.content_en = content_en ? sanitizeArticleHtml(content_en) : null
  if ("content_zh" in body) data.content_zh = content_zh ? sanitizeArticleHtml(content_zh) : null
  if ("content_ar" in body) data.content_ar = content_ar ? sanitizeArticleHtml(content_ar) : null
  if (coverImageUrl !== undefined) data.coverImageUrl = coverImageUrl
  if (category !== undefined)
    data.category =
      category === "RESEARCH"
        ? "RESEARCH"
        : category === "LEGAL"
          ? "LEGAL"
          : category === "SPONSORED_PRODUCT"
            ? "SPONSORED_PRODUCT"
            : "GENERAL"
  if (isPublished !== undefined) data.isPublished = isPublished
  if (isPinned !== undefined) data.isPinned = isPinned
  if (publishedAt !== undefined)
    data.publishedAt = publishedAt ? new Date(publishedAt) : null

  // SEO field passthrough — only set when key present in body so we don't
  // accidentally null out fields the editor didn't send.
  const seoKeys = [
    "seoTitle", "seoTitle_en", "seoTitle_zh", "seoTitle_ar",
    "seoDescription", "seoDescription_en", "seoDescription_zh", "seoDescription_ar",
    "coverImageAlt", "coverImageAlt_en", "coverImageAlt_zh", "coverImageAlt_ar",
    "focusKeyword",
  ] as const
  const seoLocals: Record<string, string | null | undefined> = {
    seoTitle, seoTitle_en, seoTitle_zh, seoTitle_ar,
    seoDescription, seoDescription_en, seoDescription_zh, seoDescription_ar,
    coverImageAlt, coverImageAlt_en, coverImageAlt_zh, coverImageAlt_ar,
    focusKeyword,
  }
  for (const k of seoKeys) {
    if (k in body) data[k] = seoLocals[k] || null
  }
  if ("secondaryKeywords" in body) {
    data.secondaryKeywords = Array.isArray(secondaryKeywords) ? secondaryKeywords : []
  }

  // Re-score on every save. Pull current row to fill gaps for fields the
  // editor didn't send.
  const current = await prisma.news.findUnique({ where: { id } })
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const merged = { ...current, ...data } as typeof current
  const previous = await prisma.news.findMany({
    where: { isPublished: true, id: { not: id } },
    select: { title: true },
    orderBy: { publishedAt: "desc" },
    take: 1000,
  })
  const translatedLocaleCount = [merged.title_en, merged.title_zh, merged.title_ar].filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0,
  ).length
  const seoResult = scoreSeo({
    title: merged.title,
    seoTitle: merged.seoTitle,
    excerpt: merged.excerpt,
    seoDescription: merged.seoDescription,
    content: merged.content ?? "",
    focusKeyword: merged.focusKeyword,
    secondaryKeywords: merged.secondaryKeywords,
    coverImageUrl: merged.coverImageUrl,
    coverImageAlt: merged.coverImageAlt,
    slug: merged.slug,
    previousTitles: previous.map((p) => p.title),
    translatedLocaleCount,
  })
  data.seoScore = seoResult.legacyScore
  data.seoScoreDetail = seoResult as unknown as object

  const news = await prisma.news.update({ where: { id }, data })

  revalidateNewsSurfaces()

  return NextResponse.json({ news })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  await prisma.news.delete({ where: { id } })

  revalidateNewsSurfaces()

  return NextResponse.json({ success: true })
}
