/**
 * Seed menu_items với data mặc định (giống PUBLIC_LINKS hard-code trước đây).
 * Idempotent: chỉ insert khi bảng rỗng.
 * Run: npx tsx scripts/seed-menu.ts
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

const DEFAULTS = [
  { label: "Trang chủ", href: "/", sortOrder: 1, matchPrefixes: [] as string[] },
  { label: "Giới thiệu", href: "/gioi-thieu-v2", sortOrder: 2, matchPrefixes: ["/gioi-thieu", "/gioi-thieu-v2"] },
  { label: "Nghiên cứu", href: "/nghien-cuu", sortOrder: 3, matchPrefixes: ["/nghien-cuu"] },
  { label: "MXH Trầm Hương", href: "/feed", sortOrder: 4, isNew: true, matchPrefixes: ["/feed", "/bai-viet"] },
  { label: "Hội viên", href: "/landing", sortOrder: 5, matchPrefixes: ["/landing", "/hoi-vien"] },
]

async function main() {
  const existing = await prisma.menuItem.count()
  if (existing > 0) {
    console.log(`Đã có ${existing} menu items — bỏ qua seed.`)
    return
  }
  for (const m of DEFAULTS) {
    await prisma.menuItem.create({
      data: {
        label: m.label,
        href: m.href,
        sortOrder: m.sortOrder,
        isNew: m.isNew ?? false,
        matchPrefixes: m.matchPrefixes,
      },
    })
  }
  console.log(`Seeded ${DEFAULTS.length} menu items.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
