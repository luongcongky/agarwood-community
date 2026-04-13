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
import { checkRateLimit, getClientIp } from "@/lib/survey/rate-limit"

interface Body {
  answers?: SurveyAnswers
  contact?: {
    name?: string
    email?: string
    phone?: string
    avatarUrl?: string
    companyName?: string
    logoUrl?: string
    submitterType?: "INDIVIDUAL" | "BUSINESS"
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[\d\s+()-]{8,15}$/

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(`submit:${ip}`, 10, 60 * 60 * 1000) // 10 submissions / giờ / IP
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Quá nhiều yêu cầu, vui lòng thử lại sau ${Math.ceil(rl.resetInMs / 60_000)} phút` },
      { status: 429 }
    )
  }

  const { slug } = await params
  const session = await auth()
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body?.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "Thiếu answers" }, { status: 400 })
  }

  const survey = await prisma.survey.findUnique({ where: { slug } })
  if (!survey) return NextResponse.json({ error: "Khảo sát không tồn tại" }, { status: 404 })
  if (survey.status !== "ACTIVE") {
    return NextResponse.json({ error: "Khảo sát đang đóng" }, { status: 409 })
  }

  // Validate contact (bắt buộc nếu anon, optional nếu đã login)
  const contact = body.contact ?? {}
  const isAnon = !session?.user?.id
  if (isAnon) {
    if (!contact.name || contact.name.trim().length < 2) {
      return NextResponse.json({ error: "Vui lòng nhập họ tên" }, { status: 400 })
    }
    if (!contact.email || !EMAIL_RE.test(contact.email.trim())) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 })
    }
    if (!contact.phone || !PHONE_RE.test(contact.phone.trim())) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 })
    }
  }

  const questions = survey.questions as unknown as SurveyQuestion[]
  const config = (survey.config as unknown as SurveyConfig | null) ?? null

  const errors = validateAnswers(questions, body.answers)
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 })
  }

  const score = calcScore(questions, body.answers)
  const tier = recommendTier(score, config)

  const response = await prisma.surveyResponse.create({
    data: {
      surveyId: survey.id,
      userId: session?.user?.id ?? null,
      contactName: contact.name?.trim() || null,
      contactEmail: contact.email?.trim().toLowerCase() || null,
      contactPhone: contact.phone?.trim() || null,
      avatarUrl: contact.avatarUrl?.trim() || null,
      companyName: contact.companyName?.trim() || null,
      logoUrl: contact.logoUrl?.trim() || null,
      submitterType: contact.submitterType || null,
      answers: body.answers,
      score,
      recommendedTier: tier,
      submitterIp: ip,
    },
  })

  // Mirror answers → profile chỉ khi có user đã login (best-effort)
  if (session?.user?.id) {
    try {
      await syncAnswersToProfile(session.user.id, questions, body.answers)
    } catch (e) {
      console.error("syncAnswersToProfile failed:", e)
    }
  }

  return NextResponse.json({ id: response.id, score, recommendedTier: tier })
}
