import "server-only"
import { unstable_cache } from "next/cache"
import { prisma } from "./prisma"
import type { PostCategory, NewsCategory } from "@prisma/client"
import { newsToMultimedia } from "./multimedia-from-news"

/**
 * Data fetchers cho trang chủ báo chí (Phase 3).
 *
 * Nguyên tắc:
 *  - Tất cả query "lên trang chủ" phải filter `isPremium: true` (chỉ bài VIP)
 *    NGOẠI TRỪ MemberNewsRail (Section 2) — section này show cả non-VIP ở slot rotate.
 *  - Section 1 (Tin Hội) dùng `News` model do admin đăng — không phải Post.
 *  - Section 5+6 lọc theo `category` (NEWS / PRODUCT).
 */

const POST_CARD_SELECT = {
  id: true,
  title: true,
  content: true,
  imageUrls: true,
  // Phase 3.7 round 4 (2026-04): coverImageUrl explicit thumbnail 16:9.
  // Fallback ở UI: coverImageUrl > imageUrls[0] > extract from content > placeholder.
  coverImageUrl: true,
  category: true,
  isPremium: true,
  authorPriority: true,
  createdAt: true,
  viewCount: true,
  author: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      role: true,
      company: { select: { name: true, slug: true } },
    },
  },
  // certStatus để áp feed-sort algo cho homepage Tin SP section.
  product: { select: { certStatus: true } },
} as const

// ── Section 1: Tin tức Hội ────────────────────────────────────────────────────

const NEWS_CARD_SELECT = {
  id: true,
  title: true,
  title_en: true,
  title_zh: true,
  title_ar: true,
  slug: true,
  excerpt: true,
  excerpt_en: true,
  excerpt_zh: true,
  excerpt_ar: true,
  coverImageUrl: true,
  publishedAt: true,
  isPinned: true,
  category: true, // để href helper route theo category
  // Phase 3.7 round 4 (2026-04): cần template + gallery để derive thumbnail
  // fallback (YouTube thumb cho VIDEO, gallery[0] cho PHOTO) khi card không
  // có coverImageUrl explicit. Xem newsCoverImage() ở multimedia-from-news.ts.
  template: true,
  gallery: true,
} as const

/**
 * Href helper — route News item theo category.
 *  - GENERAL, SPONSORED_PRODUCT, BUSINESS, PRODUCT → /tin-tuc/[slug]
 *  - RESEARCH                                       → /nghien-cuu/[slug]
 *  - LEGAL                                          → /phap-ly (hub)
 *
 * Phase 3.3 (2026-04): BUSINESS + PRODUCT thêm cùng route /tin-tuc.
 *
 * LEGAL đặc biệt: 2 slug cố định chinh-sach-bao-mat / dieu-khoan-su-dung có
 * trang riêng /privacy /terms, nhưng từ section "Tin Hội" ta đều route về
 * /phap-ly để user browse toàn bộ văn bản pháp quy cùng chỗ.
 */
export function newsHref(category: string, slug: string): string {
  switch (category) {
    case "RESEARCH":
      return `/nghien-cuu/${slug}`
    case "LEGAL":
      return "/phap-ly"
    // Phase 3.5 (2026-04): 2 surface mới — tin báo chí ngoài + khuyến nông.
    case "EXTERNAL_NEWS":
      return `/tin-bao-chi/${slug}`
    case "AGRICULTURE":
      return `/khuyen-nong/${slug}`
    case "GENERAL":
    case "SPONSORED_PRODUCT":
    case "BUSINESS":
    case "PRODUCT":
    default:
      return `/tin-tuc/${slug}`
  }
}

export const getAssociationNews = unstable_cache(
  async () => {
    // Tất cả 4 category đổ chung vào section "Tin Hội" theo yêu cầu customer.
    // Trùng lặp với /nghien-cuu section là có chủ đích — RESEARCH quan trọng
    // xuất hiện ở cả 2 nơi. Click-through dùng newsHref() route đúng loại.
    return prisma.news.findMany({
      where: { isPublished: true },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 7,
      select: NEWS_CARD_SELECT,
    })
  },
  ["homepage_news"],
  { revalidate: 300, tags: ["homepage", "news"] },
)

// ── Section 3b: Bài nghiên cứu mới ──────────────────────────────────────────
// News với category=RESEARCH — hiển thị grid 3 cột tương tự LatestPostsSection.

