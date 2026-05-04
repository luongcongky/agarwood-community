import type { PrismaClient } from "@prisma/client"

/**
 * Pure URL helpers cho Cloudinary — không import cloudinary SDK, không
 * `server-only` marker → an toàn import từ client component, server component,
 * route handler, và script CLI (scripts/sweep-cloudinary-orphans.ts).
 *
 * Destroy logic (gọi Cloudinary API) nằm ở `lib/cloudinary-server.ts`.
 */

/** Regex match URL Cloudinary đầy đủ trong HTML. Dừng ở quote/space/paren. */
const CLOUDINARY_URL_RE = /https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/[^"'\s)]+/g

/**
 * Trích public_id từ 1 URL Cloudinary.
 *
 * URL có dạng:
 *   https://res.cloudinary.com/{cloud}/image/upload/[{transform}/][v{version}/]{folder}/{file}.{ext}
 *
 * - transform (optional): segment đầu có dấu phẩy (`c_fill,w_800`) hoặc bắt
 *   đầu bằng param `{a}_…` (`f_auto`, `q_auto`) — strip bỏ. Không nhầm với
 *   `v{digits}` version vì version khớp `^v\d+$` không có underscore.
 * - v{version} (optional): strip.
 * - extension: strip.
 *
 * Kết quả:
 *   /upload/v123/tin-tuc/04-2026/abc.jpg       → tin-tuc/04-2026/abc
 *   /upload/c_limit,w_800/tin-tuc/abc.jpg      → tin-tuc/abc
 *   /upload/f_auto,q_auto/v1/tin-tuc/abc.png   → tin-tuc/abc
 */
export function extractPublicId(url: string): string | null {
  const m = url.match(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(.+)$/)
  if (!m) return null
  let rest = m[1]
  const firstSeg = rest.split("/")[0]
  if (firstSeg.includes(",") || (/^[a-z]_/i.test(firstSeg) && !/^v\d+$/.test(firstSeg))) {
    rest = rest.substring(firstSeg.length + 1)
  }
  rest = rest.replace(/^v\d+\//, "")
  rest = rest.replace(/\.[a-zA-Z0-9]+$/, "")
  return rest || null
}

/** Scan mọi URL Cloudinary trong 1 chuỗi HTML (dedupe theo URL string). */
export function extractCloudinaryUrls(html: string | null | undefined): string[] {
  if (!html) return []
  const matches = html.match(CLOUDINARY_URL_RE) ?? []
  return [...new Set(matches)]
}

/**
 * Tập public_id Cloudinary được tham chiếu trong 1 news record — cover +
 * content (vi/en/zh/ar). Dùng cho DELETE (xoá toàn bộ) + PATCH (diff) +
 * sweep nền (đối chiếu với toàn bộ asset trong folder).
 */
export function collectNewsCloudinaryIds(news: {
  coverImageUrl?: string | null
  content?: string | null
  content_en?: string | null
  content_zh?: string | null
  content_ar?: string | null
}): Set<string> {
  const ids = new Set<string>()
  if (news.coverImageUrl) {
    const id = extractPublicId(news.coverImageUrl)
    if (id) ids.add(id)
  }
  for (const html of [news.content, news.content_en, news.content_zh, news.content_ar]) {
    for (const url of extractCloudinaryUrls(html)) {
      const id = extractPublicId(url)
      if (id) ids.add(id)
    }
  }
  return ids
}

/**
 * Tập hợp mọi public_id Cloudinary đang được tham chiếu trong toàn bộ database.
 * Dùng cho scripts/sweep-cloudinary-orphans.ts để tránh xoá nhầm ảnh của
 * các model khác ngoài News.
 */
export async function collectAllCloudinaryIds(prisma: PrismaClient): Promise<Set<string>> {
  const allIds = new Set<string>()
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  // 1. News (Cover + Content + Gallery)
  // News không có soft-delete, lấy tất cả.
  const news = await prisma.news.findMany({
    select: {
      coverImageUrl: true,
      content: true, content_en: true, content_zh: true, content_ar: true,
      gallery: true
    }
  })
  for (const n of news) {
    for (const id of collectNewsCloudinaryIds(n)) allIds.add(id)
    // Gallery JSON: [{url, caption}]
    if (Array.isArray(n.gallery)) {
      const gallery = n.gallery as Array<{ url?: string }>
      for (const item of gallery) {
        if (typeof item?.url === "string") {
          const id = extractPublicId(item.url)
          if (id) allIds.add(id)
        }
      }
    }
  }

  // 2. Product (imageUrls + badgeUrl + revisions + description HTML)
  // Product không có soft-delete.
  const products = await prisma.product.findMany({
    select: { imageUrls: true, badgeUrl: true, description: true }
  })
  for (const p of products) {
    for (const url of p.imageUrls) {
      const id = extractPublicId(url)
      if (id) allIds.add(id)
    }
    if (p.badgeUrl) {
      const id = extractPublicId(p.badgeUrl)
      if (id) allIds.add(id)
    }
    if (p.description) {
      for (const url of extractCloudinaryUrls(p.description)) {
        const id = extractPublicId(url)
        if (id) allIds.add(id)
      }
    }
  }
  const pRevisions = await prisma.productRevision.findMany({ select: { imageUrls: true, description: true } })
  for (const r of pRevisions) {
    for (const url of r.imageUrls) {
      const id = extractPublicId(url)
      if (id) allIds.add(id)
    }
    if (r.description) {
      for (const url of extractCloudinaryUrls(r.description)) {
        const id = extractPublicId(url)
        if (id) allIds.add(id)
      }
    }
  }

  // 3. Post (imageUrls + coverImageUrl + content + revisions)
  // Post có status DELETED. Chỉ bỏ qua nếu đã xoá > 3 tháng.
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { status: { not: "DELETED" } },
        { updatedAt: { gte: threeMonthsAgo } }
      ]
    },
    select: { imageUrls: true, coverImageUrl: true, content: true }
  })
  for (const p of posts) {
    for (const url of p.imageUrls) {
      const id = extractPublicId(url)
      if (id) allIds.add(id)
    }
    if (p.coverImageUrl) {
      const id = extractPublicId(p.coverImageUrl)
      if (id) allIds.add(id)
    }
    for (const url of extractCloudinaryUrls(p.content)) {
      const id = extractPublicId(url)
      if (id) allIds.add(id)
    }
  }
  const postRevisions = await prisma.postRevision.findMany({ select: { imageUrls: true, content: true } })
  for (const r of postRevisions) {
    for (const url of r.imageUrls) {
      const id = extractPublicId(url)
      if (id) allIds.add(id)
    }
    for (const url of extractCloudinaryUrls(r.content)) {
      const id = extractPublicId(url)
      if (id) allIds.add(id)
    }
  }

  // 4. Comment (content HTML)
  // Comment có soft-delete (deletedAt). Chỉ bỏ qua nếu đã xoá > 3 tháng.
  const comments = await prisma.comment.findMany({
    where: {
      OR: [
        { deletedAt: null },
        { deletedAt: { gte: threeMonthsAgo } }
      ]
    },
    select: { content: true }
  })
  for (const c of comments) {
    for (const url of extractCloudinaryUrls(c.content)) {
      const id = extractPublicId(url)
      if (id) allIds.add(id)
    }
  }

  // 4. Company (logoUrl + coverImageUrl + gallery)
  const companies = await prisma.company.findMany({
    select: { logoUrl: true, coverImageUrl: true }
  })
  for (const c of companies) {
    if (c.logoUrl) {
      const id = extractPublicId(c.logoUrl)
      if (id) allIds.add(id)
    }
    if (c.coverImageUrl) {
      const id = extractPublicId(c.coverImageUrl)
      if (id) allIds.add(id)
    }
  }
  const cGallery = await prisma.companyGalleryImage.findMany({ select: { imageUrl: true } })
  for (const g of cGallery) {
    const id = extractPublicId(g.imageUrl)
    if (id) allIds.add(id)
  }

  // 5. User (avatarUrl)
  const users = await prisma.user.findMany({ select: { avatarUrl: true } })
  for (const u of users) {
    if (u.avatarUrl) {
      const id = extractPublicId(u.avatarUrl)
      if (id) allIds.add(id)
    }
  }

  // 6. Others (Hero, Banner, Partner, Leader, MediaOrder)
  const heroes = await prisma.heroImage.findMany({ select: { imageUrl: true } })
  for (const h of heroes) {
    const id = extractPublicId(h.imageUrl)
    if (id) allIds.add(id)
  }
  const banners = await prisma.banner.findMany({ select: { imageUrl: true } })
  for (const b of banners) {
    const id = extractPublicId(b.imageUrl)
    if (id) allIds.add(id)
  }
  const partners = await prisma.partner.findMany({ select: { logoUrl: true } })
  for (const p of partners) {
    if (p.logoUrl) {
      const id = extractPublicId(p.logoUrl)
      if (id) allIds.add(id)
    }
  }
  const leaders = await prisma.leader.findMany({ select: { photoUrl: true } })
  for (const l of leaders) {
    if (l.photoUrl) {
      const id = extractPublicId(l.photoUrl)
      if (id) allIds.add(id)
    }
  }
  const mOrders = await prisma.mediaOrder.findMany({ select: { deliveryFileUrls: true } })
  for (const o of mOrders) {
    for (const url of o.deliveryFileUrls) {
      const id = extractPublicId(url)
      if (id) allIds.add(id)
    }
  }

  // 7. Ledger (receiptUrl)
  const ledgerTx = await prisma.ledgerTransaction.findMany({ select: { receiptUrl: true } })
  for (const tx of ledgerTx) {
    if (tx.receiptUrl) {
      const id = extractPublicId(tx.receiptUrl)
      if (id) allIds.add(id)
    }
  }

  // 8. Survey (avatarUrl + logoUrl)
  const surveyRes = await prisma.surveyResponse.findMany({ select: { avatarUrl: true, logoUrl: true } })
  for (const s of surveyRes) {
    if (s.avatarUrl) {
      const id = extractPublicId(s.avatarUrl)
      if (id) allIds.add(id)
    }
    if (s.logoUrl) {
      const id = extractPublicId(s.logoUrl)
      if (id) allIds.add(id)
    }
  }

  return allIds
}
