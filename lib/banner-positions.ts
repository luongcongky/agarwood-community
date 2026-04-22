import type { BannerPosition } from "@prisma/client"

export type BannerPositionConfig = {
  /** Tên hiển thị trong form admin. */
  label: string
  /** Mô tả vị trí hiển thị + gợi ý nội dung phù hợp. */
  description: string
  /** Tỷ lệ (width / height) cho CoverImageCropper. */
  aspectRatio: number
  /** Kích thước pixel tối ưu mà Cloudinary nên lưu (crop output). */
  targetWidth: number
  targetHeight: number
  /** Tailwind aspect utility dùng cho preview container. */
  previewClassName: string
  /** Cap width của preview trong form admin — portrait (SIDEBAR) cần giới
   *  hạn để không chiếm cả chiều cao màn hình. Landscape thì full-width OK. */
  previewMaxWidthClass: string
}

/**
 * Single source of truth cho aspect ratio + kích thước của từng vị trí banner.
 * Các render component + admin crop form đều import từ đây để không bị lệch.
 *
 * Lưu ý: khi 1 banner được hiển thị ở nhiều aspect khác nhau (vd TOP có V1 =
 * 5:1 và V2 = 970:90), Cloudinary sẽ re-crop từ source tại render time. Chọn
 * aspect source khớp với bản chủ đạo đang dùng — hiện tại là V2.
 */
export const BANNER_POSITION_CONFIG: Record<BannerPosition, BannerPositionConfig> = {
  TOP: {
    label: "TOP — Đầu trang chủ (970×90 leaderboard)",
    description:
      "Hiển thị ngay dưới thanh chuyên mục, 2 banner song song trên cùng 1 line. Phù hợp với logo + khẩu hiệu ngắn (banner rất thấp, ~90px).",
    aspectRatio: 970 / 90,
    targetWidth: 1940,
    targetHeight: 180,
    previewClassName: "aspect-[970/90]",
    previewMaxWidthClass: "max-w-full",
  },
  MID: {
    label: "MID — Giữa trang chủ (5:1 wide)",
    description:
      "Hiển thị giữa các section nội dung, rotating carousel 5s/banner. Có thể chứa nhiều thông tin hơn TOP.",
    aspectRatio: 5,
    targetWidth: 2560,
    targetHeight: 512,
    previewClassName: "aspect-[5/1]",
    previewMaxWidthClass: "max-w-full",
  },
  SIDEBAR: {
    label: "SIDEBAR — Rail dọc (2:3 portrait)",
    description:
      "Hiển thị ở sidebar /feed (sticky khi scroll) và cột banner của section Multimedia /v2. Banner dọc, nội dung kiểu poster.",
    aspectRatio: 2 / 3,
    targetWidth: 600,
    targetHeight: 900,
    previewClassName: "aspect-[2/3]",
    previewMaxWidthClass: "max-w-xs",
  },
}
