import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import type { BannerSlot } from "@prisma/client"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { BANNER_SLOT_META, getSlotShape } from "@/lib/banner-slots"

/**
 * PATCH /api/admin/banner/[id]/positions
 *
 * Body: { slots: BannerSlot[] }
 *
 * Replace `banner.positions` bằng list mới (set semantics, không append).
 * Validate: tất cả slot phải cùng shape (vì share 1 ảnh 1 aspect ratio).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { slots } = body as { slots?: string[] }

  if (!Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json(
      { error: "Cần ít nhất 1 vùng hiển thị." },
      { status: 400 },
    )
  }
  for (const s of slots) {
    if (!(s in BANNER_SLOT_META)) {
      return NextResponse.json({ error: `Slot không hợp lệ: ${s}` }, { status: 400 })
    }
  }
  const validSlots = slots as BannerSlot[]
  if (new Set(validSlots.map(getSlotShape)).size > 1) {
    return NextResponse.json(
      { error: "Các vùng phải cùng aspect ratio." },
      { status: 400 },
    )
  }
  const uniqueSlots = Array.from(new Set(validSlots))

  const existing = await prisma.banner.findUnique({
    where: { id },
    select: { id: true, positions: true },
  })
  if (!existing) {
    return NextResponse.json({ error: "Banner không tồn tại" }, { status: 404 })
  }

  // Cũng phải đảm bảo shape của slot mới khớp shape banner đang dùng (không
  // assign portrait banner vào slot leaderboard).
  if (existing.positions.length > 0) {
    const existingShape = getSlotShape(existing.positions[0])
    const newShape = getSlotShape(uniqueSlots[0])
    if (existingShape !== newShape) {
      return NextResponse.json(
        { error: "Slot mới khác aspect ratio với banner hiện tại." },
        { status: 400 },
      )
    }
  }

  const banner = await prisma.banner.update({
    where: { id },
    data: { positions: uniqueSlots },
    select: { id: true, positions: true },
  })

  revalidateTag("banners", "max")
  revalidateTag("homepage", "max")

  return NextResponse.json({ banner })
}
