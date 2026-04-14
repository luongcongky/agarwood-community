/**
 * Shared blur placeholder cho next/image.
 *
 * BRAND_BLUR_DATA_URL là 1 ảnh PNG 8×5 màu warm-beige (tone brand) base64,
 * ~120 bytes. Dùng làm `blurDataURL` cho mọi ảnh remote (Cloudinary, GDrive…)
 * — browser hiển thị ngay lập tức trong lúc ảnh thật tải, không tạo request.
 *
 * Muốn blur sát màu ảnh thật → dùng Cloudinary transform `e_blur:1000,w_20`
 * qua `cloudinaryBlurUrl()` (tốn 1 HTTP request nhỏ ~800B cho mỗi ảnh khác nhau).
 */

// 8×5 PNG warm beige #e8d8b8 — dùng cho đa số ảnh
export const BRAND_BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAIAAAAKVXTwAAAAHklEQVQIW2P8//8/AwMDAxMDEjCCEAOY/P8fIsbIAAAMZgMB+llmtQAAAABJRU5ErkJggg=="

/**
 * Sinh URL ảnh blur nhỏ từ Cloudinary (≈800B). Dùng khi muốn blur sát màu
 * ảnh thật thay vì 1 màu neutral. Trả về null nếu không phải URL Cloudinary.
 *
 * Chèn transform `w_20,e_blur:1000,q_auto,f_auto` ngay sau `/upload/`.
 */
export function cloudinaryBlurUrl(src: string): string | null {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) return null
  return src.replace("/upload/", "/upload/w_20,e_blur:1000,q_auto,f_auto/")
}

/**
 * Trả về props `placeholder` + `blurDataURL` cho next/image.
 * Dùng BRAND_BLUR_DATA_URL (rẻ, không HTTP call) làm default.
 */
export function getBlurProps(src: string | null | undefined) {
  if (!src) return {}
  return {
    placeholder: "blur" as const,
    blurDataURL: BRAND_BLUR_DATA_URL,
  }
}
