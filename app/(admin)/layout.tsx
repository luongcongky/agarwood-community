import { AdminSidebar } from "@/components/features/layout/AdminSidebar"
import { AdminMobileNav } from "@/components/features/layout/AdminMobileNav"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // h-screen (thay cho min-h-screen) để main thực sự scroll bên trong,
    // không cho phép outer container grow theo content → sticky toolbar hoạt động
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar: ẩn mobile, hiện từ md+ */}
      <AdminSidebar />

      {/* Cột phải: header mobile + nội dung */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar hamburger: chỉ hiện trên mobile */}
        <AdminMobileNav />

        <main className="flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
