import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { payos } from "@/lib/payos"

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
      {
        error: "Membership đã hết hạn. Vui lòng gia hạn trước.",
        redirectTo: "/gia-han",
      },
      { status: 403 }
    )
  }

  const { productId, applicantNote, isOnlineReview, bankAccountName, bankAccountNumber, bankName } =
    await request.json()

  if (!productId) {
    return NextResponse.json({ error: "Thiếu thông tin sản phẩm" }, { status: 400 })
  }

  const FEE = 5_000_000 // 5,000,000 VND
  const orderCode = Date.now()

  // Create certification record
  const cert = await prisma.certification.create({
    data: {
      productId,
      applicantId: session.user.id,
      status: "DRAFT",
      documentUrls: [],
      applicantNote: applicantNote ?? null,
      isOnlineReview: isOnlineReview ?? true,
      feePaid: FEE * 100, // schema stores *100
      refundBankName: bankName ?? null,
      refundAccountName: bankAccountName ?? null,
      refundAccountNo: bankAccountNumber ?? null,
    },
  })

  await prisma.payment.create({
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

  const paymentLink = await payos.createPaymentLink({
    orderCode,
    amount: FEE,
    description: "Phi xet duyet chung nhan SP",
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/thanh-toan/thanh-cong?type=certification&certId=${cert.id}`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chung-nhan/nop-don`,
  })

  return NextResponse.json({ paymentUrl: paymentLink.checkoutUrl })
}
