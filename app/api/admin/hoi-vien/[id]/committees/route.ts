import { NextResponse } from "next/server"
import type { Committee } from "@prisma/client"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { prisma } from "@/lib/prisma"

/**
 * PUT /api/admin/hoi-vien/[id]/committees
 *
 * Full-replace phân bổ ban của 1 user. Body:
 *   { memberships: [{ committee: "THUONG_VU", position: "Trưởng ban" }, ...] }
 *
 * Server diff với state hiện tại + transaction:
 *   - Committee cũ không có trong payload → DELETE
 *   - Committee mới → INSERT
 *   - Committee có sẵn nhưng position đổi → UPDATE
 *
 * Chỉ ADMIN. INFINITE read-only không gọi được.
 *
 * Không broadcast cache invalidation — permissions được cache per-request qua
 * `cache()` trong lib/permissions.ts. User sẽ thấy quyền mới ở request tiếp
 * theo (tab đang mở tối đa phải F5).
 */

const VALID_COMMITTEES: Committee[] = [
  "THUONG_VU",
  "CHAP_HANH",
  "KIEM_TRA",
  "THAM_DINH",
  "THU_KY",
  "TRUYEN_THONG",
]

function isValidCommittee(value: unknown): value is Committee {
  return (
    typeof value === "string" && VALID_COMMITTEES.includes(value as Committee)
  )
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as {
    memberships?: Array<{ committee?: unknown; position?: unknown }>
  }

  if (!Array.isArray(body.memberships)) {
    return NextResponse.json(
      { error: "Body cần có field `memberships: []`" },
      { status: 400 },
    )
  }

  // Validate + normalize payload. Duplicate committee trong body → reject
  // (client lỗi logic, không phải do user gõ nhiều lần).
  const desired = new Map<Committee, string | null>()
  for (const raw of body.memberships) {
    if (!isValidCommittee(raw.committee)) {
      return NextResponse.json(
        { error: `Committee không hợp lệ: ${String(raw.committee)}` },
        { status: 400 },
      )
    }
    if (desired.has(raw.committee)) {
      return NextResponse.json(
        { error: `Committee trùng: ${raw.committee}` },
        { status: 400 },
      )
    }
    const pos = typeof raw.position === "string" ? raw.position.trim() : ""
    if (pos.length > 100) {
      return NextResponse.json(
        { error: `Vai trò tối đa 100 ký tự` },
        { status: 400 },
      )
    }
    desired.set(raw.committee, pos || null)
  }

  // Verify target user exists (admin có thể gõ sai id).
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  })
  if (!target) {
    return NextResponse.json({ error: "Không tìm thấy hội viên" }, { status: 404 })
  }
  // Chặn gán ban cho chính ADMIN/INFINITE — 2 role này đã có quyền gốc,
  // gán thêm ban = noise + nhiễu UI. Trang admin đã filter VIP/GUEST rồi
  // nhưng double-check ở server.
  if (target.role === "ADMIN" || target.role === "INFINITE") {
    return NextResponse.json(
      { error: "Không gán ban cho ADMIN/INFINITE." },
      { status: 409 },
    )
  }

  const existing = await prisma.committeeMembership.findMany({
    where: { userId: id },
    select: { id: true, committee: true, position: true },
  })
  const existingMap = new Map(existing.map((e) => [e.committee, e]))

  const toDelete: string[] = []
  const toUpdate: { id: string; position: string | null }[] = []
  const toCreate: { committee: Committee; position: string | null }[] = []

  for (const row of existing) {
    if (!desired.has(row.committee)) toDelete.push(row.id)
  }
  for (const [committee, position] of desired.entries()) {
    const prev = existingMap.get(committee)
    if (!prev) {
      toCreate.push({ committee, position })
    } else if ((prev.position ?? null) !== position) {
      toUpdate.push({ id: prev.id, position })
    }
  }

  const now = new Date()
  // Sync `User.isCouncilMember` từ trạng thái THAM_DINH membership mới.
  // Lý do dual-write: certification-council logic cũ vẫn đọc field này để
  // filter reviewer pool. Khi drop isCouncilMember ở sprint sau chỉ cần
  // xoá 1 bước update này.
  const hasThamDinh = desired.has("THAM_DINH")

  await prisma.$transaction([
    ...(toDelete.length
      ? [prisma.committeeMembership.deleteMany({ where: { id: { in: toDelete } } })]
      : []),
    ...toUpdate.map((u) =>
      prisma.committeeMembership.update({
        where: { id: u.id },
        data: { position: u.position },
      }),
    ),
    ...(toCreate.length
      ? [
          prisma.committeeMembership.createMany({
            data: toCreate.map((c) => ({
              userId: id,
              committee: c.committee,
              position: c.position,
              assignedBy: session.user.id,
              assignedAt: now,
            })),
          }),
        ]
      : []),
    prisma.user.update({
      where: { id },
      data: { isCouncilMember: hasThamDinh },
    }),
  ])

  return NextResponse.json({
    ok: true,
    counts: {
      created: toCreate.length,
      updated: toUpdate.length,
      deleted: toDelete.length,
    },
  })
}
