import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/admin/posts/[id]/promote
 *
 * Admin chủ động toggle `isPromoted` cho 1 bài feed — đẩy lên trang chủ
 * (hoặc gỡ xuống). Không cần qua promotion-request flow.
 *
 * Body: { promote: boolean } (optional — nếu thiếu thì toggle state hiện tại)
 *
 * Side effects khi promote=true:
 *  - Post.isPromoted = true
 *  - Nếu đang có request PENDING cho bài này → auto-mark APPROVED với reviewNote
 *    "Promoted by admin" (tránh request mồ côi, inbox sạch).
 *  - Revalidate homepage + feed (bài nhảy lên).
 *
 * Chỉ ADMIN. INFINITE read-only không đụng được.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "post:promote")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { promote?: boolean }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, isPromoted: true, status: true },
  })
  if (!post) {
    return NextResponse.json({ error: "Không tìm thấy bài" }, { status: 404 })
  }
  if (post.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "Chỉ bài đã xuất bản mới được đẩy lên trang chủ." },
      { status: 409 },
    )
  }

  const newState = typeof body.promote === "boolean" ? body.promote : !post.isPromoted
  const now = new Date()

  // Nếu đang promote và có request PENDING → auto-approve để tránh mồ côi.
  // Dùng transaction để post.update + request.updateMany atomic.
  await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id },
      data: { isPromoted: newState },
    })
    if (newState) {
      await tx.postPromotionRequest.updateMany({
        where: { postId: id, status: "PENDING" },
        data: {
          status: "APPROVED",
          reviewedBy: session.user.id,
          reviewedAt: now,
          reviewNote: "Được duyệt khi admin chủ động đẩy lên trang chủ.",
        },
      })
    }
  })

  // Homepage query dùng isPromoted → phải revalidate. Feed cũng vì feed order
  // dùng isPromoted ở top.
  revalidateTag("homepage", "max")
  revalidateTag("posts", "max")
  revalidatePath("/[locale]", "layout")
  revalidatePath("/[locale]/feed", "page")

  return NextResponse.json({ isPromoted: newState })
}
