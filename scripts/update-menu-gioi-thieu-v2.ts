/**
 * Update menu item "Giới thiệu" → trỏ tới /gioi-thieu-v2 thay vì /gioi-thieu.
 * Idempotent: chạy nhiều lần không sao, sẽ overwrite.
 * Run: npx tsx scripts/update-menu-gioi-thieu-v2.ts
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

async function main() {
  // Tìm menu item "Giới thiệu" top-level (parentId null, label tiếng Việt).
  // Match theo label vì href cũ có thể đã được update từ trước.
  const item = await prisma.menuItem.findFirst({
    where: {
      parentId: null,
      label: "Giới thiệu",
    },
  })

  if (!item) {
    console.error("Không tìm thấy menu item 'Giới thiệu' top-level. Chạy `npx tsx scripts/seed-menu.ts` trước.")
    process.exit(1)
  }

  const updated = await prisma.menuItem.update({
    where: { id: item.id },
    data: {
      href: "/gioi-thieu-v2",
      // Giữ "/gioi-thieu" trong matchPrefixes để URL cũ vẫn highlight menu
      matchPrefixes: ["/gioi-thieu", "/gioi-thieu-v2"],
    },
  })

  console.log(`✓ Updated menu item ${updated.id}:`)
  console.log(`  label: ${updated.label}`)
  console.log(`  href: ${updated.href}`)
  console.log(`  matchPrefixes: ${JSON.stringify(updated.matchPrefixes)}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
