"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

/** Permission union duplicated từ `lib/permissions.ts` — file này là client
 *  component nên không import server-only module. Đồng bộ tay khi thêm perm. */
type Permission =
  | "admin:read"
  | "admin:full"
  | "news:write"
  | "news:publish"
  | "post:moderate"
  | "post:promote"
  | "member:approve"
  | "cert:review"
  | "cert:approve"
  | "payment:confirm"
  | "document:write"
  | "banner:approve"
  | "product:write"
  | "ledger:read"
  | "ledger:write"

/** Tóm tắt user đang đăng nhập — dùng cho UI cần preset (vd Author selector
 *  default = current user). Optional vì root layout có thể chưa có session. */
export type AdminCurrentUser = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

type AdminPerms = {
  /** `true` khi user là INFINITE (không thuộc ban nào) — UI nên disable
   *  mọi nút mutation. INFINITE + thuộc ban thì `readOnly=false`. */
  readOnly: boolean
  /** `true` khi user được phép bật `isPublished` cho news. Giữ riêng (thay
   *  vì chỉ `useHasAdminPerm("news:publish")`) để các component hiện có
   *  không phải refactor — backward compat. */
  canPublishNews: boolean
  /** Danh sách permission user đang có — dùng với `useHasAdminPerm(p)`. */
  perms: readonly Permission[]
  /** Current user — null nếu unauth (route guard ở proxy redirect rồi). */
  currentUser: AdminCurrentUser | null
}

const AdminPermsContext = createContext<AdminPerms>({
  readOnly: false,
  canPublishNews: true,
  perms: [],
  currentUser: null,
})

export function AdminReadOnlyProvider({
  readOnly,
  canPublishNews,
  perms,
  currentUser,
  children,
}: {
  readOnly: boolean
  canPublishNews: boolean
  perms: readonly Permission[]
  currentUser: AdminCurrentUser | null
  children: ReactNode
}) {
  const value = useMemo(
    () => ({ readOnly, canPublishNews, perms, currentUser }),
    [readOnly, canPublishNews, perms, currentUser],
  )
  return (
    <AdminPermsContext.Provider value={value}>
      {children}
    </AdminPermsContext.Provider>
  )
}

/** Hook trả về user đang đăng nhập — null nếu không có session. */
export function useAdminCurrentUser(): AdminCurrentUser | null {
  return useContext(AdminPermsContext).currentUser
}

/** `true` khi user là INFINITE không có ban — UI disable nút mutation. */
export function useAdminReadOnly(): boolean {
  return useContext(AdminPermsContext).readOnly
}

/** `true` khi user được phép xuất bản news (bật `isPublished`). */
export function useAdminCanPublishNews(): boolean {
  return useContext(AdminPermsContext).canPublishNews
}

/** Check 1 permission cụ thể — `admin:full` implies mọi perm. */
export function useHasAdminPerm(required: Permission): boolean {
  const { perms } = useContext(AdminPermsContext)
  return perms.includes("admin:full") || perms.includes(required)
}

/** Tooltip text dùng chung khi disable nút vì read-only. */
export const READ_ONLY_TOOLTIP = "Tài khoản Infinite ở chế độ chỉ-đọc"

/** Tooltip cho toggle Xuất bản khi user không có quyền publish. */
export const PUBLISH_LOCKED_TOOLTIP =
  "Chỉ Admin mới được phép xuất bản. Tài khoản Infinite tạo bài → chờ Admin duyệt và bật xuất bản."
