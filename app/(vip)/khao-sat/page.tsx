import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

export const revalidate = 0

export default async function MemberSurveyListPage() {
  const session = await auth()
  if (!session?.user?.id) notFound()

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountType: true, role: true },
  })
  if (!dbUser) notFound()

  // Lọc khảo sát theo audience
  const audienceFilter: ("ALL" | "BOTH_VIP" | "BUSINESS" | "INDIVIDUAL")[] =
    dbUser.role === "VIP" ? ["ALL", "BOTH_VIP", dbUser.accountType] : ["ALL"]

  const surveys = await prisma.survey.findMany({
    where: {
      status: "ACTIVE",
      audience: { in: audienceFilter },
    },
    orderBy: { createdAt: "desc" },
    include: {
      responses: {
        where: { userId: session.user.id },
        select: { id: true, submittedAt: true, recommendedTier: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Khảo sát</h1>
        <p className="text-sm text-brand-500 mt-1">Tham gia khảo sát giúp Hội phục vụ bạn tốt hơn</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {surveys.length === 0 && (
          <div className="rounded-xl border border-brand-200 bg-white p-8 text-center text-brand-500 italic sm:col-span-2">
            Hiện chưa có khảo sát nào đang chạy.
          </div>
        )}
        {surveys.map((s) => {
          const done = s.responses.length > 0
          return (
            <Link
              key={s.id}
              href={`/khao-sat/${s.slug}`}
              className="block rounded-xl border-2 border-brand-200 bg-white p-5 hover:border-brand-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-semibold text-brand-900">{s.title}</h2>
                {done && (
                  <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                    Đã trả lời
                  </span>
                )}
              </div>
              {s.description && <p className="text-sm text-brand-600 line-clamp-2">{s.description}</p>}
              <p className="mt-3 text-xs text-brand-500">
                {done ? "Xem lại / sửa câu trả lời →" : "Bắt đầu khảo sát →"}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
