import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getQuotaUsage } from "@/lib/quota"

// GET /api/posts/quota — trả về số bài đã đăng / hạn mức tháng cho user hiện tại
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const usage = await getQuotaUsage(session.user.id)
  return NextResponse.json({
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    resetAt: usage.resetAt.toISOString(),
  })
}
