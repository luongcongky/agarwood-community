import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/admin/users/:id/profile — admin chỉnh sửa thông tin hội viên.
 * Phase 3.7 (2026-04): admin có thể đổi name/phone/bio/avatar của bất kỳ
 * user nào. Bank info + password thuộc privacy → admin KHÔNG động vào (đổi
 * password vẫn qua /reset-password endpoint riêng).
 *
 * Auth: chỉ ADMIN (canAdminWrite). INFINITE/committee không được — info
 * cá nhân là sensitive.
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
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  })
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await request.json()
  const { name, phone, bio, avatarUrl } = body as {
    name?: string
    phone?: string | null
    bio?: string | null
    avatarUrl?: string | null
  }

  const updateData: Record<string, unknown> = {}
  if (typeof name === "string" && name.trim().length >= 2) {
    updateData.name = name.trim()
  } else if (name !== undefined) {
    return NextResponse.json({ error: "Tên tối thiểu 2 ký tự" }, { status: 400 })
  }
  if (phone !== undefined) {
    if (phone === null || phone === "") {
      updateData.phone = null
    } else if (typeof phone === "string" && /^(0|\+84)\d{8,9}$/.test(phone)) {
      updateData.phone = phone
    } else {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 })
    }
  }
  if (bio !== undefined) {
    if (bio === null || bio === "") {
      updateData.bio = null
    } else if (typeof bio === "string" && bio.length <= 2000) {
      updateData.bio = bio.trim()
    } else {
      return NextResponse.json({ error: "Tiểu sử tối đa 2000 ký tự" }, { status: 400 })
    }
  }
  if (avatarUrl !== undefined) {
    if (avatarUrl === null || avatarUrl === "") {
      updateData.avatarUrl = null
    } else if (typeof avatarUrl === "string" && /^https:\/\/res\.cloudinary\.com\//.test(avatarUrl)) {
      updateData.avatarUrl = avatarUrl
    } else {
      return NextResponse.json({ error: "URL avatar không hợp lệ" }, { status: 400 })
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Không có gì để cập nhật" }, { status: 400 })
  }

  await prisma.user.update({ where: { id }, data: updateData })
  return NextResponse.json({ success: true })
}
