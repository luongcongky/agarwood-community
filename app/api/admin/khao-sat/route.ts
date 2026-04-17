import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { validateQuestionsSchema } from "@/lib/survey"
import type { SurveyAudience, SurveyStatus } from "@prisma/client"

const VALID_AUDIENCE: SurveyAudience[] = ["ALL", "BUSINESS", "INDIVIDUAL", "BOTH_VIP"]
const VALID_STATUS: SurveyStatus[] = ["DRAFT", "ACTIVE", "CLOSED"]

interface Body {
  slug?: string
  title?: string
  title_en?: string | null
  title_zh?: string | null
  description?: string | null
  description_en?: string | null
  description_zh?: string | null
  audience?: SurveyAudience
  status?: SurveyStatus
  questions?: unknown
  config?: unknown
  startsAt?: string | null
  endsAt?: string | null
}

// POST /api/admin/khao-sat — tạo survey mới
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 })

  const slug = body.slug?.trim()
  const title = body.title?.trim()
  if (!slug || !/^[a-z0-9-]{3,80}$/.test(slug)) {
    return NextResponse.json({ error: "Slug phải gồm chữ thường, số, dấu '-', 3-80 ký tự" }, { status: 400 })
  }
  if (!title || title.length < 3) {
    return NextResponse.json({ error: "Title quá ngắn" }, { status: 400 })
  }
  const audience = body.audience && VALID_AUDIENCE.includes(body.audience) ? body.audience : "BOTH_VIP"
  const status = body.status && VALID_STATUS.includes(body.status) ? body.status : "DRAFT"

  const qErrors = validateQuestionsSchema(body.questions ?? [])
  if (qErrors.length) return NextResponse.json({ error: qErrors.join("; ") }, { status: 400 })

  const exists = await prisma.survey.findUnique({ where: { slug } })
  if (exists) return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 })

  const survey = await prisma.survey.create({
    data: {
      slug,
      title,
      title_en: body.title_en?.trim() || null,
      title_zh: body.title_zh?.trim() || null,
      description: body.description?.trim() || null,
      description_en: body.description_en?.trim() || null,
      description_zh: body.description_zh?.trim() || null,
      audience,
      status,
      questions: body.questions as object,
      config: (body.config as object) ?? undefined,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    },
  })
  return NextResponse.json({ survey }, { status: 201 })
}
