import { AdminSidebar } from "@/components/features/layout/AdminSidebar"
import { AdminMobileNav } from "@/components/features/layout/AdminMobileNav"
import { AdminReadOnlyProvider } from "@/components/features/admin/AdminReadOnlyContext"
import { PendingCountsProvider } from "@/components/features/admin/PendingCountsContext"
import { auth } from "@/lib/auth"
import { getUserPermissionSnapshot, hasPermissionInSnapshot } from "@/lib/permissions"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = session?.user?.role
  // Fetch permission snapshot 1 lần/layout render — dùng để gate UI client.
  // Mutation server vẫn check `hasPermission()` độc lập (don't trust client).
  const permSnapshot = session?.user?.id
    ? await getUserPermissionSnapshot(session.user.id)
    : { perms: [] }
  // readOnly = INFINITE role + không thuộc ban nào (committee mở thêm quyền ghi).
  // VIP Thư ký/Truyền thông không phải readOnly — họ có thể ghi news + moderate.
  const readOnly = role === "INFINITE" && (session?.user?.committees?.length ?? 0) === 0
  const canPublishNews = hasPermissionInSnapshot(permSnapshot, "news:publish")
  const currentUser = session?.user?.id
    ? {
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        avatarUrl: session.user.image ?? null,
      }
    : null
  return (
    // AdminReadOnlyProvider ở OUTER (bao cả sidebar + mobile nav + main)
    // vì AdminSidebar dùng `useHasAdminPerm()` để filter nav items. Trước
    // đây Provider chỉ bọc `children` → sidebar luôn dùng context default
    // (perms=[]) → admin thấy nav bị thiếu Tin tức, Văn bản pháp quy,
    // Banner QC, etc. dù có admin:full.
    <PendingCountsProvider>
      <AdminReadOnlyProvider
        readOnly={readOnly}
        canPublishNews={canPublishNews}
        perms={permSnapshot.perms}
        currentUser={currentUser}
      >
        {/* h-screen (thay cho min-h-screen) để main thực sự scroll bên trong,
            không cho phép outer container grow theo content → sticky toolbar hoạt động */}
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar: ẩn mobile, hiện từ md+ */}
          <AdminSidebar />

          {/* Cột phải: header mobile + nội dung */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar hamburger: chỉ hiện trên mobile */}
            <AdminMobileNav />

            <main className="flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8 overflow-auto">
              {readOnly && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <span className="font-semibold">∞ Chế độ chỉ-đọc</span> — Tài khoản
                  hạng Infinite có quyền xem mọi trang quản trị và <strong>Đăng tin tức</strong>
                  {" "}(soạn/sửa bài). Các thao tác khác (duyệt, sửa, xóa, cấu hình, xuất bản tin)
                  {" "}chỉ dành cho Admin.
                </div>
              )}
              {children}
            </main>
          </div>
        </div>
      </AdminReadOnlyProvider>
    </PendingCountsProvider>
  )
}
