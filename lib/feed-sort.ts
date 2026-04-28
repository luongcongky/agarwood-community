import "server-only"
import { prisma } from "./prisma"
import type { PostCategory } from "@prisma/client"

/**
 * Phase 3.7 round 4 (2026-04 — customer feedback): thuật toán sort cho
 * feed PRODUCT + NEWS. Khác với feed chung (isPromoted+priority+date).
 *
 * Common tiers (apply cho cả 2):
 *   1. Ngày tạo (theo TZ Asia/Ho_Chi_Minh) DESC — bài hôm nay > hôm qua
 *   2. (PRODUCT only) Trong cùng ngày: SP đã chứng nhận (certStatus=APPROVED) trước
 *   3. authorPriority DESC (DN cống hiến nhiều)
 *   4. createdAt DESC (tie-break)
 *
 * Admin `isPromoted` KHÔNG override day grouping (admin đã có filter PINNED
 * riêng để kiểm soát ghim).
 */

const VN_TZ_OFFSET_MS = 7 * 60 * 60 * 1000

function startOfDayVN(date: Date): number {
  const utc = date.getTime()
  const vnLocal = utc + VN_TZ_OFFSET_MS
  const vnDayStart = Math.floor(vnLocal / 86400000) * 86400000
  return vnDayStart - VN_TZ_OFFSET_MS
}

type SortablePost = {
  id: string
  createdAt: Date
  authorPriority: number
  product: { certStatus: string } | null
}

/** Comparator chính. `includeCertTier=true` → áp tier 2 cert priority. */
export function compareFeedPosts(
  a: SortablePost,
  b: SortablePost,
  includeCertTier: boolean,
): number {
  // Tier 1: ngày desc (giờ VN)
  const dayA = startOfDayVN(a.createdAt)
  const dayB = startOfDayVN(b.createdAt)
  if (dayA !== dayB) return dayB - dayA

  // Tier 2 (PRODUCT only): certStatus=APPROVED trước
  if (includeCertTier) {
    const certA = a.product?.certStatus === "APPROVED" ? 0 : 1
    const certB = b.product?.certStatus === "APPROVED" ? 0 : 1
    if (certA !== certB) return certA - certB
  }

  // Tier 3: authorPriority desc (DN đóng góp nhiều)
  if (a.authorPriority !== b.authorPriority) {
    return b.authorPriority - a.authorPriority
  }

  // Tier 4: createdAt desc (newest first)
  return b.createdAt.getTime() - a.createdAt.getTime()
}

/**
 * Trả về list ID của posts đã sort theo thuật toán + cursor-paginated.
 *
 * Strategy: fetch all matching posts (chỉ field cần sort) → sort JS → áp
 * cursor (find last id, slice next N). Dataset nhỏ (<1000 posts/category dự
 * kiến) nên cost ~200-500 row-read mỗi page request — OK.
 *
 * Caller hydrate full data qua Prisma findMany + idMap reorder.
 */
export async function getSortedFeedPostIds(opts: {
  category: PostCategory
  userId: string | null
  certifiedOnly?: boolean
  cursor?: string | null
  take: number
}): Promise<string[]> {
  const { category, userId, certifiedOnly = false, cursor = null, take } = opts
  const includeCertTier = category === "PRODUCT"

  const where = userId
    ? {
        category,
        OR: [
          { status: "PUBLISHED" as const },
          { status: "LOCKED" as const, moderationNote: null },
          { status: "PENDING" as const, authorId: userId },
          { status: "LOCKED" as const, moderationNote: { not: null }, authorId: userId },
        ],
        ...(certifiedOnly && includeCertTier
          ? { product: { is: { certStatus: "APPROVED" as const } } }
          : {}),
      }
    : {
        category,
        OR: [
          { status: "PUBLISHED" as const },
          { status: "LOCKED" as const, moderationNote: null },
        ],
        ...(certifiedOnly && includeCertTier
          ? { product: { is: { certStatus: "APPROVED" as const } } }
          : {}),
      }

  const all = await prisma.post.findMany({
    where,
    select: {
      id: true,
      createdAt: true,
      authorPriority: true,
      product: { select: { certStatus: true } },
    },
  })

  all.sort((a, b) => compareFeedPosts(a, b, includeCertTier))

  let startIdx = 0
  if (cursor) {
    const idx = all.findIndex((p) => p.id === cursor)
    if (idx >= 0) startIdx = idx + 1
  }
  return all.slice(startIdx, startIdx + take).map((p) => p.id)
}
