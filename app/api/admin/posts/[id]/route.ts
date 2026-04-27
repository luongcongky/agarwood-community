import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/admin/posts/[id]
 * Moderation endpoint — approve hoặc reject bài chờ duyệt.
 *
 * Body:
 *  { action: "approve" }              → status: PUBLISHED, clear moderation fields
 *  { action: "reject", note: string } → status: LOCKED + moderationNote + moderatedBy
 *
 * Chỉ ADMIN thao tác được. INFINITE read-only không ghi.
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
  if (!hasPermission(perms, "post:moderate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as {
    action?: "approve" | "reject"
    note?: string
  }

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json(
      { error: "action phải là 'approve' hoặc 'reject'" },
      { status: 400 },
    )
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!post) {
    return NextResponse.json({ error: "Không tìm thấy bài" }, { status: 404 })
  }
  if (post.status !== "PENDING") {
    return NextResponse.json(
      { error: "Bài không ở trạng thái chờ duyệt." },
      { status: 409 },
    )
  }

  const now = new Date()

  if (body.action === "approve") {
    await prisma.post.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        moderationNote: null,
        moderatedAt: now,
        moderatedBy: session.user.id,
      },
    })
  } else {
    // reject — note là lý do hiện cho user
    const note = (body.note ?? "").trim()
    if (!note) {
      return NextResponse.json(
        { error: "Cần lý do từ chối (note) để user biết cách chỉnh sửa" },
        { status: 400 },
      )
    }
    if (note.length > 500) {
      return NextResponse.json(
        { error: "Lý do từ chối tối đa 500 ký tự" },
        { status: 400 },
      )
    }
    await prisma.post.update({
      where: { id },
      data: {
        status: "LOCKED",
        moderationNote: note,
        moderatedAt: now,
        moderatedBy: session.user.id,
        lockedAt: now,
        lockedBy: session.user.id,
        lockReason: null, // clear auto-lock reason nếu có — reject thay thế
      },
    })
  }

  // Invalidate feed ISR cache để bài hiện/ẩn đúng trạng thái mới
  revalidatePath("/[locale]/feed", "page")

  return NextResponse.json({ ok: true })
}
