/**
 * Thêm leader "Chánh Văn Phòng: Nguyễn Văn Tùng" nếu chưa có.
 * Idempotent: skip nếu đã tồn tại leader cùng tên + title.
 */
import { readFileSync, existsSync } from "fs"
function loadEnvLocal(): void {
  if (!existsSync(".env.local")) return
  for (const line of readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue
    const eq = t.indexOf("="); if (eq === -1) continue
    const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!(k in process.env)) process.env[k] = v
  }
}
loadEnvLocal()
/* eslint-disable @typescript-eslint/no-require-imports */
const { prisma } = require("../lib/prisma") as typeof import("../lib/prisma")
/* eslint-enable @typescript-eslint/no-require-imports */

const NAME = "Nguyễn Văn Tùng"
const TITLE = "Chánh Văn Phòng"
const TERM = "Nhiệm kỳ III (2023–2028)"

async function main() {
  const exists = await prisma.leader.findFirst({
    where: { title: TITLE, name: NAME },
    select: { id: true },
  })
  if (exists) { console.log("Đã tồn tại, skip."); return }

  const user = await prisma.user.findFirst({
    where: { name: { contains: NAME, mode: "insensitive" } },
    select: { id: true, avatarUrl: true },
  })

  const last = await prisma.leader.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  })

  const created = await prisma.leader.create({
    data: {
      name: NAME,
      title: TITLE,
      category: "BTV", // Chánh Văn Phòng thuộc Ban Thường vụ
      term: TERM,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      isActive: true,
      userId: user?.id ?? null,
      photoUrl: user?.avatarUrl ?? null,
    },
  })
  console.log("Tạo leader:", created.id, "— linked user:", user?.id ?? "(none)")
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
