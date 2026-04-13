import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  type SurveyAnswers,
  type SurveyConfig,
  type SurveyQuestion,
  calcScore,
  recommendTier,
  syncAnswersToProfile,
  validateAnswers,
} from "@/lib/survey"

// POST /api/khao-sat/[slug]/submit
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 })
  }

  const { slug } = await params
  const body = (await request.json().catch(() => null)) as { answers?: SurveyAnswers } | null
  if (!body?.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "Thiếu answers" }, { status: 400 })
  }

  const survey = await prisma.survey.findUnique({ where: { slug } })
  if (!survey) return NextResponse.json({ error: "Khảo sát không tồn tại" }, { status: 404 })
  if (survey.status !== "ACTIVE") {
    return NextResponse.json({ error: "Khảo sát đang đóng" }, { status: 409 })
  }

  // Audience check
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountType: true, role: true },
  })
  if (!dbUser) return NextResponse.json({ error: "User không tồn tại" }, { status: 404 })
  if (
    (survey.audience === "BUSINESS" && dbUser.accountType !== "BUSINESS") ||
    (survey.audience === "INDIVIDUAL" && dbUser.accountType !== "INDIVIDUAL") ||
    (survey.audience === "BOTH_VIP" && dbUser.role !== "VIP")
  ) {
    return NextResponse.json({ error: "Bạn không thuộc đối tượng khảo sát" }, { status: 403 })
  }

  const questions = survey.questions as unknown as SurveyQuestion[]
  const config = (survey.config as unknown as SurveyConfig | null) ?? null

  const errors = validateAnswers(questions, body.answers)
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 })
  }

  const score = calcScore(questions, body.answers)
  const tier = recommendTier(score, config)

  // Upsert response
  const response = await prisma.surveyResponse.upsert({
    where: { surveyId_userId: { surveyId: survey.id, userId: session.user.id } },
    create: {
      surveyId: survey.id,
      userId: session.user.id,
      answers: body.answers,
      score,
      recommendedTier: tier,
    },
    update: {
      answers: body.answers,
      score,
      recommendedTier: tier,
      submittedAt: new Date(),
    },
  })

  // Mirror sang profile (best-effort, không block response)
  try {
    await syncAnswersToProfile(session.user.id, questions, body.answers)
  } catch (e) {
    console.error("syncAnswersToProfile failed:", e)
  }

  return NextResponse.json({ id: response.id, score, recommendedTier: tier })
}
