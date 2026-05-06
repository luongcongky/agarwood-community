import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

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

  const leader = await prisma.leader.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...("name_en" in body && { name_en: body.name_en || null }),
      ...("name_zh" in body && { name_zh: body.name_zh || null }),
      ...(body.honorific !== undefined && { honorific: body.honorific || null }),
      ...("honorific_en" in body && { honorific_en: body.honorific_en || null }),
      ...("honorific_zh" in body && { honorific_zh: body.honorific_zh || null }),
      ...(body.title !== undefined && { title: body.title }),
      ...("title_en" in body && { title_en: body.title_en || null }),
      ...("title_zh" in body && { title_zh: body.title_zh || null }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.workTitle !== undefined && { workTitle: body.workTitle || null }),
      ...("workTitle_en" in body && { workTitle_en: body.workTitle_en || null }),
      ...("workTitle_zh" in body && { workTitle_zh: body.workTitle_zh || null }),
      ...(body.bio !== undefined && { bio: body.bio || null }),
      ...("bio_en" in body && { bio_en: body.bio_en || null }),
      ...("bio_zh" in body && { bio_zh: body.bio_zh || null }),
      ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl || null }),
      ...(body.term !== undefined && { term: body.term }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      // userId: "" → null (unlink). userId: "cuid..." → link. undefined → giữ nguyên.
      ...("userId" in body && { userId: body.userId || null }),
    },
  })

  revalidatePath("/gioi-thieu-v2")
  revalidatePath("/ban-lanh-dao")

  return NextResponse.json(leader)
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
  await prisma.leader.delete({ where: { id } })

  revalidatePath("/gioi-thieu-v2")
  revalidatePath("/ban-lanh-dao")

  return NextResponse.json({ success: true })
}
