import type { Role } from "@prisma/client"

/**
 * Role có quyền truy cập admin: ADMIN chuyên dụng + INFINITE (hạng đặc biệt).
 * Edge-safe — không import prisma client runtime.
 */
export function isAdmin(role: Role | string | null | undefined): boolean {
  return role === "ADMIN" || role === "INFINITE"
}

/** Role được hưởng quyền hạng Vàng (quota unlimited, ưu tiên hiển thị). */
export function hasGoldPrivileges(role: Role | string | null | undefined): boolean {
  return role === "ADMIN" || role === "INFINITE"
}

/**
 * Quyền **ghi/sửa/xóa** trong khu vực admin — chỉ ADMIN chuyên dụng.
 * INFINITE có thể vào xem (`isAdmin()`) nhưng KHÔNG được mutate.
 * Dùng trong mọi POST/PATCH/PUT/DELETE handler dưới `/api/admin/*`
 * và mọi server action thay đổi data quản trị.
 */
export function canAdminWrite(role: Role | string | null | undefined): boolean {
  return role === "ADMIN"
}

/**
 * Carve-out cho news editor: INFINITE (thẻ đen) được mở khóa để **viết**
 * tin tức — tạo nháp, sửa nội dung, sửa SEO, gọi AI dịch. Nhưng không được
 * xuất bản (`isPublished`) — xem `canPublishNews`. Các admin surface khác
 * vẫn dùng `canAdminWrite` nên INFINITE vẫn chỉ-đọc ở đó.
 */
export function canWriteNews(role: Role | string | null | undefined): boolean {
  return role === "ADMIN" || role === "INFINITE"
}

/**
 * Quyền **xuất bản** tin tức (bật `isPublished`). Chỉ ADMIN. INFINITE viết
 * được nhưng phải để admin review + publish. API phải strip `isPublished`
 * khỏi PATCH body nếu `!canPublishNews`, không chỉ trông vào UI.
 */
export function canPublishNews(role: Role | string | null | undefined): boolean {
  return role === "ADMIN"
}

/**
 * Role được coi là "thành viên" — có quyền đăng bài feed, xem nội dung VIP.
 * VIP (membership đang active) + ADMIN + INFINITE. GUEST bị loại.
 * Backend `/api/posts` không enforce role, nhưng UI cần check để ẩn nút đăng
 * với guest/unverified user.
 */
export function isMember(role: Role | string | null | undefined): boolean {
  return role === "VIP" || role === "ADMIN" || role === "INFINITE"
}

/**
 * Mềm hơn `isMember()` — cho phép GUEST đã đóng phí (membershipExpires trong
 * tương lai) cũng được coi là thành viên. Dùng cho UI check đăng bài feed
 * và membership sidebar.
 *
 * Lý do: payment confirm flow không upgrade role → VIP, nên user đã đóng phí
 * vẫn có thể stuck ở role=GUEST. Thay vì chặn UI, check membership window
 * trực tiếp. Còn logic quota/vote khác vẫn dùng `isMember()` strict.
 */
export function hasMemberAccess(
  role: Role | string | null | undefined,
  membershipExpires: string | Date | null | undefined,
): boolean {
  if (isMember(role)) return true
  if (!membershipExpires) return false
  const expiresAt =
    typeof membershipExpires === "string"
      ? new Date(membershipExpires)
      : membershipExpires
  return expiresAt.getTime() > Date.now()
}
