import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/posts/[id]/request-promotion
 *
 * Owner xin admin đẩy bài lên trang chủ.
 *
 * Body: { reason?: string } — tối đa 500 ký tự, optional nhưng khuyến khích.
 *
 * Rules:
 *  - Chỉ owner của bài (authorId === userId). Admin muốn promote thì dùng
 *    /api/admin/posts/[id]/promote trực tiếp (không cần qua request flow).
 *  - Bài phải PUBLISHED — PENDING/LOCKED/DELETED không đủ điều kiện xin.
 *  - Bài chưa đang isPromoted — đã đẩy rồi thì xin nữa vô nghĩa.
 *  - Không đã có 1 request PENDING của cùng bài (spam-prevention, 1 request
 *    đang chạy là đủ). Admin xử lý xong (APPROVED/REJECTED) mới cho tạo mới.
 *
 * Trả về: { request: { id, status } } hoặc 4xx error.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, authorId: true, status: true, isPromoted: true },
  })
  if (!post) {
    return NextResponse.json({ error: "Không tìm thấy bài" }, { status: 404 })
  }
  if (post.authorId !== session.user.id) {
    return NextResponse.json(
      { error: "Chỉ chủ bài mới được xin đẩy lên trang chủ." },
      { status: 403 },
    )
  }
  if (post.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "Bài phải đã xuất bản mới xin đẩy lên trang chủ được." },
      { status: 409 },
    )
  }
  if (post.isPromoted) {
    return NextResponse.json(
      { error: "Bài đã được đẩy lên trang chủ." },
      { status: 409 },
    )
  }

  const body = (await req.json().catch(() => ({}))) as { reason?: string }
  const reason = (body.reason ?? "").trim()
  if (reason.length > 500) {
    return NextResponse.json(
      { error: "Lý do tối đa 500 ký tự." },
      { status: 400 },
    )
  }

  const existing = await prisma.postPromotionRequest.findFirst({
    where: { postId: id, status: "PENDING" },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json(
      { error: "Đã có yêu cầu đang chờ duyệt cho bài này." },
      { status: 409 },
    )
  }

  const request = await prisma.postPromotionRequest.create({
    data: {
      postId: id,
      requestedBy: session.user.id,
      reason: reason || null,
    },
    select: { id: true, status: true },
  })

  return NextResponse.json({ request }, { status: 201 })
}

/**
 * DELETE /api/posts/[id]/request-promotion
 *
 * Owner rút lại yêu cầu PENDING của chính mình (status → CANCELLED).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.postPromotionRequest.findFirst({
    where: { postId: id, status: "PENDING" },
    select: { id: true, requestedBy: true },
  })
  if (!existing) {
    return NextResponse.json(
      { error: "Không có yêu cầu đang chờ để rút." },
      { status: 404 },
    )
  }
  if (existing.requestedBy !== session.user.id) {
    return NextResponse.json(
      { error: "Chỉ người gửi yêu cầu mới được rút." },
      { status: 403 },
    )
  }

  await prisma.postPromotionRequest.update({
    where: { id: existing.id },
    data: { status: "CANCELLED" },
  })

  return NextResponse.json({ ok: true })
}
