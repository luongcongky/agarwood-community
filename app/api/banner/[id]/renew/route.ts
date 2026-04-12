import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getBannerPricePerMonth } from "@/lib/bannerQuota"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

/**
 * POST /api/banner/[id]/renew
 * Gia hạn banner sap het han. Tao Payment moi voi type BANNER_FEE.
 * KHONG dem vao quota thang. KHONG can admin duyet content lai.
 *
 * Body: { months: 1 | 3 | 6 | 12 }
 *
 * Khi admin confirm CK -> banner.endDate += months
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const months = Number(body.months)

  if (!Number.isInteger(months) || ![1, 3, 6, 12].includes(months)) {
    return NextResponse.json({ error: "Số tháng không hợp lệ (1, 3, 6, hoặc 12)" }, { status: 400 })
  }

  const banner = await prisma.banner.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      status: true,
      endDate: true,
      user: { select: { name: true, email: true } },
    },
  })
  if (!banner) return NextResponse.json({ error: "Banner không tồn tại" }, { status: 404 })

  // Chỉ owner mới được gia hạn
  if (banner.userId !== session.user.id) {
    return NextResponse.json({ error: "Bạn không có quyền gia hạn banner này" }, { status: 403 })
  }

  // Chỉ cho gia hạn banner ACTIVE hoặc EXPIRED gần đây
  if (banner.status !== "ACTIVE" && banner.status !== "EXPIRED") {
    return NextResponse.json(
      { error: "Chỉ có thể gia hạn banner đang ACTIVE hoặc đã EXPIRED" },
      { status: 400 },
    )
  }

  // Idempotency: chặn nếu đã có 1 payment renew PENDING cho banner này
  const existingRenewPending = await prisma.payment.findFirst({
    where: {
      bannerId: id,
      type: "BANNER_FEE",
      status: "PENDING",
    },
  })
  if (existingRenewPending) {
    return NextResponse.json(
      { error: "Banner này đã có 1 yêu cầu gia hạn chờ xác nhận. Vui lòng chờ admin xử lý." },
      { status: 409 },
    )
  }

  const pricePerMonth = await getBannerPricePerMonth()
  const totalPrice = pricePerMonth * months

  // Bank info
  const bankConfigs = await prisma.siteConfig.findMany({
    where: { key: { in: ["bank_name", "bank_account_number", "bank_account_name"] } },
  })
  const bankCfg = Object.fromEntries(bankConfigs.map((c) => [c.key, c.value]))

  // CK description
  const initials = banner.user.name
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
  const description = `HTHVN-BANNER-RENEW-${initials}-${dateStr}`
  const orderCode = `BANNER-RENEW-${Date.now()}`

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      type: "BANNER_FEE",
      status: "PENDING",
      amount: totalPrice,
      payosOrderCode: orderCode,
      bannerId: id,
      description: `Gia hạn banner ${months} tháng - ${totalPrice.toLocaleString("vi-VN")}đ | ND: ${description}`,
    },
  })

  const bankInfo = {
    bankName: bankCfg.bank_name ?? "Vietcombank",
    accountNumber: bankCfg.bank_account_number ?? "1234567890",
    accountName: bankCfg.bank_account_name ?? "HOI TRAM HUONG VIET NAM",
    amount: totalPrice,
    description,
  }

  // Email admin
  try {
    const adminEmail =
      (await prisma.siteConfig.findUnique({ where: { key: "association_email" } }))?.value ??
      "admin@hoitramhuong.vn"
    await resend.emails.send({
      from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
      to: adminEmail,
      subject: `[Gia hạn banner] ${banner.user.name} - ${months} tháng`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h3>${banner.user.name} (${banner.user.email}) gia hạn banner</h3>
          <p><strong>Banner:</strong> ${banner.title}</p>
          <p><strong>Gia hạn:</strong> ${months} tháng (${totalPrice.toLocaleString("vi-VN")}đ)</p>
          <p><strong>ND CK:</strong> ${description}</p>
          <p><a href="${process.env.NEXTAUTH_URL}/admin/thanh-toan" style="display:inline-block;background:#1a5632;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Xác nhận CK</a></p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Failed to send admin notification:", err)
  }

  return NextResponse.json({
    bankInfo,
    price: totalPrice,
    months,
  })
}