export const getLatestResearchNews = unstable_cache(
  async (take = 3) => {
    return prisma.news.findMany({
      where: { isPublished: true, category: "RESEARCH" },
      orderBy: [{ publishedAt: "desc" }],
      take,
      select: NEWS_CARD_SELECT,
    })
  },
  ["homepage_research"],
  { revalidate: 300, tags: ["homepage", "news"] },
)

// ── Section 2: Bản tin hội viên (right rail) ─────────────────────────────────

/**
 * Top 3 slots — bài được admin đẩy lên đứng trước, tiếp theo VIP top theo
 * authorPriority. `isPromoted` = admin đã chủ động gắn cờ (qua menu feed
 * hoặc qua việc duyệt promotion-request từ owner).
 */
export const getTopVipMemberPosts = unstable_cache(
  async () => {
    return prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        // Mặc định chỉ VIP post lên homepage. Nếu admin chủ động
        // `isPromoted=true` (qua menu feed hoặc duyệt promotion-request)
        // thì override — bài được feature bất kể tier tác giả.
        OR: [{ isPremium: true }, { isPromoted: true }],
      },
      orderBy: [
        { isPromoted: "desc" },
        { authorPriority: "desc" },
        { createdAt: "desc" },
      ],
      take: 3,
      select: POST_CARD_SELECT,
    })
  },
  ["homepage_top_vip_members"],
  { revalidate: 300, tags: ["homepage", "posts"] },
)

/**
 * Pool cho slot rotate — 50 bài VIP+non-VIP mới nhất, KHÔNG filter excludeIds
 * ở DB. Filter + shuffle chạy ở JS (via `pickRotatingMembers`) để MemberRail
 * có thể fetch pool + top song song (bỏ serialization cũ: top xong → pool).
 */
export function getMemberPostsPool() {
  const bucket = Math.floor(Date.now() / 300_000) // 5-min bucket
  return getMemberPostsPoolCached(bucket)
}

const getMemberPostsPoolCached = unstable_cache(
  async (_bucket: number) => {
    void _bucket
    return prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
      select: POST_CARD_SELECT,
    })
  },
  ["homepage_member_posts_pool"],
  { revalidate: 300, tags: ["homepage", "posts"] },
)

/** Filter pool exclude top IDs + weighted random theo authorPriority.
 *  Shuffle deterministic theo bucket 5 phút để "xoay vòng" slot. */
export function pickRotatingMembers(
  pool: HomepagePost[],
  excludeIds: string[],
  count: number = 6,
): HomepagePost[] {
  const bucket = Math.floor(Date.now() / 300_000)
  const rng = mulberry32(bucket)
  const excludeSet = new Set(excludeIds)
  return pool
    .filter((p) => !excludeSet.has(p.id))
    .map((p) => ({
      post: p,
      score: (p.authorPriority + 1) * (0.5 + rng()),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.post)
}

/** Backward-compat wrapper cho code cũ dùng `getRotatingMemberPosts(ids)`.
 *  Serial (pool then filter) — caller mới nên dùng getMemberPostsPool +
 *  pickRotatingMembers để fetch parallel. */
export async function getRotatingMemberPosts(excludeIds: string[]) {
  const pool = await getMemberPostsPool()
  return pickRotatingMembers(pool, excludeIds)
}

// Mulberry32 PRNG — small, fast, deterministic
function mulberry32(seed: number) {
  let a = seed | 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Section 3: Sản phẩm tiêu biểu (carousel) ─────────────────────────────────

export const getFeaturedProductsForHomepage = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: {
        isFeatured: true,
        isPublished: true,
        owner: { role: { in: ["VIP", "ADMIN"] } },
      },
      orderBy: [
        { featuredOrder: "asc" },
        { createdAt: "desc" },
      ],
      take: 12,
      select: {
        id: true,
        name: true,
        name_en: true,
        name_zh: true,
        name_ar: true,
        slug: true,
        imageUrls: true,
        priceRange: true,
        category: true,
        certStatus: true,
        owner: { select: { name: true } },
        company: { select: { name: true, name_en: true, name_zh: true, name_ar: true, slug: true } },
      },
    })
  },
  ["homepage_featured_products"],
  { revalidate: 600, tags: ["homepage", "products"] },
)

// ── Section "Tin doanh nghiệp / Tin sản phẩm mới nhất" — MERGED ─────────────
// Phase 3.3 (2026-04, Q0=C decision): mỗi section gộp cả Post (feed VIP) +
// News (admin đăng) cho đồng category, sort theo date desc, take N. Trước đây
// chỉ pull từ Post → admin News kg lên homepage. Giờ unified shape, click
// route đúng nguồn (/bai-viet vs /tin-tuc).

