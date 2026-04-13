import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SurveyEditor } from "../SurveyEditor"
import type { SurveyQuestion } from "@/lib/survey/types"

export const revalidate = 0

export default async function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") notFound()

  const { id } = await params
  const survey = await prisma.survey.findUnique({ where: { id } })
  if (!survey) notFound()

  return (
    <div className="space-y-4">
      <Link href="/admin/khao-sat" className="text-sm text-brand-600 hover:underline">← Quay lại danh sách</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Sửa khảo sát</h1>
        <Link href={`/admin/khao-sat/${id}/ket-qua`} className="text-sm font-semibold text-brand-700 hover:underline">Xem kết quả →</Link>
      </div>
      <SurveyEditor
        initial={{
          id: survey.id,
          slug: survey.slug,
          title: survey.title,
          description: survey.description,
          audience: survey.audience,
          status: survey.status,
          questions: (survey.questions as unknown as SurveyQuestion[]) ?? [],
          config: (survey.config as { recommendation?: { silverFrom?: number; goldFrom?: number } } | null) ?? null,
        }}
      />
    </div>
  )
}
