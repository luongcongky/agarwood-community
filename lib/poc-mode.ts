/**
 * PoC mode toggle — Phase PoC của dự án.
 *
 * Khi bật, mọi quota bị vô hiệu hoá: user đã kích hoạt post + đăng SP không
 * giới hạn, bất kể role (GUEST/VIP/INFINITE/ADMIN). Khách chốt tạm thời mở
 * toàn quyền trong giai đoạn demo, sau PoC sẽ quay lại Phase 2 quota.
 *
 * Cách tắt khi hết PoC:
 *   1. Set env `POC_UNLIMITED_POSTS=0` rồi restart app — nhanh, không cần code.
 *   2. Revert commit thêm file này + gỡ check trong lib/quota.ts,
 *      lib/product-quota.ts — sạch hơn cho long-term.
 *
 * Default: TRUE (PoC mode ON). Chỉ tắt khi set env thành "0" | "false".
 */
export function isPocUnlimitedMode(): boolean {
  const raw = process.env.POC_UNLIMITED_POSTS
  if (raw === "0" || raw === "false") return false
  return true
}
