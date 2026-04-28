/**
 * Helpers map News (template=PHOTO|VIDEO) → shape Multimedia tương đương.
 * Phase 3.7 round 4 (2026-04): bảng Multimedia đã được migrate sang News;
 * public reads `/multimedia/*` đọc từ News và adapt qua các helper này để
 * giữ shape data mà UI cũ (MultimediaSection, MultimediaListingPage,
 * MultimediaDetailPage) đã viết theo.
 */

export type MultimediaGalleryItem = { url: string; caption?: string }

/** Parse News.gallery JSON về array {url, caption}. Defensive — schema chỉ
 *  guarantee Json shape, runtime có thể là null hoặc malformed nếu tay vào DB. */
export function parseGallery(gallery: unknown): MultimediaGalleryItem[] {
  if (!Array.isArray(gallery)) return []
  return gallery.flatMap((g) => {
    if (g && typeof g === "object" && "url" in g && typeof (g as { url: unknown }).url === "string") {
      return [{ url: (g as { url: string }).url, caption: (g as { caption?: string }).caption }]
    }
    return []
  })
}

/** Extract YouTube video ID từ URL. Hỗ trợ watch?v=, youtu.be/, embed/.
 *  Trả null nếu không match — caller fallback về null/iframe nguyên URL. */
export function extractYoutubeId(url: string): string | null {
  if (!url) return null
  // youtu.be/ID
  let m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (m) return m[1]
  // youtube.com/watch?v=ID
  m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (m) return m[1]
  // youtube.com/embed/ID
  m = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (m) return m[1]
  return null
}

/** Map template News → type Multimedia. */
export function templateToMultimediaType(
  template: "NORMAL" | "PHOTO" | "VIDEO",
): "PHOTO_COLLECTION" | "VIDEO" | null {
  if (template === "PHOTO") return "PHOTO_COLLECTION"
  if (template === "VIDEO") return "VIDEO"
  return null
}

/** Convert News row (template=PHOTO|VIDEO) sang shape giống Multimedia
 *  (cho UI components hiện có). Returns null nếu template=NORMAL. */
export function newsToMultimedia<
  T extends {
    template: "NORMAL" | "PHOTO" | "VIDEO"
    gallery: unknown
  },
>(news: T) {
  const type = templateToMultimediaType(news.template)
  if (!type) return null
  const gallery = parseGallery(news.gallery)
  const imageUrls = type === "PHOTO_COLLECTION" ? gallery.map((g) => g.url) : []
  const youtubeId =
    type === "VIDEO" && gallery[0]?.url ? extractYoutubeId(gallery[0].url) : null
  return { ...news, type, imageUrls, youtubeId, gallery }
}

/** Effective cover image cho News card UI — fallback chain.
 *  Phase 3.7 round 4 (2026-04): bài media (template=PHOTO/VIDEO) thường
 *  KHÔNG có coverImageUrl explicit. Cần derive thumbnail từ gallery để
 *  Hero / sub-Hero / sidebar không hiện placeholder fern.
 *
 *  Order:
 *    1. coverImageUrl explicit (nếu admin upload riêng)
 *    2. template=VIDEO + YouTube ID parse được → maxresdefault.jpg
 *    3. template=PHOTO → gallery[0].url
 *    4. null → caller fallback placeholder
 */
export function newsCoverImage(news: {
  coverImageUrl: string | null
  template?: "NORMAL" | "PHOTO" | "VIDEO" | null
  gallery?: unknown
}): string | null {
  if (news.coverImageUrl) return news.coverImageUrl
  if (!news.template || news.template === "NORMAL") return null
  const items = parseGallery(news.gallery)
  const first = items[0]
  if (!first) return null
  if (news.template === "VIDEO") {
    const id = extractYoutubeId(first.url)
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null
  }
  // PHOTO
  return first.url
}
