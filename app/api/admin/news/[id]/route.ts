import { NextResponse, after } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { sanitizeArticleHtml } from "@/lib/sanitize"
import { scoreSeo } from "@/lib/seo/score"
import { getPreviousTitles } from "@/lib/news-seo-cache"
import {
  collectNewsCloudinaryIds,
  destroyCloudinaryByPublicIds,
} from "@/lib/cloudinary-server"
import { autoTranslateNewsMissing } from "@/lib/news-auto-translate"

// Kéo lên 5 phút để `after()` auto-translate có đủ budget cho bài dài
// (content 10k chars × 3 locale). Vercel Pro/Hobby đều cho maxDuration=300s.
export const maxDuration = 300

/** Xem ghi chú ở `app/api/admin/news/route.ts`. */
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // GET để editor load bài — cần news:write (Ban Thư ký soạn/sửa) hoặc
  // admin:read. `admin:full` tự động match cả 2 qua `hasPermission`.
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "news:write") && !hasPermission(perms, "admin:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const news = await prisma.news.findUnique({ where: { id } })
  if (!news) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Fetch author info kèm response để editor preset selector. authorId
  // không có FK relation trong schema (legacy) → query rời tay.
  const author = news.authorId
    ? await prisma.user.findUnique({
        where: { id: news.authorId },
        select: { id: true, name: true, email: true, avatarUrl: true },
      })
    : null

  return NextResponse.json({ news, author })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "news:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // `isPublished` chỉ ai có news:publish mới flip được. Không có → strip
  // khỏi patch body bên dưới (trường cũ giữ nguyên).
  const canPublish = hasPermission(perms, "news:publish")

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
    // Flag từ NewsEditor: true → sau khi save, server schedule `after()`
    // để dịch các locale còn thiếu content dựa trên VI vừa lưu.
    autoTranslateMissing,
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
            : category === "BUSINESS"
              ? "BUSINESS"
              : category === "PRODUCT"
                ? "PRODUCT"
                : category === "EXTERNAL_NEWS"
                  ? "EXTERNAL_NEWS"
                  : category === "AGRICULTURE"
                    ? "AGRICULTURE"
                    : "GENERAL"
  if (body.template !== undefined) {
    data.template =
      body.template === "PHOTO"
        ? "PHOTO"
        : body.template === "VIDEO"
          ? "VIDEO"
          : "NORMAL"
  }
  if ("relatedCompanyId" in body) {
    data.relatedCompanyId = body.relatedCompanyId || null
  }
  if ("relatedProductId" in body) {
    data.relatedProductId = body.relatedProductId || null
  }
  // Phase 3.5: EXTERNAL_NEWS attribution. Pass-through nullable.
  if ("sourceName" in body) {
    data.sourceName = typeof body.sourceName === "string" && body.sourceName.trim()
      ? body.sourceName.trim()
      : null
  }
  if ("sourceUrl" in body) {
    data.sourceUrl = typeof body.sourceUrl === "string" && body.sourceUrl.trim()
      ? body.sourceUrl.trim()
      : null
  }
  if ("gallery" in body) {
    data.gallery = Array.isArray(body.gallery)
      ? body.gallery
          .filter((g: { url?: unknown }) => g && typeof g.url === "string")
          .map((g: { url: string; caption?: unknown }) => ({
            url: g.url,
            caption: typeof g.caption === "string" ? g.caption : "",
          }))
      : null
  }
  if (isPublished !== undefined && canPublish) data.isPublished = isPublished
  if (isPinned !== undefined) data.isPinned = isPinned
  if (publishedAt !== undefined)
    data.publishedAt = publishedAt ? new Date(publishedAt) : null
  // Author change: chỉ admin:full mới được. Validate user tồn tại.
  if ("authorId" in body && typeof body.authorId === "string" && body.authorId) {
    if (!hasPermission(perms, "admin:full")) {
      return NextResponse.json(
        { error: "Chỉ Admin mới được đổi tác giả" },
        { status: 403 },
      )
    }
    const exists = await prisma.user.findUnique({
      where: { id: body.authorId },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ error: "Tác giả không tồn tại" }, { status: 400 })
    }
    data.authorId = body.authorId
  }

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
  // Dùng cache (tag "news:titles"), loại trừ chính bài đang edit.
  const previousTitles = await getPreviousTitles(id)
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
    previousTitles,
    translatedLocaleCount,
  })
  data.seoScore = seoResult.legacyScore
  data.seoScoreDetail = seoResult as unknown as object

  const news = await prisma.news.update({ where: { id }, data })

  // Bài đã publish hoặc vừa publish lần đầu → cần invalidate mọi public
  // surface. Nếu draft-before + draft-after → content chưa bao giờ ra ngoài,
  // không cần chạm cache homepage/tin-tuc/sitemap/feed.
  const publicFacing = current.isPublished || news.isPublished
  revalidateNewsSurfaces({ publicFacing })

  // Dọn Cloudinary orphan: diff public_id giữa state cũ (current) và mới
  // (news). Ảnh bị replace cover hoặc bị xoá trong editor → destroy.
  // Fire-and-forget; sweep nền là safety net nếu lỗi.
  const oldIds = collectNewsCloudinaryIds(current)
  const newIds = collectNewsCloudinaryIds(news)
  const removed = [...oldIds].filter((id) => !newIds.has(id))
  if (removed.length > 0) {
    void destroyCloudinaryByPublicIds(removed)
      .then((r) =>
        console.log(
          `[news/${id}] cloudinary cleanup (patch): ${r.deleted} deleted, ${r.failed} failed`,
        ),
      )
      .catch((e) => console.error(`[news/${id}] cloudinary cleanup failed:`, e))
  }

  // Auto-translate missing locales trong nền. `after()` giữ function alive
  // tới maxDuration (300s) kể cả khi response đã trả, client đã rời trang.
  // Hàm helper snapshot VI tại thời điểm save + optimistic concurrency check
  // trước write — nếu user Save lại với VI khác, task cũ skip, task mới cover.
  if (autoTranslateMissing === true) {
    const snapshot = {
      title: news.title ?? "",
      excerpt: news.excerpt ?? "",
      content: news.content ?? "",
    }
    after(async () => {
      try {
        await autoTranslateNewsMissing({ newsId: id, expectedVi: snapshot })
      } catch (e) {
        console.error(`[news/${id}] auto-translate after() failed:`, e)
      }
    })
  }

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

  // Fetch state trước khi xoá: isPublished để biết có cần revalidate public
  // cache không, cover + content 4-locale để biết ảnh nào cần destroy trên
  // Cloudinary.
  const target = await prisma.news.findUnique({
    where: { id },
    select: {
      isPublished: true,
      coverImageUrl: true,
      content: true,
      content_en: true,
      content_zh: true,
      content_ar: true,
    },
  })
  await prisma.news.delete({ where: { id } })
  revalidateNewsSurfaces({ publicFacing: target?.isPublished === true })

  // Dọn ảnh trên Cloudinary. Fire-and-forget sau khi DB đã xoá —
  // nếu destroy fail, sweep nền (scripts/sweep-cloudinary-orphans.ts)
  // sẽ dọn orphan ở lần chạy tiếp.
  if (target) {
    const ids = collectNewsCloudinaryIds(target)
    if (ids.size > 0) {
      void destroyCloudinaryByPublicIds(ids)
        .then((r) =>
          console.log(
            `[news/${id}] cloudinary cleanup (delete): ${r.deleted} deleted, ${r.failed} failed`,
          ),
        )
        .catch((e) => console.error(`[news/${id}] cloudinary cleanup failed:`, e))
    }
  }

  return NextResponse.json({ success: true })
}
