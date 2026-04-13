import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { SurveyAnswers, SurveyQuestion } from "@/lib/survey/types"

export const revalidate = 0

export default async function SurveyResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string; responseId: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") notFound()

  const { id, responseId } = await params

  const [survey, response] = await Promise.all([
    prisma.survey.findUnique({ where: { id } }),
    prisma.surveyResponse.findUnique({
      where: { id: responseId },
      include: {
        user: { select: { id: true, name: true, email: true, accountType: true, phone: true } },
      },
    }),
  ])

  if (!survey || !response || response.surveyId !== id) notFound()

  const questions = (survey.questions as unknown as SurveyQuestion[]) ?? []
  const answers = response.answers as unknown as SurveyAnswers

  // Tìm consultation requests trùng email/phone để admin biết có follow-up chưa
  const relatedConsultations = await prisma.consultationRequest.findMany({
    where: {
      OR: [
        response.contactEmail ? { email: response.contactEmail } : {},
        response.contactPhone ? { phone: response.contactPhone } : {},
        response.userId ? { userId: response.userId } : {},
      ].filter((x) => Object.keys(x).length > 0),
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const name = response.contactName ?? response.user?.name ?? "—"
  const email = response.contactEmail ?? response.user?.email ?? null
  const phone = response.contactPhone ?? response.user?.phone ?? null

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href={`/admin/khao-sat/${id}/ket-qua`}
        className="text-sm text-brand-600 hover:underline"
      >
        ← Danh sách phản hồi
      </Link>

      {/* Header: người trả lời + kết quả gợi ý */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-brand-200 bg-white p-6">
          <div className="flex items-start gap-4">
            {response.logoUrl && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-brand-200 bg-brand-50 shrink-0">
                <Image src={response.logoUrl} alt="" fill className="object-contain" sizes="64px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-brand-900">{name}</h1>
              {response.companyName && (
                <p className="text-sm text-brand-700 mt-0.5 font-medium">{response.companyName}</p>
              )}
              <div className="mt-3 space-y-1 text-sm">
                {email && (
                  <div>
                    <span className="text-brand-500">Email: </span>
                    <a href={`mailto:${email}`} className="text-brand-700 hover:underline">{email}</a>
                  </div>
                )}
                {phone && (
                  <div>
                    <span className="text-brand-500">SĐT: </span>
                    <a href={`tel:${phone}`} className="text-brand-700 hover:underline">{phone}</a>
                  </div>
                )}
                <div className="text-xs text-brand-500 pt-1">
                  Loại: <span className="font-semibold text-brand-700">{response.submitterType ?? response.user?.accountType ?? "—"}</span>
                  {" · "}
                  Nguồn:{" "}
                  {response.userId ? (
                    <Link href={`/admin/hoi-vien/${response.userId}`} className="text-brand-700 hover:underline">
                      Hội viên hệ thống
                    </Link>
                  ) : (
                    <span className="text-amber-700">Anon (public)</span>
                  )}
                </div>
                <div className="text-xs text-brand-500">
                  Submit: {response.submittedAt.toLocaleString("vi-VN")}
                  {response.submitterIp && <> · IP: <span className="font-mono">{response.submitterIp}</span></>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-brand-500">Gợi ý gói</p>
          <p className="text-3xl font-bold text-amber-800 mt-1">
            {response.recommendedTier ?? "—"}
          </p>
          <p className="text-sm text-brand-600 mt-2">Điểm: <span className="font-bold">{response.score ?? 0}</span></p>
        </div>
      </div>

      {/* Answers */}
      <div className="rounded-xl border border-brand-200 bg-white overflow-hidden">
        <div className="border-b bg-brand-50 px-5 py-3">
          <h2 className="font-semibold text-brand-900">Chi tiết câu trả lời</h2>
          <p className="text-xs text-brand-500 mt-0.5">{questions.length} câu hỏi</p>
        </div>
        <div className="divide-y">
          {questions.map((q, i) => {
            const val = answers[q.id]
            return (
              <div key={q.id} className="p-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-brand-400">#{i + 1}</span>
                  <h3 className="text-sm font-semibold text-brand-900">{q.label}</h3>
                  {q.required && <span className="text-[10px] text-red-500">*</span>}
                </div>
                {q.helpText && <p className="text-xs text-brand-500 mt-0.5">{q.helpText}</p>}
                <div className="mt-2 pl-6">
                  <AnswerValue value={val} question={q} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Related consultations */}
      <div className="rounded-xl border border-brand-200 bg-white overflow-hidden">
        <div className="border-b bg-brand-50 px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-brand-900">Yêu cầu tư vấn liên quan</h2>
            <p className="text-xs text-brand-500 mt-0.5">
              Khớp theo email / SĐT / hội viên
            </p>
          </div>
          <Link href="/admin/tu-van" className="text-xs text-brand-700 hover:underline">
            Tất cả yêu cầu →
          </Link>
        </div>
        <div className="divide-y">
          {relatedConsultations.length === 0 && (
            <div className="p-5 text-sm text-brand-500 italic">Chưa có yêu cầu tư vấn nào từ người này.</div>
          )}
          {relatedConsultations.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium text-brand-800">{c.fullName} — {c.phone}</div>
                <div className="text-xs text-brand-500">{c.createdAt.toLocaleString("vi-VN")} · {c.context ?? "—"}</div>
                {c.note && <div className="text-xs text-brand-600 italic mt-1">"{c.note}"</div>}
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                c.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                c.status === "CONTACTED" ? "bg-blue-100 text-blue-800" :
                c.status === "DONE" ? "bg-emerald-100 text-emerald-800" :
                "bg-brand-100 text-brand-600"
              }`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnswerValue({ value, question }: { value: SurveyAnswers[string]; question: SurveyQuestion }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-sm text-brand-400 italic">(Không trả lời)</span>
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((v) => (
          <span key={String(v)} className="inline-flex rounded-md bg-brand-100 text-brand-800 px-2 py-1 text-xs font-medium">
            {String(v)}
          </span>
        ))}
      </div>
    )
  }

  if (question.type === "textarea") {
    return <p className="text-sm text-brand-800 whitespace-pre-line leading-relaxed">{String(value)}</p>
  }

  if (question.type === "scale") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-brand-900">{String(value)}</span>
        <span className="text-xs text-brand-500">/ 5</span>
      </div>
    )
  }

  return <p className="text-sm text-brand-800 font-medium">{String(value)}</p>
}
