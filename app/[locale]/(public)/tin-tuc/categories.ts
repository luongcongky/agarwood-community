/** Categories hiển thị trên /tin-tuc public (list + detail).
 *  Phase 3.3 (2026-04): mở rộng từ [GENERAL, SPONSORED_PRODUCT] sang
 *  thêm BUSINESS + PRODUCT (tin doanh nghiệp + tin sản phẩm hiển thị
 *  chung listing /tin-tuc, không có route riêng).
 *  KHÔNG bao gồm: RESEARCH (route /nghien-cuu), LEGAL (route /privacy, /terms).
 *
 *  Đặt ở file riêng (không "use server") vì Next.js cấm export non-function
 *  từ file "use server" — actions.ts re-export qua import. */
export const TIN_TUC_PUBLIC_CATEGORIES = [
  "GENERAL",
  "SPONSORED_PRODUCT",
  "BUSINESS",
  "PRODUCT",
] as const

/** Template hiển thị trên /tin-tuc — chỉ NORMAL (text+ảnh+video chèn lẫn).
 *  PHOTO/VIDEO templates đẩy sang /multimedia (Phase 3.3 Q1=B decision). */
export const TIN_TUC_PUBLIC_TEMPLATE = "NORMAL" as const
