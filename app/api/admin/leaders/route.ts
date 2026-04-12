import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { name, title, category, workTitle, bio, photoUrl, term, sortOrder } = body

  if (!name || !title || !term) {
    return NextResponse.json(
      { error: "name, title, term are required" },
      { status: 400 },
    )
  }

  const leader = await prisma.leader.create({
    data: {
      name,
      title,
      category: category || "BCH",
      workTitle: workTitle || null,
      bio: bio || null,
      photoUrl: photoUrl || null,
      term,
      sortOrder: sortOrder ?? 0,
      isActive: true,
    },
  })

  revalidatePath("/gioi-thieu")
  revalidatePath("/ban-lanh-dao")

  return NextResponse.json(leader, { status: 201 })
}