export type MergedFeedItem = {
  /** Unique key dùng cho React: prefix theo nguồn để Post.id và News.id
   *  không collide trong cùng list. */
  id: string
  /** Full path đã rewrite — Post → /bai-viet/{id}, News → /tin-tuc/{slug}. */
  href: string
  /** Source tag — useful cho analytics + có thể debug. */
  source: "post" | "news"
  title: string
  title_en: string | null
  title_zh: string | null
  title_ar: string | null
  coverUrl: string | null
  /** Date dùng để sort + render. Post = createdAt, News = publishedAt. */
  date: Date | string | null
  excerpt: string | null
  excerpt_en: string | null
  excerpt_zh: string | null
  excerpt_ar: string | null
}

/** Strip HTML tags + collapse whitespace — fallback khi Post không có title. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

/** Best-effort: extract Cloudinary URL đầu trong content khi imageUrls rỗng. */
function extractFirstImage(content: string): string | null {
  const m = content.match(/https:\/\/res\.cloudinary\.com\/[^"'\s)]+/)
  return m ? m[0] : null
}

export function getMergedFeed(
  postCategory: PostCategory,
  newsCategory: NewsCategory,
  take = 6,
) {
  return getMergedFeedCached(postCategory, newsCategory, take)
}

const getMergedFeedCached = unstable_cache(
  async (
    postCategory: PostCategory,
    newsCategory: NewsCategory,
    take: number,
  ): Promise<MergedFeedItem[]> => {
    // Overfetch (take * 2) mỗi nguồn — sau khi merge + sort, slice về take.
    // Cần overfetch vì 1 nguồn có thể "thắng" hết slot khi date của nguồn
    // kia tụt dốc (vd Post đăng ầm ầm, News thưa thớt).
    const [posts, news] = await Promise.all([
      prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          // VIP/INFINITE mặc định (isPremium); admin promote override
          // (isPromoted); ADMIN-authored bao gồm vì admin post = curated
          // content. Phase 3.7 round 4 (2026-04).
          OR: [
            { isPremium: true },
            { isPromoted: true },
            { author: { role: "ADMIN" } },
          ],
          category: postCategory,
        },
        // Pool selection: orderBy createdAt desc + overfetch để feed-sort
        // ở merge step có đủ candidate.
        orderBy: { createdAt: "desc" },
        take: take * 4, // overfetch nhiều hơn để comparator JS có dải candidate
        select: POST_CARD_SELECT,
      }),
      prisma.news.findMany({
        where: {
          isPublished: true,
          template: "NORMAL", // Q1=B: PHOTO/VIDEO đẩy /multimedia
          category: newsCategory,
        },
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        take: take * 4,
        select: NEWS_CARD_SELECT,
      }),
    ])

    // Phase 3.7 round 4 (2026-04): apply feed-sort algo (by-day VN → cert
    // PRODUCT only → priority → date) cho merged list để homepage Tin SP/DN
    // section consistent với /vi/feed?category. News được treat như post
    // không có cert + priority=0 (thua cert/high-priority products cùng ngày).
    type Sortable = MergedFeedItem & {
      _meta: { dateMs: number; cert: boolean; priority: number }
    }

    const VN_TZ_OFFSET_MS = 7 * 60 * 60 * 1000
    const startOfDayVN = (ms: number) => {
      const vnLocal = ms + VN_TZ_OFFSET_MS
      return Math.floor(vnLocal / 86400000) * 86400000 - VN_TZ_OFFSET_MS
    }

    const postItems: Sortable[] = posts.map((p) => ({
      id: `post-${p.id}`,
      href: `/bai-viet/${p.id}`,
      source: "post",
      title: p.title || stripHtml(p.content).slice(0, 80),
      title_en: null,
      title_zh: null,
      title_ar: null,
      // Fallback chain: coverImageUrl explicit > imageUrls[0] > first
      // image extracted from content. Nếu cả 3 null, UI fallback placeholder.
      coverUrl: p.coverImageUrl || p.imageUrls?.[0] || extractFirstImage(p.content),
      date: p.createdAt,
      excerpt: stripHtml(p.content).slice(0, 200) || null,
      excerpt_en: null,
      excerpt_zh: null,
      excerpt_ar: null,
      _meta: {
        dateMs: p.createdAt.getTime(),
        cert: p.product?.certStatus === "APPROVED",
        priority: p.authorPriority,
      },
    }))

    const newsItems: Sortable[] = news.map((n) => ({
      id: `news-${n.id}`,
      href: newsHref(n.category, n.slug),
      source: "news",
      title: n.title,
      title_en: n.title_en,
      title_zh: n.title_zh,
      title_ar: n.title_ar,
      coverUrl: n.coverImageUrl,
      date: n.publishedAt,
      excerpt: n.excerpt,
      excerpt_en: n.excerpt_en,
      excerpt_zh: n.excerpt_zh,
      excerpt_ar: n.excerpt_ar,
      _meta: {
        dateMs: n.publishedAt ? n.publishedAt.getTime() : 0,
        cert: false, // News không có concept cert
        priority: 0, // News không có authorPriority — thua mọi VIP post tier
      },
    }))

    const includeCertTier = postCategory === "PRODUCT"
    return [...postItems, ...newsItems]
      .sort((a, b) => {
        // Tier 1: day desc (VN tz)
        const dayA = startOfDayVN(a._meta.dateMs)
        const dayB = startOfDayVN(b._meta.dateMs)
        if (dayA !== dayB) return dayB - dayA
        // Tier 2 (PRODUCT only): cert APPROVED first
        if (includeCertTier && a._meta.cert !== b._meta.cert) {
          return a._meta.cert ? -1 : 1
        }
        // Tier 3: priority desc
        if (a._meta.priority !== b._meta.priority) {
          return b._meta.priority - a._meta.priority
        }
        // Tier 4: date desc tie-break
        return b._meta.dateMs - a._meta.dateMs
      })
      .slice(0, take)
      // Strip _meta khỏi return value (chỉ internal sort use)
      .map(({ _meta, ...item }) => {
        void _meta
        return item
      })
  },
  ["homepage_merged_feed"],
  { revalidate: 300, tags: ["homepage", "posts", "news"] },
)

