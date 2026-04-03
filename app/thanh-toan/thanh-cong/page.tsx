import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Thanh toán thành công | Hội Trầm Hương Việt Nam",
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; orderCode?: string; certId?: string }>
}) {
  const params = await searchParams
  const { type, orderCode, certId } = params

  // Update records based on payment type
  if (type === "membership" && orderCode) {
    await prisma.payment.updateMany({
      where: { payosOrderCode: orderCode },
      data: { status: "SUCCESS" },
    })

    const payment = await prisma.payment.findFirst({
      where: { payosOrderCode: orderCode },
    })
    if (payment?.membershipId) {
      const membership = await prisma.membership.findUnique({
        where: { id: payment.membershipId },
        select: { userId: true, amountPaid: true },
      })
      if (membership) {
        const user = await prisma.user.findUnique({
          where: { id: membership.userId },
          select: { membershipExpires: true, contributionTotal: true },
        })
        const baseDate =
          user?.membershipExpires && user.membershipExpires > new Date()
            ? user.membershipExpires
            : new Date()
        const newExpiry = new Date(baseDate)
        newExpiry.setFullYear(newExpiry.getFullYear() + 1)

        const newContrib = (user?.contributionTotal ?? 0) + membership.amountPaid
        const newPriority = Math.floor(newContrib / 1_000_000) // 1 point per million VND

        await Promise.all([
          prisma.membership.update({
            where: { id: payment.membershipId },
            data: {
              status: "ACTIVE",
              validFrom: new Date(),
              validTo: newExpiry,
              paymentRef: orderCode,
            },
          }),
          prisma.user.update({
            where: { id: membership.userId },
            data: {
              membershipExpires: newExpiry,
              contributionTotal: newContrib,
              displayPriority: newPriority,
            },
          }),
        ])
      }
    }
  }

  if (type === "certification" && certId) {
    await prisma.certification.update({
      where: { id: certId },
      data: { status: "PENDING" },
    })
    await prisma.payment.updateMany({
      where: { certificationId: certId },
      data: { status: "SUCCESS" },
    })
  }

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-heading font-bold text-brand-900">
          Thanh toán thành công!
        </h1>
        <p className="text-brand-600">
          {type === "membership"
            ? "Membership của bạn đã được gia hạn thành công. Cảm ơn bạn đã đồng hành cùng Hội!"
            : "Đơn chứng nhận đã được ghi nhận. Chúng tôi sẽ liên hệ với bạn trong 3–5 ngày làm việc."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {type === "membership" ? (
            <Link
              href="/feed"
              className="bg-brand-700 text-white rounded-lg px-6 py-3 font-semibold hover:bg-brand-800 transition-colors"
            >
              Về bảng tin
            </Link>
          ) : (
            <Link
              href="/chung-nhan/nop-don"
              className="bg-brand-700 text-white rounded-lg px-6 py-3 font-semibold hover:bg-brand-800 transition-colors"
            >
              Xem đơn của tôi
            </Link>
          )}
          <Link
            href="/"
            className="border border-brand-300 text-brand-700 rounded-lg px-6 py-3 font-semibold hover:bg-brand-50 transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
