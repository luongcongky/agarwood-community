import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { SurveyAnswers, SurveyQuestion } from "@/lib/survey"

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ""
  const s = Array.isArray(v) ? v.join("; ") : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// GET /api/admin/khao-sat/[id]/export — trả CSV
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 })
  }
  const { id } = await params
  const survey = await prisma.survey.findUnique({ where: { id } })
  if (!survey) return new Response("Not found", { status: 404 })

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId: id },
    include: { user: { select: { name: true, email: true, accountType: true } } },
    orderBy: { submittedAt: "desc" },
  })

  const questions = survey.questions as unknown as SurveyQuestion[]
  const headers = [
    "Họ tên",
    "Email",
    "SĐT",
    "Avatar URL",
    "Doanh nghiệp",
    "Logo URL",
    "Loại",
    "Nguồn",
    "Submitted",
    "Score",
    "Recommended",
    ...questions.map((q) => q.label),
  ]
  const rows = responses.map((r) => {
    const a = r.answers as unknown as SurveyAnswers
    const source = r.userId ? `Hội viên: ${r.user?.name ?? ""}` : "Anon (public)"
    return [
      r.contactName ?? r.user?.name ?? "",
      r.contactEmail ?? r.user?.email ?? "",
      r.contactPhone ?? "",
      r.avatarUrl ?? "",
      r.companyName ?? "",
      r.logoUrl ?? "",
      r.submitterType ?? r.user?.accountType ?? "",
      source,
      r.submittedAt.toISOString(),
      r.score ?? "",
      r.recommendedTier ?? "",
      ...questions.map((q) => a[q.id] ?? ""),
    ]
  })

  const csv =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${survey.slug}-responses.csv"`,
    },
  })
}
