/**
 * Seed các trang public hiện có thành submenu dưới 5 menu cha mặc định.
 * Bỏ qua: detail pages ([slug]/[id]), auth flow, utility/legal pages.
 *
 * Idempotent: chỉ insert nếu href chưa tồn tại trong DB.
 * Run: npx tsx scripts/seed-menu-children.ts
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

type Child = { label: string; href: string; sortOrder: number }

const CHILDREN: Record<string, Child[]> = {
  // menuKey của cha → list children
  "gioi-thieu": [
    { label: "Tổng quan", href: "/gioi-thieu", sortOrder: 1 },
    { label: "Về chúng tôi", href: "/about", sortOrder: 2 },
    { label: "Ban lãnh đạo", href: "/ban-lanh-dao", sortOrder: 3 },
    { label: "Điều lệ Hội", href: "/dieu-le", sortOrder: 4 },
    { label: "Liên hệ", href: "/lien-he", sortOrder: 5 },
  ],
  "mxh": [
    { label: "Bảng tin", href: "/feed", sortOrder: 1 },
    { label: "Tin tức ngành", href: "/tin-tuc", sortOrder: 2 },
  ],
  "hoi-vien": [
    { label: "Trang giới thiệu", href: "/landing", sortOrder: 1 },
    { label: "Danh sách hội viên", href: "/hoi-vien", sortOrder: 2 },
    { label: "Doanh nghiệp", href: "/doanh-nghiep", sortOrder: 3 },
    { label: "Sản phẩm tiêu biểu", href: "/san-pham-tieu-bieu", sortOrder: 4 },
    { label: "Sản phẩm chứng nhận", href: "/san-pham-chung-nhan", sortOrder: 5 },
    { label: "Sản phẩm doanh nghiệp", href: "/san-pham-doanh-nghiep", sortOrder: 6 },
    { label: "Dịch vụ", href: "/dich-vu", sortOrder: 7 },
  ],
}

async function main() {
  // Map menuKey cha → id
  const parents = await prisma.menuItem.findMany({
    where: { parentId: null, menuKey: { in: Object.keys(CHILDREN) } },
    select: { id: true, menuKey: true },
  })
  const parentIdByKey = new Map(parents.map((p) => [p.menuKey!, p.id]))

  let created = 0
  let skipped = 0

  for (const [parentKey, list] of Object.entries(CHILDREN)) {
    const parentId = parentIdByKey.get(parentKey)
    if (!parentId) {
      console.log(`⚠ Không tìm thấy menu cha với key="${parentKey}" — bỏ qua.`)
      continue
    }

    for (const c of list) {
      // Idempotent: skip nếu đã có item cùng href dưới cùng cha
      const exists = await prisma.menuItem.findFirst({
        where: { parentId, href: c.href },
        select: { id: true },
      })
      if (exists) { skipped++; continue }

      await prisma.menuItem.create({
        data: {
          label: c.label,
          href: c.href,
          parentId,
          sortOrder: c.sortOrder,
          isVisible: true,
          // Không set menuKey cho child (registry nhận biết qua prefix; menuKey
          // chỉ gắn vào top-level để đại diện cho cụm route).
        },
      })
      created++
    }
  }

  console.log(`✓ Tạo mới: ${created}`)
  console.log(`↷ Đã có sẵn (skip): ${skipped}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
