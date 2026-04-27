import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

/**
 * Tìm công ty theo tên — dùng cho CompanyPicker trong NewsEditor
 * (category=BUSINESS/PRODUCT). Cần news:write tối thiểu.
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
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") ?? 10)))

  const companies = await prisma.company.findMany({
    where: q
      ? {
          OR: [
            { id: q }, // exact id match — dùng cho prefill khi edit news
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { name: "asc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  })
  return NextResponse.json({ companies })
}
