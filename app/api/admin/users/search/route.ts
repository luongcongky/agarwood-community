import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/users/search?q=<query>&limit=10
 *
 * User picker search — dùng ở LeaderManager (link Leader profile với hội
 * viên) và các admin surface khác cần chọn hội viên.
 *
 * Match theo name + email (contains, case-insensitive). Loại ADMIN khỏi
 * kết quả vì các UI hiện tại chỉ dùng picker cho VIP/GUEST/INFINITE leader.
 *
 * Gate: admin:read (mọi role vào /admin đều search được — không phải mutation).
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "admin:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()
  const limitRaw = Number(searchParams.get("limit") ?? 10)
  const limit = Math.max(1, Math.min(50, isFinite(limitRaw) ? limitRaw : 10))

  // Empty query → trả mảng rỗng thay vì list tất cả (tránh spam).
  if (q.length < 1) {
    return NextResponse.json({ users: [] })
  }

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["VIP", "GUEST", "INFINITE"] },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      accountType: true,
      isActive: true,
      company: { select: { name: true } },
    },
  })

  return NextResponse.json({ users })
}
