import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBannerPricePerMonth, getBannerQuotaUsage } from "@/lib/bannerQuota"

// GET /api/banner/quota — quota tháng hiện tại + giá 1 tháng cho user đang đăng nhập
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [usage, pricePerMonth] = await Promise.all([
    getBannerQuotaUsage(session.user.id),
    getBannerPricePerMonth(),
  ])

  return NextResponse.json({
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    resetAt: usage.resetAt.toISOString(),
    pricePerMonth,
  })
}
