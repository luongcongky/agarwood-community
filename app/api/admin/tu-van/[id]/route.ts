import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import type { ConsultationStatus } from "@prisma/client"

const VALID: ConsultationStatus[] = ["PENDING", "CONTACTED", "DONE", "CANCELLED"]

// PATCH /api/admin/tu-van/[id] — cập nhật trạng thái xử lý
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json().catch(() => null)
  const status = body?.status as ConsultationStatus | undefined
  if (!status || !VALID.includes(status)) {
    return NextResponse.json({ error: "Status không hợp lệ" }, { status: 400 })
  }

  const updated = await prisma.consultationRequest.update({
    where: { id },
    data: {
      status,
      handledById: session.user.id,
      handledAt: status === "PENDING" ? null : new Date(),
    },
  })
  return NextResponse.json({ consultation: updated })
}
