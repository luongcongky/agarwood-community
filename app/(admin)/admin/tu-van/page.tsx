import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ConsultationRow } from "./ConsultationRow"

export const revalidate = 0

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý",
  CONTACTED: "Đã liên hệ",
  DONE: "Hoàn tất",
  CANCELLED: "Đã hủy",
}

export default async function ConsultationListPage() {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) notFound()

  const items = await prisma.consultationRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true, accountType: true } },
      handledBy: { select: { name: true } },
    },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Yêu cầu tư vấn</h1>
        <p className="text-sm text-brand-500 mt-1">Hội viên đăng ký tư vấn nâng cấp gói (từ kết quả khảo sát)</p>
      </div>

      <div className="rounded-xl border border-brand-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-brand-50 text-xs uppercase text-brand-500">
              <tr>
                <th className="px-4 py-3 text-left">Người đăng ký</th>
                <th className="px-4 py-3 text-left">Liên hệ</th>
                <th className="px-4 py-3 text-left">Gợi ý gói</th>
                <th className="px-4 py-3 text-left">Ghi chú</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-500 italic">Chưa có yêu cầu.</td></tr>
              )}
              {items.map((c) => (
                <ConsultationRow key={c.id} item={{
                  id: c.id,
                  status: c.status,
                  fullName: c.fullName,
                  phone: c.phone,
                  email: c.email,
                  companyName: c.companyName,
                  note: c.note,
                  recommendedTier: c.recommendedTier,
                  context: c.context,
                  createdAt: c.createdAt.toISOString(),
                  handledByName: c.handledBy?.name ?? null,
                  user: c.user ? { name: c.user.name, email: c.user.email, accountType: c.user.accountType } : null,
                  statusLabel: STATUS_LABEL[c.status],
                }} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
