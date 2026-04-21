import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await params
  const { enable } = (await req.json()) as { enable?: boolean }

  if (typeof enable !== "boolean") {
    return NextResponse.json({ error: "enable phải là boolean" }, { status: 400 })
  }

  // Nếu disable: đảm bảo user không đang có review PENDING nào (tránh đơn bị kẹt không ai vote được)
  if (!enable) {
    const pending = await prisma.certificationReview.count({
      where: { reviewerId: userId, vote: "PENDING" },
    })
    if (pending > 0) {
      return NextResponse.json(
        { error: `Không thể gỡ: user đang có ${pending} đơn chờ vote. Hoàn thành trước hoặc thay thẩm định viên.` },
        { status: 409 },
      )
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isCouncilMember: enable },
  })

  return NextResponse.json({ success: true, isCouncilMember: enable })
}
