import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import type { HonoraryCategory } from "@prisma/client"

const VALID_CATEGORIES: HonoraryCategory[] = ["RESEARCH", "LOGISTICS", "EXTERNAL_RELATIONS", "OTHER"]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { userId, creditAmount, reason, category, extendMonths } = body as {
    userId?: string
    creditAmount?: number
    reason?: string
    category?: string
    extendMonths?: number
  }

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId bắt buộc" }, { status: 400 })
  }
  if (typeof creditAmount !== "number" || creditAmount <= 0 || !Number.isFinite(creditAmount)) {
    return NextResponse.json({ error: "Số tiền quy đổi phải lớn hơn 0" }, { status: 400 })
  }
  if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
    return NextResponse.json({ error: "Lý do phải ít nhất 10 ký tự" }, { status: 400 })
  }
  if (!category || !VALID_CATEGORIES.includes(category as HonoraryCategory)) {
    return NextResponse.json({ error: "Danh mục không hợp lệ" }, { status: 400 })
  }
  const months = typeof extendMonths === "number" && extendMonths >= 0 ? Math.floor(extendMonths) : 12

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, membershipExpires: true, contributionTotal: true, isActive: true },
  })
  if (!target) return NextResponse.json({ error: "Hội viên không tồn tại" }, { status: 404 })
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Không ghi nhận cho tài khoản ADMIN" }, { status: 400 })
  }

  const creditInt = Math.floor(creditAmount)

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.honoraryContribution.create({
      data: {
        userId,
        creditAmount: creditInt,
        reason: reason.trim(),
        category: category as HonoraryCategory,
        extendMonths: months,
        createdByAdminId: session.user!.id!,
      },
    })

    const newContrib = target.contributionTotal + creditInt
    const newPriority = Math.floor(newContrib / 1_000_000)

    let newExpiry: Date | null = target.membershipExpires
    if (months > 0) {
      const baseDate =
        target.membershipExpires && target.membershipExpires > new Date()
          ? target.membershipExpires
          : new Date()
      newExpiry = new Date(baseDate)
      newExpiry.setMonth(newExpiry.getMonth() + months)
    }

    const willBumpToVip = target.role === "GUEST" && months > 0

    await tx.user.update({
      where: { id: userId },
      data: {
        contributionTotal: newContrib,
        displayPriority: newPriority,
        ...(months > 0 && newExpiry ? { membershipExpires: newExpiry } : {}),
        ...(target.isActive ? {} : { isActive: true }),
        // Phase 3.7 round 4 (2026-04): bump GUEST → VIP khi admin ghi nhận
        // honorary contribution + extend membership. Trước đây chỉ Payment
        // confirm flow bump role → hội viên cũ được honorary credit vẫn
        // stuck role=GUEST → không xuất hiện ở /vi/hoi-vien (filter VIP+).
        ...(willBumpToVip && { role: "VIP" as const }),
      },
    })

    // Phase 3.7 round 4 (2026-04): khi user lên VIP, auto-publish DN của họ
    // (nếu có) để admin đỡ quên 1 bước thủ công. Idempotent — Prisma
    // updateMany với where.isPublished:false đảm bảo không touch DN đã public.
    if (willBumpToVip) {
      await tx.company.updateMany({
        where: { ownerId: userId, isPublished: false },
        data: { isPublished: true },
      })
    }

    // Phase 3.7 round 4 (2026-04): dùng `newPriority` (displayPriority
    // style) thay vì `newContrib` raw VND — match POST /api/posts logic.
    await tx.post.updateMany({
      where: { authorId: userId },
      data: { authorPriority: newPriority },
    })

    return record
  })

  return NextResponse.json({ success: true, id: result.id })
}
