import { prisma } from "@/lib/prisma"
import { CouncilToggle } from "./CouncilToggle"

export const revalidate = 0

export default async function CouncilMembersPage() {
  const [members, eligible] = await Promise.all([
    prisma.user.findMany({
      where: { isCouncilMember: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: { select: { councilReviews: { where: { vote: "PENDING" } } } },
      },
    }),
    prisma.user.findMany({
      where: {
        isCouncilMember: false,
        role: { in: ["VIP", "ADMIN", "INFINITE"] },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Hội đồng thẩm định</h1>
        <p className="mt-1 text-sm text-brand-600">
          Thành viên hội đồng có quyền vote trên các đơn chứng nhận sản phẩm được admin chỉ định.
          Theo quy tắc: đủ 5 người APPROVE đơn mới được duyệt, 1 REJECT đơn bị tự động từ chối.
        </p>
      </div>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-base font-semibold text-brand-900">
            Thành viên hiện tại ({members.length})
          </h2>
        </div>
        {members.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Chưa có thành viên nào. Thêm từ danh sách bên dưới.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-brand-50 text-left">
              <tr>
                <th className="px-5 py-2 font-semibold text-brand-800">Họ tên</th>
                <th className="px-5 py-2 font-semibold text-brand-800">Email</th>
                <th className="px-5 py-2 font-semibold text-brand-800">Vai trò</th>
                <th className="px-5 py-2 font-semibold text-brand-800">Đơn chờ vote</th>
                <th className="px-5 py-2 text-right font-semibold text-brand-800">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((u) => (
                <tr key={u.id} className="hover:bg-brand-50/50">
                  <td className="px-5 py-3 font-medium text-brand-900">{u.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3 text-xs">{u.role}</td>
                  <td className="px-5 py-3">
                    {u._count.councilReviews > 0 ? (
                      <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                        {u._count.councilReviews} đang chờ
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <CouncilToggle userId={u.id} isMember={true} hasPending={u._count.councilReviews > 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="text-base font-semibold text-brand-900">Thêm thẩm định viên từ hội viên</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hiển thị hội viên đủ quyền (VIP, ADMIN, INFINITE) chưa trong hội đồng.
          </p>
        </div>
        {eligible.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Không còn hội viên nào để thêm.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-brand-50 text-left">
              <tr>
                <th className="px-5 py-2 font-semibold text-brand-800">Họ tên</th>
                <th className="px-5 py-2 font-semibold text-brand-800">Email</th>
                <th className="px-5 py-2 font-semibold text-brand-800">Vai trò</th>
                <th className="px-5 py-2 text-right font-semibold text-brand-800">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {eligible.map((u) => (
                <tr key={u.id} className="hover:bg-brand-50/50">
                  <td className="px-5 py-3 font-medium text-brand-900">{u.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3 text-xs">{u.role}</td>
                  <td className="px-5 py-3 text-right">
                    <CouncilToggle userId={u.id} isMember={false} hasPending={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
