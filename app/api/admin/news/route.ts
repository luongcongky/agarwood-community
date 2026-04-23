import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { canWriteNews, canPublishNews } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { sanitizeArticleHtml } from "@/lib/sanitize"
import { scoreSeo } from "@/lib/seo/score"
import { getPreviousTitles } from "@/lib/news-seo-cache"

/**
 * Invalidate surfaces depending on News table.
 *
 * `publicFacing=false` (default true) → skip re-validating public pages +
 * sitemap/feed. Dùng cho save nháp (`isPublished=false` cả trước + sau): nội
 * dung không ra ngoài thì không cần đẩy cache homepage/tin-tuc/sitemap.
 *
 * Luôn invalidate admin list (`/admin/tin-tuc`) vì admin mong thấy status
 * mới ngay sau CRUD, và cache tag "news:titles" để SEO-score endpoint
 * re-query nếu title vừa đổi.
 */
function revalidateNewsSurfaces({ publicFacing = true }: { publicFacing?: boolean } = {}) {
  revalidatePath("/admin/tin-tuc")
  revalidateTag("news:titles", "max")
  if (!publicFacing) return
  revalidatePath("/sitemap.xml")
  revalidatePath("/feed.xml")
  revalidatePath("/[locale]/tin-tuc", "layout")
  revalidatePath("/[locale]/nghien-cuu", "layout")
  revalidateTag("homepage", "max")
  revalidateTag("news", "max")
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canWriteNews(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // INFINITE được phép tạo bài nhưng không được tự xuất bản — force nháp.
  // Admin sẽ review + bật `isPublished` sau.
  const canPublish = canPublishNews(session.user.role)

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
    category === "RESEARCH"
      ? "RESEARCH"
      : category === "LEGAL"
        ? "LEGAL"
        : category === "SPONSORED_PRODUCT"
          ? "SPONSORED_PRODUCT"
          : "GENERAL"

  // Compute SEO score against VI content (source-of-truth). previousTitles
  // đi qua unstable_cache (tag "news:titles"); mỗi save chỉ invalidate 1
  // lần ở cuối, không scan 1000 row mỗi keystroke.
  const sanitizedContent = content ? sanitizeArticleHtml(content) : ""
  const previousTitles = await getPreviousTitles()
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
    previousTitles,
    translatedLocaleCount,
  })

  const finalIsPublished = canPublish ? (isPublished ?? false) : false

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
      content_en: content_en ? sanitizeArticleHtml(content_en) : null,
      content_zh: content_zh ? sanitizeArticleHtml(content_zh) : null,
      content_ar: content_ar ? sanitizeArticleHtml(content_ar) : null,
      coverImageUrl: coverImageUrl ?? null,
      category: validCategory,
      isPublished: finalIsPublished,
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

  // Bài mới mà để nháp → chỉ invalidate admin list + titles cache, không
  // cần đánh cache /tin-tuc, /nghien-cuu, sitemap, feed (chưa có gì public).
  revalidateNewsSurfaces({ publicFacing: finalIsPublished })

  return NextResponse.json({ news }, { status: 201 })
}
