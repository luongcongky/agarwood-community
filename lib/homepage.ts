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

export const getAssociationNews = unstable_cache(
  async () => {
    return prisma.news.findMany({
      where: { isPublished: true },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        publishedAt: true,
        isPinned: true,
      },
    })
  },
  ["homepage_news"],
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
 * Pool cho slot rotate — VIP thường + non-VIP, weighted random theo authorPriority.
 * Lấy pool 50 bài, shuffle deterministic theo bucket 5 phút, trả về 5 bài.
 *
 * Loại trừ các bài top VIP đã hiển thị ở slot trên (`excludeIds`).
 */
export async function getRotatingMemberPosts(excludeIds: string[]) {
  const bucket = Math.floor(Date.now() / 300_000) // 5-min bucket
  return getRotatingMemberPostsCached(bucket, excludeIds)
}

const getRotatingMemberPostsCached = unstable_cache(
  async (_bucket: number, excludeIds: string[]) => {
    void _bucket // chỉ dùng làm cache key
    const pool = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: excludeIds.length > 0 ? excludeIds : ["__none__"] },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
      select: POST_CARD_SELECT,
    })

    // Weighted random shuffle: weight = authorPriority + 1 (đảm bảo > 0)
    const seed = _bucket
    const rng = mulberry32(seed)
    const weighted = pool
      .map((p) => ({
        post: p,
        score: (p.authorPriority + 1) * (0.5 + rng()),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.post)

    return weighted
  },
  ["homepage_rotating_members"],
  { revalidate: 300, tags: ["homepage", "posts"] },
)

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
        slug: true,
        imageUrls: true,
        priceRange: true,
        category: true,
        certStatus: true,
        owner: { select: { name: true } },
        company: { select: { name: true, slug: true } },
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

// ── Type exports cho components ──────────────────────────────────────────────

export type HomepageNewsItem = Awaited<ReturnType<typeof getAssociationNews>>[number]
export type HomepagePost = Awaited<ReturnType<typeof getTopVipMemberPosts>>[number]
export type HomepageProduct = Awaited<ReturnType<typeof getFeaturedProductsForHomepage>>[number]
