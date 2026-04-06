import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      type: true,
      amount: true,
      status: true,
      membershipId: true,
      certificationId: true,
      user: { select: { name: true, email: true } },
    },
  })
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "Thanh toán này đã được xử lý" }, { status: 400 })
  }

  if (payment.type === "MEMBERSHIP_FEE" && payment.membershipId) {
    // Run all updates in a single transaction
    await prisma.$transaction(async (tx) => {
      // 1. Mark payment SUCCESS
      await tx.payment.update({
        where: { id },
        data: { status: "SUCCESS" },
      })

      // 2. Get current user state
      const user = await tx.user.findUnique({
        where: { id: payment.userId },
        select: { membershipExpires: true, contributionTotal: true },
      })

      // 3. Stack expiry from current or existing, whichever is later
      const baseDate =
        user?.membershipExpires && user.membershipExpires > new Date()
          ? user.membershipExpires
          : new Date()
      const newExpiry = new Date(baseDate)
      newExpiry.setFullYear(newExpiry.getFullYear() + 1)

      const newContrib = (user?.contributionTotal ?? 0) + payment.amount
      const newPriority = Math.floor(newContrib / 1_000_000)

      // 4. Update membership
      await tx.membership.update({
        where: { id: payment.membershipId! },
        data: { status: "ACTIVE", validFrom: new Date(), validTo: newExpiry },
      })

      // 5. Update user
      await tx.user.update({
        where: { id: payment.userId },
        data: {
          membershipExpires: newExpiry,
          contributionTotal: newContrib,
          displayPriority: newPriority,
        },
      })

      // 6. Update authorPriority on all user's posts
      await tx.post.updateMany({
        where: { authorId: payment.userId },
        data: { authorPriority: newContrib },
      })
    })

    // Email VIP — outside transaction (non-critical)
    try {
      const newExpiry = new Date()
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { membershipExpires: true },
      })
      const expiryStr = user?.membershipExpires
        ? user.membershipExpires.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
        : ""

      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: payment.user.email,
        subject: "Membership đã được kích hoạt - Hội Trầm Hương Việt Nam",
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Xin chào ${payment.user.name},</h2>
            <p>Chuyển khoản phí hội viên <strong>${payment.amount.toLocaleString("vi-VN")}đ</strong> của bạn đã được xác nhận.</p>
            <p>Membership có hiệu lực đến: <strong>${expiryStr}</strong></p>
            <p>Cảm ơn bạn đã đóng góp cho Hội Trầm Hương Việt Nam!</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send VIP confirmation email:", err)
    }
  } else if (payment.type === "CERTIFICATION_FEE" && payment.certificationId) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id }, data: { status: "SUCCESS" } }),
      prisma.certification.update({
        where: { id: payment.certificationId },
        data: { status: "PENDING" },
      }),
    ])

    // Email VIP
    try {
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: payment.user.email,
        subject: "Phí chứng nhận đã được xác nhận - Hội Trầm Hương Việt Nam",
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Xin chào ${payment.user.name},</h2>
            <p>Phí chứng nhận sản phẩm <strong>${payment.amount.toLocaleString("vi-VN")}đ</strong> đã được xác nhận.</p>
            <p>Hồ sơ của bạn đang được chuyển sang bước xét duyệt.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Failed to send cert confirmation email:", err)
    }
  } else {
    // Generic payment (MEDIA_SERVICE etc.)
    await prisma.payment.update({ where: { id }, data: { status: "SUCCESS" } })
  }

  return NextResponse.json({ success: true })
}
