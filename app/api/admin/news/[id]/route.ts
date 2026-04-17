import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin, canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const news = await prisma.news.findUnique({ where: { id } })
  if (!news) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ news })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const {
    title, title_en, title_zh,
    slug,
    excerpt, excerpt_en, excerpt_zh,
    content, content_en, content_zh,
    coverImageUrl,
    category,
    isPublished,
    isPinned,
    publishedAt,
  } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {}
  if (title !== undefined) data.title = title
  if ("title_en" in body) data.title_en = title_en || null
  if ("title_zh" in body) data.title_zh = title_zh || null
  if (slug !== undefined) data.slug = slug
  if (excerpt !== undefined) data.excerpt = excerpt
  if ("excerpt_en" in body) data.excerpt_en = excerpt_en || null
  if ("excerpt_zh" in body) data.excerpt_zh = excerpt_zh || null
  if (content !== undefined) data.content = content
  if ("content_en" in body) data.content_en = content_en || null
  if ("content_zh" in body) data.content_zh = content_zh || null
  if (coverImageUrl !== undefined) data.coverImageUrl = coverImageUrl
  if (category !== undefined)
    data.category =
      category === "RESEARCH" ? "RESEARCH" : category === "LEGAL" ? "LEGAL" : "GENERAL"
  if (isPublished !== undefined) data.isPublished = isPublished
  if (isPinned !== undefined) data.isPinned = isPinned
  if (publishedAt !== undefined)
    data.publishedAt = publishedAt ? new Date(publishedAt) : null

  const news = await prisma.news.update({ where: { id }, data })

  return NextResponse.json({ news })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  await prisma.news.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
