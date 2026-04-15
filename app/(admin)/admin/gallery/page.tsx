import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { GalleryManager } from "./GalleryManager"

export const revalidate = 0

export default async function AdminGalleryPage() {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) notFound()

  const items = await prisma.heroImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Gallery ảnh nền trang chủ</h1>
        <p className="text-sm text-brand-500 mt-1">
          Upload ảnh để làm background cho khu vực "Tin Hội / Bản tin hội viên" ở trang chủ.
          Mỗi ngày hệ thống tự chọn 1 ảnh ngẫu nhiên trong danh sách đang active —
          cùng ngày mọi user thấy cùng ảnh. Khuyến nghị ảnh ngang 1920×1080 trở lên, phong cảnh,
          ít chi tiết rối để text trên card vẫn dễ đọc.
        </p>
      </div>
      <GalleryManager initialItems={items.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      }))} />
    </div>
  )
}
