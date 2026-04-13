import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SurveyTakeForm } from "./SurveyTakeForm"
import type { SurveyAnswers, SurveyQuestion } from "@/lib/survey/types"

export const revalidate = 0

export default async function TakeSurveyPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user?.id) notFound()

  const { slug } = await params
  const survey = await prisma.survey.findUnique({
    where: { slug },
    include: {
      responses: {
        where: { userId: session.user.id },
        select: { answers: true, score: true, recommendedTier: true },
      },
    },
  })
  if (!survey || survey.status !== "ACTIVE") notFound()

  const existing = survey.responses[0] ?? null
  const questions = (survey.questions as unknown as SurveyQuestion[]) ?? []

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Link href="/khao-sat" className="text-sm text-brand-600 hover:underline">← Danh sách khảo sát</Link>
      <div>
        <h1 className="text-2xl font-bold text-brand-900">{survey.title}</h1>
        {survey.description && <p className="text-sm text-brand-600 mt-2">{survey.description}</p>}
      </div>
      <SurveyTakeForm
        slug={survey.slug}
        questions={questions}
        initialAnswers={(existing?.answers as unknown as SurveyAnswers) ?? {}}
        existingTier={existing?.recommendedTier ?? null}
      />
    </div>
  )
}
