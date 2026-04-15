import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { driveDownloadUrl: true, isPublic: true, fileName: true },
  })

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Check access: admin always, VIP only if public
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isAdmin(session.user.role) && !doc.isPublic) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Log download
  await prisma.document.update({ where: { id }, data: { downloadCount: { increment: 1 } } })

  // Redirect to Drive download URL
  return NextResponse.redirect(doc.driveDownloadUrl)
}
