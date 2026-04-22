import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const {
    type,
    slug,
    title,
    title_en,
    title_zh,
    title_ar,
    excerpt,
    excerpt_en,
    excerpt_zh,
    excerpt_ar,
    coverImageUrl,
    imageUrls,
    youtubeId,
    isPublished,
    isPinned,
    publishedAt,
  } = body

  if (!title || !slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Tiêu đề và slug là bắt buộc (slug chỉ cho phép a-z, 0-9, '-')." },
      { status: 400 },
    )
  }
  if (type !== "PHOTO_COLLECTION" && type !== "VIDEO") {
    return NextResponse.json(
      { error: "type phải là PHOTO_COLLECTION hoặc VIDEO." },
      { status: 400 },
    )
  }
  if (type === "VIDEO" && !youtubeId) {
    return NextResponse.json(
      { error: "VIDEO cần youtubeId." },
      { status: 400 },
    )
  }

  const existing = await prisma.multimedia.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json(
      { error: "Slug đã tồn tại." },
      { status: 409 },
    )
  }

  const multimedia = await prisma.multimedia.create({
    data: {
      type,
      slug,
      title,
      title_en: title_en || null,
      title_zh: title_zh || null,
      title_ar: title_ar || null,
      excerpt: excerpt || null,
      excerpt_en: excerpt_en || null,
      excerpt_zh: excerpt_zh || null,
      excerpt_ar: excerpt_ar || null,
      coverImageUrl: coverImageUrl || null,
      imageUrls: Array.isArray(imageUrls) ? imageUrls.filter((u) => typeof u === "string") : [],
      youtubeId: youtubeId || null,
      isPublished: isPublished ?? true,
      isPinned: isPinned ?? false,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    },
  })

  revalidateTag("multimedia", "max")
  revalidateTag("homepage", "max")

  return NextResponse.json({ multimedia }, { status: 201 })
}
