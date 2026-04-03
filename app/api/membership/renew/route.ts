import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { payos } from "@/lib/payos"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role === "GUEST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { amount } = await request.json()
  if (amount !== 5_000_000 && amount !== 10_000_000) {
    return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipExpires: true, name: true, email: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const orderCode = Date.now()

  const paymentLink = await payos.createPaymentLink({
    orderCode,
    amount,
    description: `Gia han hoi vien ${user.name}`,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/thanh-toan/thanh-cong?type=membership&orderCode=${orderCode}`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/gia-han`,
  })

  // Create membership record (placeholder dates — updated on webhook/success)
  const membership = await prisma.membership.create({
    data: {
      userId: session.user.id,
      amountPaid: amount,
      validFrom: new Date(),
      validTo: new Date(),
      status: "PENDING_PAYMENT",
      paymentRef: String(orderCode),
    },
  })

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      type: "MEMBERSHIP_FEE",
      status: "PENDING",
      amount,
      payosOrderCode: String(orderCode),
      membershipId: membership.id,
      description: `Gia hạn hội viên - ${amount.toLocaleString("vi-VN")}đ`,
    },
  })

  return NextResponse.json({ paymentUrl: paymentLink.checkoutUrl })
}
