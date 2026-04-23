import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import DOMPurify from "isomorphic-dompurify"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, title: true, content: true, authorId: true },
  })

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Only author or admin can read for editing
  if (post.authorId !== session.user.id && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ post })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  })

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (post.authorId !== session.user.id && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { title, content } = await req.json()
  if (!content || content.trim().length < 50) {
    return NextResponse.json({ error: "Nội dung quá ngắn (tối thiểu 50 ký tự)" }, { status: 400 })
  }

  const sanitizedContent = DOMPurify.sanitize(content)

  // Author edit → quay lại PENDING để admin duyệt lại phần edit.
  // Admin edit → giữ nguyên status hiện tại (preserve moderation state).
  const isAdminEdit = isAdmin(session.user.role)
  await prisma.post.update({
    where: { id },
    data: {
      title: title || null,
      content: sanitizedContent,
      ...(isAdminEdit
        ? {}
        : { status: "PENDING", moderationNote: null, moderatedAt: null, moderatedBy: null }),
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  })

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (post.authorId !== session.user.id && !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.post.update({
    where: { id },
    data: { status: "DELETED" },
  })

  return NextResponse.json({ success: true })
}
