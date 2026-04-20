import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import type { ContactStatus } from "@prisma/client"

const VALID: ContactStatus[] = ["NEW", "HANDLED", "ARCHIVED"]

// PATCH /api/admin/contact-messages/[id] — admin cập nhật trạng thái
// và (tùy chọn) ghi chú nội bộ về tin nhắn liên hệ.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json().catch(() => null)
  const status = body?.status as ContactStatus | undefined
  const adminNote = typeof body?.adminNote === "string" ? body.adminNote : undefined

  if (!status || !VALID.includes(status)) {
    return NextResponse.json({ error: "Status không hợp lệ" }, { status: 400 })
  }

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: {
      status,
      handledById: session.user.id,
      handledAt: status === "NEW" ? null : new Date(),
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
  })
  return NextResponse.json({ message: updated })
}
