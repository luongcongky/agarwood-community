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
