import { AdminSidebar } from "@/components/features/layout/AdminSidebar"
import { AdminMobileNav } from "@/components/features/layout/AdminMobileNav"
import { AdminReadOnlyProvider } from "@/components/features/admin/AdminReadOnlyContext"
import { PendingCountsProvider } from "@/components/features/admin/PendingCountsContext"
import { auth } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = session?.user?.role
  const readOnly = role === "INFINITE"
  const canPublishNews = role === "ADMIN"
  return (
    // h-screen (thay cho min-h-screen) để main thực sự scroll bên trong,
    // không cho phép outer container grow theo content → sticky toolbar hoạt động
    <PendingCountsProvider>
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
          <AdminReadOnlyProvider readOnly={readOnly} canPublishNews={canPublishNews}>
            {children}
          </AdminReadOnlyProvider>
        </main>
      </div>
    </div>
    </PendingCountsProvider>
  )
}
