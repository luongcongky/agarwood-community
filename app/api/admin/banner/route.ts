import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import type { BannerSlot } from "@prisma/client"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { BANNER_SLOT_META, getSlotShape } from "@/lib/banner-slots"

/**
 * POST /api/admin/banner — admin tự đăng banner trực tiếp (bypass payment +
 * auto-approve). Khác với /api/banner (user flow) ở chỗ:
 *  - Không tính quota, không tính giá
 *  - Không tạo Payment record
 *  - Tạo thẳng với status=ACTIVE, approvedAt=now, approvedBy=self
 *  - price=0
 *
 * Body: { slot, imageUrl, targetUrl, title, startDate, endDate }
 *
 * `slot` là 1 trong các giá trị enum `BannerSlot` (page-prefixed).
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { slots, imageUrl, targetUrl, title, startDate, endDate } = body as {
    slots?: string[]
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
  if (!Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json(
      { error: "Cần chọn ít nhất 1 vùng hiển thị." },
      { status: 400 },
    )
  }
  for (const s of slots) {
    if (!(s in BANNER_SLOT_META)) {
      return NextResponse.json(
        { error: `Slot không hợp lệ: ${s}` },
        { status: 400 },
      )
    }
  }
  // Mọi slot trong list phải cùng shape (vd cùng SIDEBAR) — vì share 1 ảnh
  // 1 aspect ratio. Form đã validate ở client, server check lại để chắc.
  const validSlots = slots as BannerSlot[]
  const shapes = new Set(validSlots.map(getSlotShape))
  if (shapes.size > 1) {
    return NextResponse.json(
      { error: "Các vùng được chọn phải cùng aspect ratio (vd cùng SIDEBAR)." },
      { status: 400 },
    )
  }
  // Dedup
  const uniqueSlots = Array.from(new Set(validSlots))
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
      positions: uniqueSlots,
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
