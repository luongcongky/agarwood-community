/**
 * Helpers cho 4 trang list editorial (/tin-tuc, /nghien-cuu, /khuyen-nong,
 * /tin-bao-chi). Phase 3.7 round 4 (2026-04): Post curated bởi admin
 * (newsCategories) hiện inline trong "Tin mới nhất" sort theo date desc,
 * thay vì section "Bài đóng góp từ hội viên" tách riêng cuối trang.
 *
 * Hero/sub-hero giữ nguyên News-only (editorial layout) — chỉ phần latest
 * list mix Posts với News.
 */

export type ListLikeNewsItem = {
  id: string
  title: string
  title_en: string | null
  title_zh: string | null
  title_ar: string | null
  slug: string
  excerpt: string | null
  excerpt_en: string | null
  excerpt_zh: string | null
  excerpt_ar: string | null
  coverImageUrl: string | null
  isPinned: boolean
  publishedAt: Date | null
  source?: "news" | "post"
}

export type CuratedPostInput = {
  id: string
  title: string | null
  content: string
  imageUrls: string[]
  coverImageUrl: string | null
  createdAt: Date | string
}

function stripPlain(html: string, max: number): string {
  const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  if (plain.length <= max) return plain
  return plain.slice(0, max).replace(/\s+\S*$/, "") + "…"
}

function extractFirstCloudinaryImage(content: string): string | null {
  const m = content.match(/https:\/\/res\.cloudinary\.com\/[^"'\s)]+/)
  return m ? m[0] : null
}

export function postToListItem<T extends ListLikeNewsItem>(p: CuratedPostInput): T {
  return {
    id: p.id,
    title: p.title || stripPlain(p.content, 80),
    title_en: null,
    title_zh: null,
    title_ar: null,
    slug: p.id,
    excerpt: stripPlain(p.content, 160),
    excerpt_en: null,
    excerpt_zh: null,
    excerpt_ar: null,
    coverImageUrl:
      p.coverImageUrl ||
      p.imageUrls?.[0] ||
      extractFirstCloudinaryImage(p.content),
    isPinned: false,
    publishedAt:
      p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt),
    source: "post",
  } as unknown as T
}

/** Merge News (already sorted) + Posts theo publishedAt desc, giữ pinned News
 *  trên cùng. Posts có isPinned=false → chỉ mix với non-pinned. */
export function mergeByDateDesc<T extends ListLikeNewsItem>(
  newsItems: T[],
  posts: CuratedPostInput[],
): T[] {
  const news = newsItems.map((n) => ({ ...n, source: "news" as const }))
  const postItems = posts.map((p) => postToListItem<T>(p))
  return [...news, ...postItems].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    const da = a.publishedAt
      ? a.publishedAt instanceof Date
        ? a.publishedAt.getTime()
        : new Date(a.publishedAt).getTime()
      : 0
    const db = b.publishedAt
      ? b.publishedAt instanceof Date
        ? b.publishedAt.getTime()
        : new Date(b.publishedAt).getTime()
      : 0
    return db - da
  })
}
