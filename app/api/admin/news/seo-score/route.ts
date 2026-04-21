import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { scoreSeo, type SeoInput } from "@/lib/seo/score"

/** Real-time SEO scoring endpoint used by the news editor.
 *  Computes the rubric without writing to DB so the editor can show a live
 *  score panel as the writer types. The cached `seoScore` is updated
 *  separately when the article is saved (see app/api/admin/news/route.ts). */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const {
    excludeId, // current article id, so it isn't counted as its own duplicate
    title,
    seoTitle,
    excerpt,
    seoDescription,
    content,
    focusKeyword,
    secondaryKeywords,
    coverImageUrl,
    coverImageAlt,
    slug,
    translatedLocaleCount,
  } = body as Partial<SeoInput> & { excludeId?: string }

  // Fetch a window of recent published titles for the duplicate check.
  // 1000 is plenty: a writer almost never repeats wording from beyond that.
  const previous = await prisma.news.findMany({
    where: {
      isPublished: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { title: true },
    orderBy: { publishedAt: "desc" },
    take: 1000,
  })

  const result = scoreSeo({
    title: title ?? "",
    seoTitle: seoTitle ?? null,
    excerpt: excerpt ?? null,
    seoDescription: seoDescription ?? null,
    content: content ?? "",
    focusKeyword: focusKeyword ?? null,
    secondaryKeywords: secondaryKeywords ?? [],
    coverImageUrl: coverImageUrl ?? null,
    coverImageAlt: coverImageAlt ?? null,
    slug: slug ?? null,
    previousTitles: previous.map((p) => p.title),
    translatedLocaleCount: translatedLocaleCount ?? 0,
  })

  return NextResponse.json(result)
}
