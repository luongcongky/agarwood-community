import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { getPreviousTitles } from "@/lib/news-seo-cache"
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

  // Danh sách title cho duplicate check. Đi qua unstable_cache (tag
  // "news:titles") nên đa số keystroke burst hit cache, không chạm DB.
  // Invalidation: POST/PATCH/DELETE news đều revalidateTag.
  const previousTitles = await getPreviousTitles(excludeId)

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
    previousTitles,
    translatedLocaleCount: translatedLocaleCount ?? 0,
  })

  return NextResponse.json(result)
}
