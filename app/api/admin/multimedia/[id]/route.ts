import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { isAdmin, canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const multimedia = await prisma.multimedia.findUnique({ where: { id } })
  if (!multimedia) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ multimedia })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {}

  if (body.type !== undefined) {
    if (body.type !== "PHOTO_COLLECTION" && body.type !== "VIDEO") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
    data.type = body.type
  }

  if (body.slug !== undefined) {
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json({ error: "Slug không hợp lệ" }, { status: 400 })
    }
    // Ensure slug uniqueness (exclude self)
    const existing = await prisma.multimedia.findUnique({ where: { slug: body.slug } })
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 })
    }
    data.slug = body.slug
  }

  if (body.title !== undefined) data.title = body.title
  if ("title_en" in body) data.title_en = body.title_en || null
  if ("title_zh" in body) data.title_zh = body.title_zh || null
  if ("title_ar" in body) data.title_ar = body.title_ar || null
  if ("excerpt" in body) data.excerpt = body.excerpt || null
  if ("excerpt_en" in body) data.excerpt_en = body.excerpt_en || null
  if ("excerpt_zh" in body) data.excerpt_zh = body.excerpt_zh || null
  if ("excerpt_ar" in body) data.excerpt_ar = body.excerpt_ar || null
  if ("coverImageUrl" in body) data.coverImageUrl = body.coverImageUrl || null
  if ("imageUrls" in body && Array.isArray(body.imageUrls)) {
    data.imageUrls = body.imageUrls.filter((u: unknown) => typeof u === "string")
  }
  if ("youtubeId" in body) data.youtubeId = body.youtubeId || null
  if (body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished)
  if (body.isPinned !== undefined) data.isPinned = Boolean(body.isPinned)
  if ("publishedAt" in body) {
    data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null
  }

  const multimedia = await prisma.multimedia.update({ where: { id }, data })

  revalidateTag("multimedia", "max")
  revalidateTag("homepage", "max")

  return NextResponse.json({ multimedia })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await prisma.multimedia.delete({ where: { id } })

  revalidateTag("multimedia", "max")
  revalidateTag("homepage", "max")

  return NextResponse.json({ ok: true })
}
