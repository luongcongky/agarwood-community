/**
 * Helper chèn transformation vào Cloudinary URL.
 *
 * Cloudinary URL co dạng:
 *   https://res.cloudinary.com/<cloud>/image/upload/<public_id>
 *   https://res.cloudinary.com/<cloud>/image/upload/v1234/<public_id>
 *
 * Ta chèn các transformation params ngay sau `/image/upload/` (trước version/public_id).
 * Nếu URL không phải Cloudinary → trả nguyên url.
 */

const CLOUDINARY_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/

export type CloudinaryFitOptions = {
  /** Aspect ratio đích, ví dụ "5:1", "21:9", "16:9" */
  ar: string
  /** Chiều rộng đích (px) — Cloudinary scale xuống nếu ảnh gốc lớn hơn */
  w?: number
  /** Cropping mode (mặc định "fill" — cắt theo aspect, giữ trọng tâm) */
  crop?: "fill" | "fit" | "limit" | "thumb"
  /** Gravity — "auto" để Cloudinary AI chọn trọng tâm thông minh */
  gravity?: "auto" | "center" | "north" | "south" | "east" | "west"
}

/**
 * Trả về Cloudinary URL với transformation áp dụng. Chèn `c_fill,ar_5:1,g_auto,w_2560,f_auto,q_auto`
 * (mặc định) vào trước public_id để Cloudinary CDN tự crop + tối ưu.
 *
 * Ví dụ:
 *   cloudinaryFit("https://res.cloudinary.com/x/image/upload/v1/banner.jpg", { ar: "5:1", w: 2560 })
 *   → "https://res.cloudinary.com/x/image/upload/c_fill,ar_5:1,g_auto,w_2560,f_auto,q_auto/v1/banner.jpg"
 */
export function cloudinaryFit(
  url: string,
  { ar, w, crop = "fill", gravity = "auto" }: CloudinaryFitOptions,
): string {
  const match = url.match(CLOUDINARY_RE)
  if (!match) return url

  const params: string[] = [
    `c_${crop}`,
    `ar_${ar.replace(":", ":")}`,
    `g_${gravity}`,
  ]
  if (w) params.push(`w_${w}`)
  params.push("f_auto", "q_auto")

  const transform = params.join(",")
  return `${match[1]}${transform}/${match[2]}`
}

/**
 * Resize mà KHÔNG force aspect ratio — giữ nguyên tỉ lệ gốc, chỉ giới hạn
 * width. Dùng cho: thumbnails, lightbox, ảnh inline trong bài.
 *
 * `c_limit` = scale xuống nếu ảnh gốc lớn hơn, giữ nguyên nếu nhỏ hơn
 * (không upscale làm mờ).
 *
 * Ví dụ:
 *   cloudinaryResize("https://res.cloudinary.com/x/image/upload/v1/a.jpg", 800)
 *   → "https://res.cloudinary.com/x/image/upload/c_limit,w_800,f_auto,q_auto/v1/a.jpg"
 */
export function cloudinaryResize(url: string, width: number): string {
  const match = url.match(CLOUDINARY_RE)
  if (!match) return url
  const transform = `c_limit,w_${width},f_auto,q_auto`
  return `${match[1]}${transform}/${match[2]}`
}

/**
 * Tạo URL LQIP (Low-Quality Image Placeholder) ~2KB để hiển thị ngay khi
 * load, sau đó fade vào ảnh thật. Cloudinary transform `e_blur:1000` làm
 * mờ mạnh, `w_40` scale xuống 40px, `q_auto:low` quality thấp → file rất nhỏ.
 *
 * Dùng làm `blurDataURL` cho Next.js Image hoặc nền CSS `background-image`.
 */
export function cloudinaryBlur(url: string): string {
  const match = url.match(CLOUDINARY_RE)
  if (!match) return url
  const transform = "e_blur:1000,w_40,q_auto:low,f_auto"
  return `${match[1]}${transform}/${match[2]}`
}

/**
 * Rewrite tất cả URL Cloudinary trong 1 chuỗi HTML, thêm transformation
 * resize. Dùng khi render nội dung bài viết có `<img>` inline — bản thân
 * HTML không thể dùng Next.js Image, nên ta transform URL luôn để giảm
 * bandwidth mà không parse DOM.
 *
 * An toàn: regex chỉ match URL Cloudinary; URL khác (external images)
 * được giữ nguyên.
 */
export function rewriteCloudinaryInHtml(html: string, width: number): string {
  if (!html) return html
  return html.replace(
    /(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)([^"'\s)]+)/g,
    (_m, prefix: string, rest: string) => {
      // Nếu URL đã có transformation (có dấu phẩy trong segment đầu) thì giữ nguyên
      const firstSegment = rest.split("/")[0]
      if (firstSegment.includes(",") || firstSegment.startsWith("c_") ||
          firstSegment.startsWith("w_") || firstSegment.startsWith("f_")) {
        return `${prefix}${rest}`
      }
      return `${prefix}c_limit,w_${width},f_auto,q_auto/${rest}`
    },
  )
}
