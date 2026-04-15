import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { clearHeroCache } from "@/lib/hero"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}
  if (typeof body.imageUrl === "string" && body.imageUrl.trim()) data.imageUrl = body.imageUrl.trim()
  if ("label" in body) {
    const l = body.label
    data.label = typeof l === "string" && l.trim() ? l.trim() : null
  }
  if ("sortOrder" in body) data.sortOrder = Number(body.sortOrder) || 0
  if ("isActive" in body) data.isActive = !!body.isActive

  const item = await prisma.heroImage.update({ where: { id }, data })
  clearHeroCache()
  revalidatePath("/", "layout")
  return NextResponse.json({ item })
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
  await prisma.heroImage.delete({ where: { id } })
  clearHeroCache()
  revalidatePath("/", "layout")
  return NextResponse.json({ ok: true })
}
