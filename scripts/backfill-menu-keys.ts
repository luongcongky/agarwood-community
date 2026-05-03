/**
 * Gán menuKey cho 5 menu mặc định (chạy 1 lần sau migration add_menu_key).
 * Idempotent: chỉ update khi menuKey null và label khớp.
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

const MAP: Record<string, string> = {
  "/": "trang-chu",
  "/gioi-thieu": "gioi-thieu",
  "/nghien-cuu": "nghien-cuu",
  "/feed": "mxh",
  "/landing": "hoi-vien",
}

async function main() {
  const items = await prisma.menuItem.findMany()
  let updated = 0
  for (const it of items) {
    if (it.menuKey) continue
    const key = MAP[it.href]
    if (!key) continue
    await prisma.menuItem.update({ where: { id: it.id }, data: { menuKey: key } })
    updated++
  }
  console.log(`Backfilled menuKey cho ${updated} item.`)
}
main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
