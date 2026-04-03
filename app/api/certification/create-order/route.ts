import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role === "GUEST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check membership is valid
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { membershipExpires: true, name: true },
  })
  if (!user?.membershipExpires || user.membershipExpires < new Date()) {
    return NextResponse.json(
      { error: "Membership đã hết hạn. Vui lòng gia hạn trước.", redirectTo: "/gia-han" },
      { status: 403 }
    )
  }

  const { productId, applicantNote, isOnlineReview, bankAccountName, bankAccountNumber, bankName } =
    await request.json()

  if (!productId) {
    return NextResponse.json({ error: "Thiếu thông tin sản phẩm" }, { status: 400 })
  }

  const FEE = 5_000_000
  const orderCode = Date.now()

  // Fetch bank info from SiteConfig
  const configs = await prisma.siteConfig.findMany({
    where: { key: { in: ["bank_name", "bank_account_number", "bank_account_name"] } },
  })
  const cfg = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  const bankInfo = {
    bankName: cfg.bank_name ?? "Vietcombank",
    accountNumber: cfg.bank_account_number ?? "1234567890",
    accountName: cfg.bank_account_name ?? "HOI TRAM HUONG VIET NAM",
    amount: FEE,
    description: `HTVNCK${orderCode}`,
  }

  const cert = await prisma.certification.create({
    data: {
      productId,
      applicantId: session.user.id,
      status: "DRAFT",
      documentUrls: [],
      applicantNote: applicantNote ?? null,
      isOnlineReview: isOnlineReview ?? true,
      feePaid: FEE * 100,
      refundBankName: bankName ?? null,
      refundAccountName: bankAccountName ?? null,
      refundAccountNo: bankAccountNumber ?? null,
    },
  })

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      type: "CERTIFICATION_FEE",
      status: "PENDING",
      amount: FEE,
      payosOrderCode: String(orderCode),
      certificationId: cert.id,
      description: "Phí xét duyệt chứng nhận sản phẩm",
    },
  })

  return NextResponse.json({ certId: cert.id, paymentId: payment.id, orderCode, bankInfo })
}
