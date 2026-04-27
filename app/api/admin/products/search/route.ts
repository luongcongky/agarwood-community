import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

/**
 * Tìm sản phẩm theo tên — dùng cho ProductPicker khi tạo News.category=PRODUCT.
 * Filter `companyId` để chỉ list SP của doanh nghiệp đã chọn.
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "news:write") && !hasPermission(perms, "admin:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const url = new URL(req.url)
  const q = (url.searchParams.get("q") ?? "").trim()
  const companyId = url.searchParams.get("companyId") ?? undefined
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") ?? 10)))

  const products = await prisma.product.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      ...(q
        ? {
            OR: [
              { id: q }, // exact id match — dùng cho prefill khi edit news
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrls: true,
      priceRange: true,
      certStatus: true,
      company: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json({ products })
}
