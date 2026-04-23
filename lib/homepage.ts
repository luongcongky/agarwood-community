import "server-only"
import { unstable_cache } from "next/cache"
import { prisma } from "./prisma"
import type { PostCategory } from "@prisma/client"

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
} as const

/**
 * Href helper — route News item theo category.
 *  - GENERAL, SPONSORED_PRODUCT → /tin-tuc/[slug] (list + detail chung)
 *  - RESEARCH                    → /nghien-cuu/[slug]
 *  - LEGAL                       → /phap-ly (hub văn bản pháp quy)
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
    case "GENERAL":
    case "SPONSORED_PRODUCT":
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
 * Top 3 slots — VIP top theo authorPriority. Sticky, không rotate.
 */
export const getTopVipMemberPosts = unstable_cache(
  async () => {
    return prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        isPremium: true,
      },
      orderBy: [
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
 * ở DB. Filter + shuffle chạy ở JS (via `pickRotatingMembers`) để MemberRailV2
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

// ── Section 5+6: Tin doanh nghiệp / Tin sản phẩm mới nhất ────────────────────

export function getLatestPostsByCategory(category: PostCategory, take: number = 6) {
  return getLatestPostsByCategoryCached(category, take)
}

const getLatestPostsByCategoryCached = unstable_cache(
  async (category: PostCategory, take: number) => {
    return prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        isPremium: true, // CHỈ VIP lên trang chủ (section 5+6)
        category,
      },
      orderBy: [
        { authorPriority: "desc" },
        { createdAt: "desc" },
      ],
      take,
      select: POST_CARD_SELECT,
    })
  },
  ["homepage_latest_by_category"],
  { revalidate: 300, tags: ["homepage", "posts"] },
)

// ── Multimedia Section (v2): ảnh bộ sưu tập + video YouTube ──────────────────

const MULTIMEDIA_CARD_SELECT = {
  id: true,
  type: true,
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
  imageUrls: true,
  youtubeId: true,
  publishedAt: true,
  isPinned: true,
} as const

export const getLatestMultimedia = unstable_cache(
  async (take = 3) => {
    return prisma.multimedia.findMany({
      where: { isPublished: true },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take,
      select: MULTIMEDIA_CARD_SELECT,
    })
  },
  ["homepage_multimedia"],
  { revalidate: 300, tags: ["homepage", "multimedia"] },
)

/**
 * Filtered by type — dùng cho tabs "Hình ảnh" vs "Video" trong section
 * MULTIMEDIA trên /v2. Fetch song song cả 2 type để user switch không cần
 * round-trip server.
 */
export const getMultimediaByType = unstable_cache(
  async (type: "PHOTO_COLLECTION" | "VIDEO", take = 3) => {
    return prisma.multimedia.findMany({
      where: { isPublished: true, type },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take,
      select: MULTIMEDIA_CARD_SELECT,
    })
  },
  ["homepage_multimedia_by_type"],
  { revalidate: 300, tags: ["homepage", "multimedia"] },
)

// ── Type exports cho components ──────────────────────────────────────────────

export type HomepageNewsItem = Awaited<ReturnType<typeof getAssociationNews>>[number]
export type HomepagePost = Awaited<ReturnType<typeof getTopVipMemberPosts>>[number]
export type HomepageProduct = Awaited<ReturnType<typeof getFeaturedProductsForHomepage>>[number]
export type HomepageMultimediaItem = Awaited<ReturnType<typeof getLatestMultimedia>>[number]
