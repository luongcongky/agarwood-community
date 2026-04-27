import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { name, name_en, name_zh, honorific, honorific_en, honorific_zh, title, title_en, title_zh, category, workTitle, workTitle_en, workTitle_zh, bio, bio_en, bio_zh, photoUrl, term, sortOrder, userId } = body

  if (!name || !title || !term) {
    return NextResponse.json(
      { error: "name, title, term are required" },
      { status: 400 },
    )
  }

  // Validate userId (optional): phải là User tồn tại, không phải ADMIN
  // (admin-as-leader không có nghĩa — Leader là public display).
  if (userId) {
    if (typeof userId !== "string") {
      return NextResponse.json({ error: "userId phải là string" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy user" }, { status: 400 })
    }
  }

  const leader = await prisma.leader.create({
    data: {
      name,
      name_en: name_en || null,
      name_zh: name_zh || null,
      honorific: honorific || null,
      honorific_en: honorific_en || null,
      honorific_zh: honorific_zh || null,
      title,
      title_en: title_en || null,
      title_zh: title_zh || null,
      category: category || "BCH",
      workTitle: workTitle || null,
      workTitle_en: workTitle_en || null,
      workTitle_zh: workTitle_zh || null,
      bio: bio || null,
      bio_en: bio_en || null,
      bio_zh: bio_zh || null,
      photoUrl: photoUrl || null,
      term,
      sortOrder: sortOrder ?? 0,
      isActive: true,
      userId: userId || null,
    },
  })

  revalidatePath("/gioi-thieu")
  revalidatePath("/ban-lanh-dao")

  return NextResponse.json(leader, { status: 201 })
}
