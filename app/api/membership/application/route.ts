import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST — User nộp đơn xin kết nạp chính thức
// Điều lệ Hội, Điều 11: BCH xét hồ sơ → Chủ tịch quyết định trong 30 ngày
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { reason, requestedCategory, representativeName, representativePosition } = body

  // Validate
  if (typeof reason !== "string" || reason.trim().length < 20) {
    return NextResponse.json(
      { error: "Lý do xin gia nhập phải có ít nhất 20 ký tự" },
      { status: 400 },
    )
  }
  if (reason.length > 2000) {
    return NextResponse.json(
      { error: "Lý do không được vượt quá 2000 ký tự" },
      { status: 400 },
    )
  }

  const validCategories = ["OFFICIAL", "AFFILIATE", "HONORARY"]
  const category = validCategories.includes(requestedCategory)
    ? requestedCategory
    : "OFFICIAL"

  // Idempotency: block if user already has a PENDING application
  const existing = await prisma.membershipApplication.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
  })
  if (existing) {
    return NextResponse.json(
      { error: "Bạn đã có đơn đang chờ xét duyệt." },
      { status: 409 },
    )
  }

  // Nếu user là OFFICIAL rồi thì không cần nộp
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { memberCategory: true, accountType: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Với tổ chức, phải có representative
  if (user.accountType === "BUSINESS") {
    if (!representativeName || typeof representativeName !== "string" || !representativeName.trim()) {
      return NextResponse.json(
        { error: "Tổ chức phải chỉ định người đại diện" },
        { status: 400 },
      )
    }
  }

  const application = await prisma.membershipApplication.create({
    data: {
      userId: session.user.id,
      reason: reason.trim(),
      requestedCategory: category,
      representativeName: representativeName?.trim() || null,
      representativePosition: representativePosition?.trim() || null,
      status: "PENDING",
    },
  })

  return NextResponse.json({ ok: true, applicationId: application.id })
}

// GET — User xem trạng thái đơn của mình
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const applications = await prisma.membershipApplication.findMany({
    where: { userId: session.user.id },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      status: true,
      requestedCategory: true,
      submittedAt: true,
      reviewedAt: true,
      rejectReason: true,
    },
  })

  return NextResponse.json({ applications })
}
