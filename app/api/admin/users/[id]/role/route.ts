import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import type { Role } from "@prisma/client"

const ALLOWED_TARGET: Role[] = ["GUEST", "VIP", "INFINITE"]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { role?: string }
  const target = body.role as Role | undefined

  if (!target || !ALLOWED_TARGET.includes(target)) {
    return NextResponse.json(
      { error: "Role không hợp lệ. Chỉ chấp nhận GUEST | VIP | INFINITE." },
      { status: 400 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Không thể đổi role của tài khoản ADMIN chuyên dụng." },
      { status: 400 },
    )
  }

  await prisma.user.update({
    where: { id },
    data: { role: target, ...(target === "INFINITE" ? { isActive: true } : {}) },
  })

  return NextResponse.json({ ok: true, role: target })
}
