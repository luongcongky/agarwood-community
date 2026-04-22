import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/admin/banner — admin tự đăng banner trực tiếp (bypass payment +
 * auto-approve). Khác với /api/banner (user flow) ở chỗ:
 *  - Không tính quota, không tính giá
 *  - Không tạo Payment record
 *  - Tạo thẳng với status=ACTIVE, approvedAt=now, approvedBy=self
 *  - price=0
 *
 * Body: { position, imageUrl, targetUrl, title, startDate, endDate }
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { position, imageUrl, targetUrl, title, startDate, endDate } = body as {
    position?: "TOP" | "MID" | "SIDEBAR"
    imageUrl?: string
    targetUrl?: string
    title?: string
    startDate?: string
    endDate?: string
  }

  if (!imageUrl || !title || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Thiếu thông tin bắt buộc (imageUrl, title, dates)." },
      { status: 400 },
    )
  }
  if (position !== "TOP" && position !== "MID" && position !== "SIDEBAR") {
    return NextResponse.json(
      { error: "position phải là TOP / MID / SIDEBAR." },
      { status: 400 },
    )
  }
  // targetUrl optional — nếu có phải là https://. Admin có thể để trống cho
  // banner không clickable (brand awareness).
  if (targetUrl && !/^https:\/\//.test(targetUrl)) {
    return NextResponse.json(
      { error: "Nếu có URL đích, phải bắt đầu bằng https://" },
      { status: 400 },
    )
  }
  if (title.length < 5 || title.length > 100) {
    return NextResponse.json(
      { error: "Tiêu đề từ 5 đến 100 ký tự." },
      { status: 400 },
    )
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Ngày không hợp lệ." }, { status: 400 })
  }
  if (end <= start) {
    return NextResponse.json(
      { error: "Ngày kết thúc phải sau ngày bắt đầu." },
      { status: 400 },
    )
  }

  const banner = await prisma.banner.create({
    data: {
      userId: session.user.id,
      position,
      imageUrl,
      targetUrl: targetUrl ?? "",
      title,
      startDate: start,
      endDate: end,
      status: "ACTIVE",
      price: 0,
      approvedAt: new Date(),
      approvedBy: session.user.id,
    },
  })

  revalidateTag("banners", "max")
  revalidateTag("homepage", "max")

  return NextResponse.json({ banner }, { status: 201 })
}
