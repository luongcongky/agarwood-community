import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { SurveyAnswers, SurveyQuestion } from "@/lib/survey/types"

export const revalidate = 0

export default async function SurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") notFound()

  const { id } = await params
  const survey = await prisma.survey.findUnique({ where: { id } })
  if (!survey) notFound()

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId: id },
    include: { user: { select: { name: true, email: true, accountType: true } } },
    orderBy: { submittedAt: "desc" },
    take: 300,
  })

  const questions = (survey.questions as unknown as SurveyQuestion[]) ?? []
  const total = responses.length
  const goldCount = responses.filter((r) => r.recommendedTier === "GOLD").length
  const silverCount = responses.filter((r) => r.recommendedTier === "SILVER").length
  const anonCount = responses.filter((r) => !r.userId).length

  return (
    <div className="space-y-6">
      <Link href="/admin/khao-sat" className="text-sm text-brand-600 hover:underline">← Quay lại</Link>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{survey.title}</h1>
          <p className="text-sm text-brand-500 mt-1">Kết quả khảo sát ({total} phản hồi, {anonCount} anon)</p>
        </div>
        <a
          href={`/api/admin/khao-sat/${id}/export`}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Xuất CSV
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Tổng phản hồi" value={total} />
        <Stat label="Anon (chưa login)" value={anonCount} />
        <Stat label="Gợi ý gói Vàng" value={goldCount} />
        <Stat label="Gợi ý gói Bạc" value={silverCount} />
      </div>

      <div className="rounded-xl border border-brand-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-brand-50 text-xs uppercase text-brand-500">
              <tr>
                <th className="px-4 py-3 text-left">Người trả lời</th>
                <th className="px-4 py-3 text-left">Doanh nghiệp</th>
                <th className="px-4 py-3 text-left">Liên hệ</th>
                <th className="px-4 py-3 text-center">Loại</th>
                <th className="px-4 py-3 text-right">Điểm</th>
                <th className="px-4 py-3 text-left">Gợi ý</th>
                <th className="px-4 py-3 text-left">Submit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {responses.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-brand-500 italic">Chưa có phản hồi.</td></tr>
              )}
              {responses.map((r) => {
                const name = r.contactName ?? r.user?.name ?? "—"
                const email = r.contactEmail ?? r.user?.email ?? null
                const phone = r.contactPhone ?? null
                const type = r.submitterType ?? r.user?.accountType ?? "—"
                return (
                  <tr key={r.id} className="hover:bg-brand-50/50 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-900">{name}</div>
                      {r.user && <div className="text-[10px] text-brand-400">(hội viên)</div>}
                      {!r.userId && <div className="text-[10px] text-amber-600">(anon)</div>}
                    </td>
                    <td className="px-4 py-3">
                      {r.companyName && (
                        <div className="flex items-center gap-2">
                          {r.logoUrl && (
                            <div className="relative w-8 h-8 rounded border bg-white shrink-0">
                              <Image src={r.logoUrl} alt="" fill className="object-contain" sizes="32px" />
                            </div>
                          )}
                          <span className="text-xs text-brand-700">{r.companyName}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {email && <div className="text-brand-700">{email}</div>}
                      {phone && <div className="text-brand-500">{phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-brand-600">{type}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.score ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.recommendedTier === "GOLD" ? "bg-amber-100 text-amber-800" :
                        r.recommendedTier === "SILVER" ? "bg-slate-200 text-slate-800" :
                        "bg-brand-100 text-brand-600"
                      }`}>{r.recommendedTier ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-500">{r.submittedAt.toLocaleString("vi-VN")}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <details className="rounded-xl border border-brand-200 bg-white p-4">
        <summary className="cursor-pointer font-semibold text-brand-700">Xem chi tiết answers</summary>
        <div className="mt-3 space-y-4">
          {responses.map((r) => {
            const a = r.answers as unknown as SurveyAnswers
            return (
              <div key={r.id} className="border-t border-brand-100 pt-2">
                <div className="text-xs font-semibold text-brand-700">
                  {r.contactName ?? r.user?.name} {r.companyName && `— ${r.companyName}`}
                </div>
                {questions.map((q) => (
                  <div key={q.id} className="text-xs text-brand-600 mt-1">
                    <span className="font-medium">{q.label}:</span>{" "}
                    {Array.isArray(a[q.id]) ? (a[q.id] as string[]).join(", ") : String(a[q.id] ?? "—")}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-brand-200 bg-white p-5">
      <div className="text-3xl font-bold text-brand-900">{value}</div>
      <div className="text-xs text-brand-500 mt-1">{label}</div>
    </div>
  )
}
