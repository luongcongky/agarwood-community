import { NextResponse } from "next/server"
import { revalidateTag, revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/admin/companies/[id]/verify
 * Body: { isVerified: boolean }
 *
 * Phase 3.7 round 4 (2026-04): admin toggle xác minh DN. Trước đây
 * `isVerified` chỉ được set qua seed; DN tạo qua đăng ký mặc định
 * `isVerified=false` và không có flow nào flip true → DN của hội viên
 * thật bị stuck "chưa xác minh" mãi.
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
  const { isVerified } = body as { isVerified?: boolean }

  if (typeof isVerified !== "boolean") {
    return NextResponse.json(
      { error: "isVerified bắt buộc (boolean)" },
      { status: 400 },
    )
  }

  const updated = await prisma.company.update({
    where: { id },
    data: { isVerified },
    select: { id: true, isVerified: true, name: true, slug: true },
  })

  revalidateTag("companies", "max")
  revalidateTag("homepage", "max")
  revalidatePath("/[locale]/doanh-nghiep", "page")
  revalidatePath("/[locale]/landing", "page")

  return NextResponse.json(updated)
}
