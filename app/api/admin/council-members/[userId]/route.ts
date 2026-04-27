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

  // Dual-write trong transaction: giữ `User.isCouncilMember` (legacy, UI cũ
  // đọc) + đồng bộ CommitteeMembership(THAM_DINH) (hệ thống mới dùng cho
  // permission `cert:review`). Khi drop `isCouncilMember` ở sprint sau chỉ
  // cần xoá 1 câu update.
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { isCouncilMember: enable },
    })
    if (enable) {
      await tx.committeeMembership.upsert({
        where: { userId_committee: { userId, committee: "THAM_DINH" } },
        create: {
          userId,
          committee: "THAM_DINH",
          assignedBy: session.user.id,
        },
        update: {},
      })
    } else {
      await tx.committeeMembership.deleteMany({
        where: { userId, committee: "THAM_DINH" },
      })
    }
  })

  return NextResponse.json({ success: true, isCouncilMember: enable })
}
