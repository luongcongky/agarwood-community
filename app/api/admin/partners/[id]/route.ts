import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import type { PartnerCategory } from "@prisma/client"

const VALID_CATEGORIES: PartnerCategory[] = [
  "GOVERNMENT",
  "ASSOCIATION",
  "RESEARCH",
  "ENTERPRISE",
  "INTERNATIONAL",
  "MEDIA",
  "OTHER",
]

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const data: Record<string, unknown> = {}

  if (typeof body.name === "string" && body.name.trim().length >= 2) data.name = body.name.trim()
  if ("shortName" in body)
    data.shortName = typeof body.shortName === "string" && body.shortName.trim() ? body.shortName.trim() : null
  if (VALID_CATEGORIES.includes(body.category)) data.category = body.category
  if ("logoUrl" in body)
    data.logoUrl = typeof body.logoUrl === "string" && body.logoUrl.trim() ? body.logoUrl.trim() : null
  if ("websiteUrl" in body)
    data.websiteUrl =
      typeof body.websiteUrl === "string" && body.websiteUrl.trim() ? body.websiteUrl.trim() : null
  if ("description" in body)
    data.description =
      typeof body.description === "string" && body.description.trim() ? body.description.trim() : null
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder
  if (typeof body.isActive === "boolean") data.isActive = body.isActive

  try {
    const partner = await prisma.partner.update({ where: { id }, data })
    revalidateTag("partners", "max")
    return NextResponse.json({ partner })
  } catch {
    return NextResponse.json({ error: "Không tìm thấy đối tác" }, { status: 404 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  try {
    await prisma.partner.delete({ where: { id } })
    revalidateTag("partners", "max")
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Không tìm thấy đối tác" }, { status: 404 })
  }
}
