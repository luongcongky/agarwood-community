import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { deleteFromDrive } from "@/lib/google-drive"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const data = await req.json()
  const { title, description, documentNumber, issuedDate, isPublic, category } = data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description || null
  if (documentNumber !== undefined) updateData.documentNumber = documentNumber || null
  if (issuedDate !== undefined) updateData.issuedDate = issuedDate ? new Date(issuedDate) : null
  if (isPublic !== undefined) updateData.isPublic = isPublic
  if (category !== undefined) updateData.category = category

  await prisma.document.update({ where: { id }, data: updateData })
  return NextResponse.json({ success: true })
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
  const doc = await prisma.document.findUnique({ where: { id }, select: { driveFileId: true } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Delete from Drive first, then DB
  try {
    await deleteFromDrive(doc.driveFileId)
  } catch (err) {
    console.error("Drive delete failed:", err)
    // Continue to delete DB record even if Drive fails
  }

  await prisma.document.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
