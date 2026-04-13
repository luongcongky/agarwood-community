import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/survey/rate-limit"

interface Body {
  fullName?: string
  phone?: string
  email?: string
  companyName?: string
  note?: string
  context?: string
  recommendedTier?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[\d\s+()-]{8,15}$/

// POST /api/tu-van — public, accept anon (từ kết quả khảo sát)
export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(`tuvan:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Quá nhiều yêu cầu, thử lại sau ${Math.ceil(rl.resetInMs / 60_000)} phút` },
      { status: 429 }
    )
  }

  const session = await auth()
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 })

  const fullName = body.fullName?.trim()
  const phone = body.phone?.trim()
  const email = body.email?.trim()

  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: "Vui lòng nhập họ tên" }, { status: 400 })
  }
  if (!phone || !PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 })
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 })
  }

  const created = await prisma.consultationRequest.create({
    data: {
      userId: session?.user?.id ?? null,
      fullName,
      phone,
      email: email || null,
      companyName: body.companyName?.trim() || null,
      note: body.note?.trim() || null,
      context: body.context?.trim() || null,
      recommendedTier: body.recommendedTier?.trim() || null,
    },
  })

  return NextResponse.json({ id: created.id }, { status: 201 })
}
