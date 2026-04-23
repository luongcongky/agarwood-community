"use client"

import { createContext, useContext, type ReactNode } from "react"

type AdminPerms = {
  /** `true` khi user là INFINITE — UI nên disable mọi nút mutation (trừ
   *  carve-out ở `/admin/tin-tuc` — xem `canPublishNews`). */
  readOnly: boolean
  /** `true` khi user được phép bật `isPublished` cho news (chỉ ADMIN).
   *  INFINITE write được nội dung news nhưng không toggle được publish. */
  canPublishNews: boolean
}

const AdminPermsContext = createContext<AdminPerms>({
  readOnly: false,
  canPublishNews: true,
})

export function AdminReadOnlyProvider({
  readOnly,
  canPublishNews,
  children,
}: {
  readOnly: boolean
  canPublishNews: boolean
  children: ReactNode
}) {
  return (
    <AdminPermsContext.Provider value={{ readOnly, canPublishNews }}>
      {children}
    </AdminPermsContext.Provider>
  )
}

/** `true` khi user là INFINITE — UI nên disable mọi nút mutation. */
export function useAdminReadOnly(): boolean {
  return useContext(AdminPermsContext).readOnly
}

/** `true` khi user được phép xuất bản news (bật `isPublished`). */
export function useAdminCanPublishNews(): boolean {
  return useContext(AdminPermsContext).canPublishNews
}

/** Tooltip text dùng chung khi disable nút vì read-only. */
export const READ_ONLY_TOOLTIP = "Tài khoản Infinite ở chế độ chỉ-đọc"

/** Tooltip cho toggle Xuất bản khi user không có quyền publish. */
export const PUBLISH_LOCKED_TOOLTIP =
  "Chỉ Admin mới được phép xuất bản. Tài khoản Infinite tạo bài → chờ Admin duyệt và bật xuất bản."
