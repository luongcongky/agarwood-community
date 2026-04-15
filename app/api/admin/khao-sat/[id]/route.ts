import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin, canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { validateQuestionsSchema } from "@/lib/survey"
import type { SurveyAudience, SurveyStatus } from "@prisma/client"

const VALID_AUDIENCE: SurveyAudience[] = ["ALL", "BUSINESS", "INDIVIDUAL", "BOTH_VIP"]
const VALID_STATUS: SurveyStatus[] = ["DRAFT", "ACTIVE", "CLOSED"]

// GET /api/admin/khao-sat/[id]
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const survey = await prisma.survey.findUnique({ where: { id } })
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ survey })
}

// PATCH /api/admin/khao-sat/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (typeof body.title === "string" && body.title.trim().length >= 3) data.title = body.title.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.audience && VALID_AUDIENCE.includes(body.audience)) data.audience = body.audience
  if (body.status && VALID_STATUS.includes(body.status)) data.status = body.status
  if (body.questions !== undefined) {
    const errs = validateQuestionsSchema(body.questions)
    if (errs.length) return NextResponse.json({ error: errs.join("; ") }, { status: 400 })
    data.questions = body.questions
  }
  if (body.config !== undefined) data.config = body.config
  if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null
  if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null

  const survey = await prisma.survey.update({ where: { id }, data })
  return NextResponse.json({ survey })
}

// DELETE /api/admin/khao-sat/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  await prisma.survey.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
