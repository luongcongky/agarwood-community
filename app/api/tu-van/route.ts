import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Body {
  fullName?: string
  phone?: string
  email?: string
  note?: string
  context?: string
  recommendedTier?: string
}

// POST /api/tu-van — gửi yêu cầu tư vấn (thường từ kết quả khảo sát)
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 })

  const fullName = body.fullName?.trim()
  const phone = body.phone?.trim()
  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: "Vui lòng nhập họ tên" }, { status: 400 })
  }
  if (!phone || !/^[\d\s+()-]{8,15}$/.test(phone)) {
    return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 })
  }

  const created = await prisma.consultationRequest.create({
    data: {
      userId: session.user.id,
      fullName,
      phone,
      email: body.email?.trim() || null,
      note: body.note?.trim() || null,
      context: body.context?.trim() || null,
      recommendedTier: body.recommendedTier?.trim() || null,
    },
  })

  return NextResponse.json({ id: created.id }, { status: 201 })
}
