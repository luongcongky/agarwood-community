import { prisma } from "@/lib/prisma"
import { PartnerManager, type PartnerRow } from "./PartnerManager"

export const metadata = {
  title: "Quản lý Đối tác | Admin",
}

export default async function AdminPartnersPage() {
  const rows = await prisma.partner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      shortName: true,
      category: true,
      logoUrl: true,
      websiteUrl: true,
      description: true,
      sortOrder: true,
      isActive: true,
    },
  })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-900">Quản lý Đối tác</h1>
        <p className="mt-1 text-sm text-brand-500">
          Quản lý danh sách cơ quan, đoàn thể, đối tác truyền thông liên kết với Hội —
          hiển thị ở trang chủ (carousel chạy ngang).
        </p>
      </header>

      <PartnerManager initialPartners={rows as PartnerRow[]} />
    </div>
  )
}
