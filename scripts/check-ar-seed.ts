/**
 * Đếm coverage tiếng Ả Rập (*_ar columns) trên các model có i18n.
 * Read-only. Chạy: npx tsx scripts/check-ar-seed.ts
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
  const pct = (f: number, t: number) => (t === 0 ? "—" : `${Math.round((f/t)*100)}%`)
  const nonEmpty = <T extends Record<string, unknown>>(rows: T[], key: string) =>
    rows.filter((r) => { const v = r[key]; return typeof v === "string" && v.trim().length > 0 }).length

  const [menu, leaders, , news] = await Promise.all([
    prisma.menuItem.findMany({ select: { label: true, label_ar: true } }),
    prisma.leader.findMany({ where: { isActive: true }, select: {
      name: true, name_ar: true, title: true, title_ar: true,
      honorific: true, honorific_ar: true, workTitle: true, workTitle_ar: true,
      bio: true, bio_ar: true,
    } }),
    // Partner không có *_ar columns — description là plaintext, dùng chung
    Promise.resolve<Array<Record<string, unknown>>>([]),
    prisma.news.findMany({ where: { isPublished: true }, select: { title: true, title_ar: true, excerpt: true, excerpt_ar: true } }),
    // Post (bài viết hội viên) chưa có *_ar — user-generated content
    Promise.resolve<Array<Record<string, unknown>>>([]),
  ])

  const rows: Array<[string, number, number]> = [
    ["MenuItem.label_ar",      nonEmpty(menu, "label_ar"),     menu.length],
    ["Leader.name_ar",         nonEmpty(leaders, "name_ar"),   leaders.length],
    ["Leader.title_ar",        nonEmpty(leaders, "title_ar"),  leaders.length],
    ["Leader.honorific_ar",    nonEmpty(leaders, "honorific_ar"), leaders.length],
    ["Leader.workTitle_ar",    nonEmpty(leaders, "workTitle_ar"), leaders.length],
    ["Leader.bio_ar",          nonEmpty(leaders, "bio_ar"),    leaders.length],
    ["News.title_ar",          nonEmpty(news, "title_ar"),    news.length],
    ["News.excerpt_ar",        nonEmpty(news, "excerpt_ar"),   news.length],
  ]

  console.log("Arabic coverage per DB field:")
  for (const [label, f, total] of rows) {
    console.log(`  ${label.padEnd(30)} ${String(f).padStart(4)}/${String(total).padEnd(4)}  ${pct(f, total)}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
