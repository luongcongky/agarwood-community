import "server-only"
import { cache } from "react"
import type { Committee, Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * Two-layer permission model:
 *  - Layer 1 (Role): baseline — GUEST/VIP/ADMIN/INFINITE. Giữ nguyên, không đổi.
 *  - Layer 2 (Committee): thêm permission khi user là thành viên ban.
 *
 * User's permission set = UNION(ROLE_PERMS[role], {COMMITTEE_PERMS[c] for c in user's committees}).
 *
 * ADMIN luôn có `admin:full` = implicit-all → mọi guard cũ `canAdminWrite`
 * vẫn hoạt động đúng. Migration từng surface sẽ chuyển sang
 * `hasPermission(perms, "specific:perm")` dần, ADMIN tự động đi qua.
 */

export type Permission =
  | "admin:read" // vào /admin area (readonly OK)
  | "admin:full" // ADMIN — implicit-all, khớp mọi check
  | "news:write" // tạo/sửa bài news
  | "news:publish" // bật isPublished trên bài news
  | "post:moderate" // duyệt/lock bài feed
  | "post:promote" // đẩy bài feed lên trang chủ / duyệt promotion-request
  | "member:approve" // duyệt đơn đăng ký + đơn kết nạp hội viên
  | "cert:review" // vote trong Hội đồng thẩm định chứng nhận
  | "cert:approve" // approve/reject chứng nhận cuối cùng
  | "payment:confirm" // xác nhận thanh toán (membership/cert/banner)
  | "document:write" // upload/sửa văn bản pháp lý
  | "banner:approve" // duyệt banner quảng cáo
  | "product:write" // admin sửa Product của owner khác (có audit trail)

/** Baseline permission theo Role — không phụ thuộc committee. */
const ROLE_PERMS: Record<Role, readonly Permission[]> = {
  GUEST: [],
  VIP: [],
  ADMIN: ["admin:full"],
  // INFINITE: carveout lịch sử — admin read-only + ghi news.
  // Matches hành vi `canWriteNews()` trước khi có permission layer.
  INFINITE: ["admin:read", "news:write"],
}

/**
 * Permission cho từng ban. Thêm ban mới: thêm entry ở đây + enum Committee.
 *
 * Nguyên tắc thiết kế:
 *  - Mỗi ban có `admin:read` tối thiểu để thấy được UI admin (nếu muốn).
 *  - Ban quản trị nội bộ (Thường vụ, Chấp hành) không mặc định có quyền
 *    content — đó là trách nhiệm Ban Thư ký / Truyền thông.
 *  - Không 2 ban nào cùng có `admin:full` — ngăn leak all access.
 */
const COMMITTEE_PERMS: Record<Committee, readonly Permission[]> = {
  THUONG_VU: ["admin:read", "member:approve", "cert:approve"],
  CHAP_HANH: ["admin:read"],
  KIEM_TRA: ["admin:read", "payment:confirm"],
  THAM_DINH: ["admin:read", "cert:review"],
  THU_KY: ["admin:read", "news:write", "document:write", "post:moderate"],
  TRUYEN_THONG: [
    "admin:read",
    "news:write",
    "news:publish",
    "post:moderate",
    "post:promote",
    "product:write",
  ],
}

/** Tính tập permission cho 1 user từ role + committees. */
function computePermissions(
  role: Role,
  committees: Committee[],
): Set<Permission> {
  const perms = new Set<Permission>()
  for (const p of ROLE_PERMS[role]) perms.add(p)
  for (const c of committees) {
    for (const p of COMMITTEE_PERMS[c]) perms.add(p)
  }
  return perms
}

/** `admin:full` implicit-all — dùng cho ADMIN mà không cần list từng perm. */
export function hasPermission(
  perms: Set<Permission>,
  required: Permission,
): boolean {
  return perms.has("admin:full") || perms.has(required)
}

/** Bắt user cần có ÍT NHẤT một trong danh sách permission (OR logic). */
export function hasAnyPermission(
  perms: Set<Permission>,
  required: readonly Permission[],
): boolean {
  if (perms.has("admin:full")) return true
  for (const p of required) if (perms.has(p)) return true
  return false
}

/** Fetch role + committees từ DB và build permission set. `cache()` từ React
 *  dedupe trong 1 request (same userId → 1 query), tránh N+1 khi nhiều
 *  component check perm cùng request. */
export const getUserPermissions = cache(async function getUserPermissions(
  userId: string,
): Promise<Set<Permission>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      committeeMemberships: { select: { committee: true } },
    },
  })
  if (!user) return new Set()
  return computePermissions(
    user.role,
    user.committeeMemberships.map((m) => m.committee),
  )
})

/** Client-safe permission payload — dùng ở serialized props (sidebar,
 *  UserMenu) để client conditional hide UI. KHÔNG dùng để gate mutation
 *  — luôn recheck ở server. */
export type PermissionSnapshot = {
  perms: Permission[]
}

export async function getUserPermissionSnapshot(
  userId: string,
): Promise<PermissionSnapshot> {
  const set = await getUserPermissions(userId)
  return { perms: [...set] }
}

export function hasPermissionInSnapshot(
  snapshot: PermissionSnapshot,
  required: Permission,
): boolean {
  return (
    snapshot.perms.includes("admin:full") || snapshot.perms.includes(required)
  )
}

/** i18n labels cho enum Committee — dùng ở admin UI. */
export const COMMITTEE_LABELS: Record<Committee, string> = {
  THUONG_VU: "Ban Thường vụ",
  CHAP_HANH: "Ban Chấp hành",
  KIEM_TRA: "Ban Kiểm tra",
  THAM_DINH: "Ban Thẩm định",
  THU_KY: "Ban Thư ký",
  TRUYEN_THONG: "Ban Truyền thông",
}

/** Mô tả ngắn từng ban — tooltip trong UI. */
export const COMMITTEE_DESCRIPTIONS: Record<Committee, string> = {
  THUONG_VU: "Duyệt hội viên, quyết định chứng nhận quan trọng.",
  CHAP_HANH: "Thành viên điều hành — truy cập đọc khu quản trị.",
  KIEM_TRA: "Xác nhận thanh toán, giám sát hoạt động.",
  THAM_DINH: "Vote trong Hội đồng thẩm định chứng nhận sản phẩm.",
  THU_KY: "Đăng tin tức, duyệt feed, quản lý văn bản pháp lý.",
  TRUYEN_THONG: "Sản xuất + xuất bản tin tức, đẩy bài nổi bật lên trang chủ.",
}
