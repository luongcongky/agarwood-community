import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

export const revalidate = 0

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang chạy",
  CLOSED: "Đã đóng",
}
const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Tất cả",
  BUSINESS: "Doanh nghiệp",
  INDIVIDUAL: "Cá nhân",
  BOTH_VIP: "Hội viên (BUSINESS + INDIVIDUAL)",
}

export default async function AdminSurveysPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") notFound()

  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { responses: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Khảo sát</h1>
          <p className="text-sm text-brand-500 mt-1">Quản lý các bộ khảo sát thu thập thông tin hội viên</p>
        </div>
        <Link
          href="/admin/khao-sat/tao-moi"
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + Tạo khảo sát
        </Link>
      </div>

      <div className="rounded-xl border border-brand-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-brand-50 text-xs uppercase text-brand-500">
            <tr>
              <th className="px-4 py-3 text-left">Tên</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Đối tượng</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-right">Phản hồi</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {surveys.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-500 italic">Chưa có khảo sát nào.</td></tr>
            )}
            {surveys.map((s) => (
              <tr key={s.id} className="hover:bg-brand-50/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/khao-sat/${s.id}`} className="font-medium text-brand-900 hover:text-brand-700">
                    {s.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-brand-600 font-mono text-xs">{s.slug}</td>
                <td className="px-4 py-3 text-brand-600">{AUDIENCE_LABEL[s.audience]}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                    s.status === "DRAFT" ? "bg-amber-100 text-amber-700" :
                    "bg-brand-100 text-brand-600"
                  }`}>{STATUS_LABEL[s.status]}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  <Link href={`/admin/khao-sat/${s.id}/ket-qua`} className="hover:text-brand-700">
                    {s._count.responses}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link href={`/admin/khao-sat/${s.id}`} className="text-brand-700 hover:underline text-xs">Sửa</Link>
                  <Link href={`/admin/khao-sat/${s.id}/ket-qua`} className="text-brand-700 hover:underline text-xs">Kết quả</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
