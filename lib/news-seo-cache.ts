import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

/**
 * Danh sách tiêu đề của các bài news đã publish, dùng để check trùng-tiêu-đề
 * trong `scoreSeo()`. Cache tag = "news:titles" — bất kỳ POST/PATCH/DELETE
 * news nào cũng `revalidateTag("news:titles")` để đẩy lại.
 *
 * Vì sao cần cache:
 *  - `scoreSeo()` được gọi 3 nơi: POST, PATCH, live SEO-score endpoint.
 *  - Live endpoint bị hit theo mỗi keystroke (debounce 600ms). Trước khi
 *    cache, mỗi keystroke burst = 1 query scan 1000 row.
 *  - Danh sách này hiếm đổi (chỉ khi xuất bản/chỉnh title bài đã publish).
 *
 * TTL = 10 phút chỉ là fallback; tag invalidation là đường dẫn chính. `id`
 * được select để caller có thể filter `excludeId` (edit article hiện tại
 * không tính trùng với chính nó).
 */
export const getPublishedNewsTitles = unstable_cache(
  async () => {
    return prisma.news.findMany({
      where: { isPublished: true },
      select: { id: true, title: true },
      orderBy: { publishedAt: "desc" },
      take: 1000,
    })
  },
  ["admin_news_published_titles_v1"],
  { revalidate: 600, tags: ["news:titles"] },
)

/** Helper: lấy danh sách title (đã loại excludeId nếu có). */
export async function getPreviousTitles(excludeId?: string): Promise<string[]> {
  const rows = await getPublishedNewsTitles()
  const filtered = excludeId ? rows.filter((r) => r.id !== excludeId) : rows
  return filtered.map((r) => r.title)
}
