import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ContactRow } from "./ContactRow"

export const revalidate = 0

const STATUS_LABEL: Record<string, string> = {
  NEW: "Chờ xử lý",
  HANDLED: "Đã xử lý",
  ARCHIVED: "Lưu trữ",
}

export default async function ContactMessagesPage() {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) notFound()

  // NEW first (admin queue), then by newest first within each bucket.
  const items = await prisma.contactMessage.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { handledBy: { select: { name: true } } },
    take: 300,
  })

  const pendingCount = items.filter((m) => m.status === "NEW").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Liên hệ từ website</h1>
        <p className="text-sm text-brand-500 mt-1">
          Tin nhắn gửi từ form /lien-he. Có {pendingCount} tin chưa xử lý.
        </p>
      </div>

      <div className="rounded-xl border border-brand-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-brand-50 text-xs uppercase text-brand-500">
              <tr>
                <th className="px-4 py-3 text-left">Người gửi</th>
                <th className="px-4 py-3 text-left">Liên hệ</th>
                <th className="px-4 py-3 text-left">Nội dung</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-500 italic">
                    Chưa có tin nhắn liên hệ nào.
                  </td>
                </tr>
              )}
              {items.map((m) => (
                <ContactRow
                  key={m.id}
                  item={{
                    id: m.id,
                    status: m.status,
                    name: m.name,
                    email: m.email,
                    phone: m.phone,
                    message: m.message,
                    adminNote: m.adminNote,
                    createdAt: m.createdAt.toISOString(),
                    handledByName: m.handledBy?.name ?? null,
                    statusLabel: STATUS_LABEL[m.status],
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
