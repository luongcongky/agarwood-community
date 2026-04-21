import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

type Ctx = { params: Promise<{ id: string; imageId: string }> }

/** DELETE — xoá 1 ảnh gallery. Chỉ owner hoặc ADMIN. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: companyId, imageId } = await params

  const [company, image] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true, slug: true },
    }),
    prisma.companyGalleryImage.findUnique({
      where: { id: imageId },
      select: { companyId: true },
    }),
  ])

  if (!company || !image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (image.companyId !== companyId) {
    return NextResponse.json({ error: "Mismatched company" }, { status: 400 })
  }

  const isOwner = session.user.id === company.ownerId
  const isAdmin = session.user.role === "ADMIN"
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.companyGalleryImage.delete({ where: { id: imageId } })
  revalidatePath(`/doanh-nghiep/${company.slug}`)
  return NextResponse.json({ ok: true })
}
