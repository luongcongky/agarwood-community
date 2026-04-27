import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/admin/companies/[id]/featured
 * Body: { isFeatured?: boolean, featuredOrder?: number | null }
 *
 * Validate: chỉ cho phép pin doanh nghiệp có owner là VIP hoặc INFINITE.
 */
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
  const { isFeatured, featuredOrder } = body as {
    isFeatured?: boolean
    featuredOrder?: number | null
  }

  if (isFeatured === true) {
    const company = await prisma.company.findUnique({
      where: { id },
      select: { owner: { select: { role: true } } },
    })
    if (!company) {
      return NextResponse.json({ error: "Doanh nghiệp không tồn tại" }, { status: 404 })
    }
    if (company.owner.role !== "VIP" && company.owner.role !== "INFINITE") {
      return NextResponse.json(
        { error: "Chỉ có thể chọn DN tiêu biểu từ hội viên VIP / INFINITE" },
        { status: 400 },
      )
    }
  }

  const data: { isFeatured?: boolean; featuredOrder?: number | null } = {}
  if (typeof isFeatured === "boolean") data.isFeatured = isFeatured
  if (featuredOrder === null || typeof featuredOrder === "number") {
    data.featuredOrder = featuredOrder
  }
  if (isFeatured === false) {
    data.featuredOrder = null
  }

  const updated = await prisma.company.update({
    where: { id },
    data,
    select: { id: true, isFeatured: true, featuredOrder: true },
  })

  revalidateTag("homepage", "max")
  revalidateTag("companies", "max")

  return NextResponse.json(updated)
}
