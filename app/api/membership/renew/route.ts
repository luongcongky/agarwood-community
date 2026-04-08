import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role === "GUEST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { amount } = await request.json()

  // Fetch user with accountType to determine fee schedule
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, accountType: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isIndividual = user.accountType === "INDIVIDUAL"

  // Validate amount against SiteConfig (different keys per account type)
  const feeKeys = isIndividual
    ? ["individual_fee_min", "individual_fee_max"]
    : ["membership_fee_min", "membership_fee_max"]

  const feeConfigs = await prisma.siteConfig.findMany({
    where: { key: { in: feeKeys } },
  })
  const cfgMap = Object.fromEntries(feeConfigs.map((c) => [c.key, Number(c.value)]))

  const feeMin = isIndividual
    ? (cfgMap.individual_fee_min ?? 1_000_000)
    : (cfgMap.membership_fee_min ?? 5_000_000)
  const feeMax = isIndividual
    ? (cfgMap.individual_fee_max ?? 2_000_000)
    : (cfgMap.membership_fee_max ?? 10_000_000)

  if (amount !== feeMin && amount !== feeMax) {
    return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 })
  }

  // Idempotency: check for existing PENDING payment
  const existingPending = await prisma.payment.findFirst({
    where: { userId: session.user.id, type: "MEMBERSHIP_FEE", status: "PENDING" },
  })
  if (existingPending) {
    return NextResponse.json({ error: "Bạn đang có yêu cầu chuyển khoản chờ xác nhận. Vui lòng chờ admin xử lý." }, { status: 409 })
  }

  // Generate CK description: HOITRAMHUONG-MEM-{INITIALS}-{YYYYMMDD}
  const initials = user.name
    .split(" ")
    .map((w) => w[0]?.toUpperCase())
    .filter(Boolean)
    .join("")
  const now = new Date()
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("")
  const description = `HOITRAMHUONG-MEM-${initials}-${dateStr}`
  const orderCode = String(Date.now())

  // Fetch bank info from SiteConfig
  const bankConfigs = await prisma.siteConfig.findMany({
    where: { key: { in: ["bank_name", "bank_account_number", "bank_account_name"] } },
  })
  const bankCfg = Object.fromEntries(bankConfigs.map((c) => [c.key, c.value]))
  const bankInfo = {
    bankName: bankCfg.bank_name ?? "Vietcombank",
    accountNumber: bankCfg.bank_account_number ?? "1234567890",
    accountName: bankCfg.bank_account_name ?? "HOI TRAM HUONG VIET NAM",
    amount,
    description,
  }

  // Create membership + payment records
  const membership = await prisma.membership.create({
    data: {
      userId: session.user.id,
      amountPaid: amount,
      validFrom: now,
      validTo: now, // Updated when admin confirms
      status: "PENDING_PAYMENT",
      paymentRef: orderCode,
    },
  })

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      type: "MEMBERSHIP_FEE",
      status: "PENDING",
      amount,
      payosOrderCode: orderCode,
      membershipId: membership.id,
      description: `Gia hạn hội viên - ${amount.toLocaleString("vi-VN")}đ | ND: ${description}`,
    },
  })

  // Email admin about new payment
  try {
    const adminEmail = (await prisma.siteConfig.findUnique({ where: { key: "association_email" } }))?.value ?? "admin@hoi-tram-huong.vn"
    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: adminEmail,
      subject: `[Hội Trầm Hương] ${user.name} vừa xác nhận chuyển khoản ${amount.toLocaleString("vi-VN")}đ`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h3>${user.name} (${user.email})</h3>
          <p>Vừa xác nhận chuyển khoản <strong>${amount.toLocaleString("vi-VN")}đ</strong> phí hội viên.</p>
          <p>Nội dung CK: <strong>${description}</strong></p>
          <p><a href="${process.env.NEXTAUTH_URL}/admin/thanh-toan" style="display:inline-block;background:#1a5632;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Xác nhận ngay</a></p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send admin notification:", err)
  }

  return NextResponse.json({ orderCode, bankInfo })
}
