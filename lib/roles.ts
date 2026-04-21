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
 * Role được coi là "thành viên" — có quyền đăng bài feed, xem nội dung VIP.
 * VIP (membership đang active) + ADMIN + INFINITE. GUEST bị loại.
 * Backend `/api/posts` không enforce role, nhưng UI cần check để ẩn nút đăng
 * với guest/unverified user.
 */
export function isMember(role: Role | string | null | undefined): boolean {
  return role === "VIP" || role === "ADMIN" || role === "INFINITE"
}
