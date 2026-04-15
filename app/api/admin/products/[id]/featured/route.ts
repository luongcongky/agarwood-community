import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { isAdmin, canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/admin/products/[id]/featured
 * Body: { isFeatured?: boolean, featuredOrder?: number | null }
 *
 * Validate: chỉ cho phép pin SP của doanh nghiệp có owner là VIP.
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

  // Khi bật featured, validate owner phải là VIP hoặc ADMIN
  if (isFeatured === true) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { owner: { select: { role: true } } },
    })
    if (!product) {
      return NextResponse.json({ error: "Sản phẩm không tồn tại" }, { status: 404 })
    }
    if (product.owner.role !== "VIP" && !isAdmin(product.owner.role)) {
      return NextResponse.json(
        { error: "Chỉ có thể chọn sản phẩm tiêu biểu từ hội viên VIP" },
        { status: 400 },
      )
    }
  }

  const data: { isFeatured?: boolean; featuredOrder?: number | null } = {}
  if (typeof isFeatured === "boolean") data.isFeatured = isFeatured
  if (featuredOrder === null || typeof featuredOrder === "number") {
    data.featuredOrder = featuredOrder
  }

  // Khi unfeature, clear order luôn cho gọn
  if (isFeatured === false) {
    data.featuredOrder = null
  }

  const updated = await prisma.product.update({
    where: { id },
    data,
    select: { id: true, isFeatured: true, featuredOrder: true },
  })

  // Invalidate trang chủ + trang sản phẩm tiêu biểu (Next 16: cần profile)
  revalidateTag("homepage", "max")
  revalidateTag("products", "max")

  return NextResponse.json(updated)
}
