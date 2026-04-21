import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export const revalidate = 0

function formatDate(d: Date | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default async function CouncilInboxPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isCouncilMember: true, name: true },
  })

  if (!user?.isCouncilMember) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-3">
        <h1 className="text-xl font-bold text-brand-900">Không có quyền truy cập</h1>
        <p className="text-sm text-brand-500">
          Bạn không phải thành viên Hội đồng thẩm định. Liên hệ ban quản trị nếu bạn nghĩ đây là nhầm lẫn.
        </p>
      </div>
    )
  }

  const reviews = await prisma.certificationReview.findMany({
    where: { reviewerId: session.user.id },
    orderBy: [{ vote: "asc" }, { createdAt: "desc" }],
    include: {
      certification: {
        select: {
          id: true,
          status: true,
          reviewMode: true,
          createdAt: true,
          product: { select: { name: true, slug: true } },
          applicant: { select: { name: true, email: true } },
        },
      },
    },
  })

  const pending = reviews.filter((r) => r.vote === "PENDING")
  const done = reviews.filter((r) => r.vote !== "PENDING")

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Hội đồng thẩm định</h1>
        <p className="mt-1 text-sm text-brand-600">
          Các đơn chứng nhận sản phẩm được giao cho bạn. Cần để lại nhận xét khi vote. Đủ 5/5 APPROVE đơn được duyệt, 1 REJECT đơn bị tự động từ chối.
        </p>
      </div>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-brand-900">
            Chờ vote ({pending.length})
          </h2>
        </div>
        {pending.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Không có đơn nào đang chờ bạn vote.</p>
        ) : (
          <ul className="divide-y">
            {pending.map((r) => (
              <li key={r.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-900 truncate">
                    {r.certification.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nộp ngày {formatDate(r.certification.createdAt)} ·{" "}
                    {r.certification.reviewMode === "ONLINE" ? "Online" : "Offline"} ·{" "}
                    Người nộp: {r.certification.applicant.name}
                  </p>
                </div>
                <Link
                  href={`/hoi-dong/cho-duyet/${r.certification.id}`}
                  className="shrink-0 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
                >
                  Xem & Vote →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-3">
            <h2 className="text-base font-semibold text-brand-900">Đã vote ({done.length})</h2>
          </div>
          <ul className="divide-y">
            {done.map((r) => (
              <li key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-brand-900 truncate">
                    {r.certification.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Vote: <span className={r.vote === "APPROVE" ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                      {r.vote}
                    </span>{" "}
                    · {formatDate(r.votedAt)} · Trạng thái đơn: {r.certification.status}
                  </p>
                </div>
                <Link
                  href={`/hoi-dong/cho-duyet/${r.certification.id}`}
                  className="shrink-0 text-sm text-brand-600 hover:text-brand-800 underline"
                >
                  Xem
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