// ── Multimedia Section: ảnh bộ sưu tập + video YouTube ──────────────────────
// Phase 3.7 round 4 (2026-04): bảng Multimedia đã merge vào News (template
// PHOTO/VIDEO). Đọc từ News, adapt qua newsToMultimedia() để giữ shape data
// mà MultimediaSection.tsx + UI cũ đang dùng.

const MULTIMEDIA_NEWS_SELECT = {
  id: true,
  template: true,
  slug: true,
  title: true,
  title_en: true,
  title_zh: true,
  title_ar: true,
  excerpt: true,
  excerpt_en: true,
  excerpt_zh: true,
  excerpt_ar: true,
  coverImageUrl: true,
  gallery: true,
  publishedAt: true,
  isPinned: true,
} as const

export const getLatestMultimedia = unstable_cache(
  async (take = 3) => {
    const rows = await prisma.news.findMany({
      where: { isPublished: true, template: { in: ["PHOTO", "VIDEO"] } },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take,
      select: MULTIMEDIA_NEWS_SELECT,
    })
    return rows.flatMap((n) => {
      const mapped = newsToMultimedia(n)
      return mapped ? [mapped] : []
    })
  },
  ["homepage_multimedia"],
  { revalidate: 300, tags: ["homepage", "multimedia", "news"] },
)

/**
 * Filtered by type — dùng cho tabs "Hình ảnh" vs "Video" trong section
 * MULTIMEDIA trên trang chủ. Fetch song song cả 2 type để user switch không
 * cần round-trip server.
 */
export const getMultimediaByType = unstable_cache(
  async (type: "PHOTO_COLLECTION" | "VIDEO", take = 3) => {
    const template = type === "PHOTO_COLLECTION" ? "PHOTO" : "VIDEO"
    const rows = await prisma.news.findMany({
      where: { isPublished: true, template },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take,
      select: MULTIMEDIA_NEWS_SELECT,
    })
    return rows.flatMap((n) => {
      const mapped = newsToMultimedia(n)
      return mapped ? [mapped] : []
    })
  },
  ["homepage_multimedia_by_type"],
  { revalidate: 300, tags: ["homepage", "multimedia", "news"] },
)

// ── Type exports cho components ──────────────────────────────────────────────

export type HomepageNewsItem = Awaited<ReturnType<typeof getAssociationNews>>[number]
export type HomepagePost = Awaited<ReturnType<typeof getTopVipMemberPosts>>[number]
export type HomepageProduct = Awaited<ReturnType<typeof getFeaturedProductsForHomepage>>[number]
export type HomepageMultimediaItem = Awaited<ReturnType<typeof getLatestMultimedia>>[number]
