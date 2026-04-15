"use client"

import { createContext, useContext, type ReactNode } from "react"

const AdminReadOnlyContext = createContext(false)

export function AdminReadOnlyProvider({
  readOnly,
  children,
}: {
  readOnly: boolean
  children: ReactNode
}) {
  return (
    <AdminReadOnlyContext.Provider value={readOnly}>
      {children}
    </AdminReadOnlyContext.Provider>
  )
}

/** `true` khi user là INFINITE — UI nên disable mọi nút mutation. */
export function useAdminReadOnly(): boolean {
  return useContext(AdminReadOnlyContext)
}

/** Tooltip text dùng chung khi disable nút vì read-only. */
export const READ_ONLY_TOOLTIP = "Tài khoản Infinite ở chế độ chỉ-đọc"
