import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  // Fetch bank info from SiteConfig (fallback to defaults)
  const configs = await prisma.siteConfig.findMany({
    where: { key: { in: ["bank_name", "bank_account_number", "bank_account_name"] } },
  })
  const cfg = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  const bankInfo = {
    bankName: cfg.bank_name ?? "Vietcombank",
    accountNumber: cfg.bank_account_number ?? "1234567890",
    accountName: cfg.bank_account_name ?? "HOI TRAM HUONG VIET NAM",
    amount,
    description: `HTVNCK${orderCode}`,
  }

  // Create membership record (dates updated when admin confirms)
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

  return NextResponse.json({ orderCode, bankInfo })
}
