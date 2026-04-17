import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { SurveyTakeForm } from "./SurveyTakeForm"
import type { SurveyQuestion } from "@/lib/survey/types"

export const revalidate = 0

export default async function PublicTakeSurveyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const survey = await prisma.survey.findUnique({
    where: { slug },
    select: {
      slug: true, title: true, description: true, status: true,
      audience: true, questions: true, config: true,
    },
  })
  if (!survey || survey.status !== "ACTIVE") notFound()

  const session = await auth()
  const loggedInUser = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, phone: true, avatarUrl: true, company: { select: { name: true, logoUrl: true } } },
      })
    : null

  const questions = (survey.questions as unknown as SurveyQuestion[]) ?? []
  const submitterType = survey.audience === "BUSINESS" ? "BUSINESS" : survey.audience === "INDIVIDUAL" ? "INDIVIDUAL" : null

  return (
    <div className="bg-brand-50/60 min-h-screen">
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <Link href="/khao-sat" className="text-sm text-brand-600 hover:underline">← Chọn loại khác</Link>

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
        submitterType={submitterType}
        questions={questions}
        prefill={loggedInUser ? {
          name: loggedInUser.name ?? "",
          email: loggedInUser.email ?? "",
          phone: loggedInUser.phone ?? "",
          avatarUrl: loggedInUser.avatarUrl ?? "",
          companyName: loggedInUser.company?.name ?? "",
          logoUrl: loggedInUser.company?.logoUrl ?? "",
        } : null}
      />
    </div>
    </div>
  )
}
