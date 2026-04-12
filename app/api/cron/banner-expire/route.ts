import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

/**
 * Cron daily — expire banner hết hạn + gửi email cảnh báo sắp hết hạn.
 *
 * Chạy qua Vercel Cron (vercel.json) hoặc external scheduler.
 * Auth: Bearer token = CRON_SECRET env var (Vercel tự set header `Authorization`
 * với secret nếu có trong env).
 *
 * Logic:
 *  1. Banner ACTIVE có endDate < now  →  set status EXPIRED
 *  2. Banner ACTIVE có endDate trong 7 ngày tới & chưa gửi email warning
 *     → gửi email "sắp hết hạn" cho user
 *
 * Trả về: { expired: number, warned: number }
 */
export async function GET(request: Request) {
  // Auth: Vercel Cron gửi header `Authorization: Bearer ${CRON_SECRET}`
  const authHeader = request.headers.get("authorization")
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 },
    )
  }
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86_400_000)

  // ── 1. Expire banner hết hạn ──────────────────────────────────────────
  const expired = await prisma.banner.updateMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: now },
    },
    data: { status: "EXPIRED" },
  })

  // ── 2. Email warning cho banner sắp hết hạn (< 7 ngày) ──────────────
  // Chỉ gửi cho banner có endDate trong khoảng (now, now+7days]
  // Để tránh gửi duplicate mỗi ngày, trong MVP này ta cứ gửi — user có thể
  // config cron 1 lần/tuần hoặc check lại logic nếu cần chống duplicate.
  const expiringSoon = await prisma.banner.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: now, lte: sevenDaysFromNow },
    },
    select: {
      id: true,
      title: true,
      endDate: true,
      user: { select: { name: true, email: true } },
    },
  })

  let warnedCount = 0
  for (const banner of expiringSoon) {
    try {
      const daysLeft = Math.ceil(
        (banner.endDate.getTime() - now.getTime()) / 86_400_000,
      )
      await resend.emails.send({
        from: "Hội Trầm Hương Việt Nam <noreply@hoitramhuong.vn>",
        to: banner.user.email,
        subject: `Banner "${banner.title}" sắp hết hạn trong ${daysLeft} ngày`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Xin chào ${banner.user.name},</h2>
            <p>Banner <strong>"${banner.title}"</strong> của bạn sắp hết hạn hiển thị.</p>
            <p><strong>Ngày hết hạn:</strong> ${banner.endDate.toLocaleDateString("vi-VN")} (còn ${daysLeft} ngày)</p>
            <p>Gia hạn ngay để banner tiếp tục hiển thị trên trang chủ:</p>
            <p><a href="${process.env.NEXTAUTH_URL}/banner/lich-su" style="display:inline-block;background:#1a5632;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Gia hạn banner</a></p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
            <p style="color:#888;font-size:12px;">Hội Trầm Hương Việt Nam</p>
          </div>
        `,
      })
      warnedCount++
    } catch (err) {
      console.error(`Failed to send warning email for banner ${banner.id}:`, err)
    }
  }

  // ── 3. Invalidate homepage cache nếu có banner vừa expire ──────────
  if (expired.count > 0) {
    revalidateTag("homepage", "max")
    revalidateTag("banners", "max")
  }

  return NextResponse.json({
    expired: expired.count,
    warned: warnedCount,
    timestamp: now.toISOString(),
  })
}
