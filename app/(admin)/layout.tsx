import { AdminSidebar } from "@/components/features/layout/AdminSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth guard handled by middleware
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-muted/30 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
