import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const leader = await prisma.leader.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.workTitle !== undefined && { workTitle: body.workTitle || null }),
      ...(body.bio !== undefined && { bio: body.bio || null }),
      ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl || null }),
      ...(body.term !== undefined && { term: body.term }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })

  revalidatePath("/gioi-thieu")
  revalidatePath("/ban-lanh-dao")

  return NextResponse.json(leader)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await prisma.leader.delete({ where: { id } })

  revalidatePath("/gioi-thieu")
  revalidatePath("/ban-lanh-dao")

  return NextResponse.json({ success: true })
}
