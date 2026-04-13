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
