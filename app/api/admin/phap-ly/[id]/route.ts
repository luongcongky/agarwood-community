import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { deleteFromDrive } from "@/lib/google-drive"

// PATCH — Update metadata (no file replace for now; delete + re-upload)
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
  const { title, documentNumber, issuedDate, issuer, description, sortOrder, isPublic } = body

  const existing = await prisma.document.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {}
  if (title !== undefined) data.title = String(title).trim()
  if (documentNumber !== undefined) data.documentNumber = documentNumber || null
  if (issuedDate !== undefined) data.issuedDate = issuedDate ? new Date(issuedDate) : null
  if (issuer !== undefined) data.issuer = issuer || null
  if (description !== undefined) data.description = description || null
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0
  if (isPublic !== undefined) data.isPublic = Boolean(isPublic)

  await prisma.document.update({ where: { id }, data })

  return NextResponse.json({ ok: true })
}

// DELETE — Remove from Drive + DB
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.document.findUnique({
    where: { id },
    select: { driveFileId: true },
  })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Best-effort: try delete from Drive, but don't block if it fails
  try {
    await deleteFromDrive(existing.driveFileId)
  } catch (err) {
    console.error("[DELETE Drive]", err)
  }

  await prisma.document.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
