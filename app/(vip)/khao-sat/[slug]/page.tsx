import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SurveyTakeForm } from "./SurveyTakeForm"
import { DigitalPlatformHero } from "@/components/features/survey/DigitalPlatformHero"
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

  const showHero = !existing  // chỉ hiện hero lần đầu, khi sửa lại thì ẩn

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/khao-sat" className="text-sm text-brand-600 hover:underline">← Danh sách khảo sát</Link>

      {showHero && <DigitalPlatformHero />}

      <div className="rounded-2xl border-2 border-brand-300 bg-brand-50/50 p-6">
        <h1 className="text-2xl font-bold text-brand-900">{survey.title}</h1>
        {survey.description && (
          <div className="text-sm text-brand-700 mt-3 whitespace-pre-line leading-relaxed">
            {survey.description}
          </div>
        )}
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
