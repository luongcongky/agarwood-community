/**
 * Seed `Leader.title_ar` + `Leader.honorific_ar` — pattern-based dịch.
 * KHÔNG seed: name_ar (phiên âm tên riêng), workTitle_ar (quá biến), bio_ar
 * (nội dung dài, admin nên viết tay).
 * Idempotent: chỉ update field đang trống.
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

/** Bảng dịch title — match trim()+lowercase không dấu; giữ accent comparison đơn giản */
const TITLE_AR: Record<string, string> = {
  "Chủ tịch": "الرئيس",
  "Chủ tịch Danh dự": "الرئيس الفخري",
  "Phó Chủ tịch": "نائب الرئيس",
  "Tổng Thư ký": "الأمين العام",
  "Chánh Văn Phòng": "رئيس المكتب",
  "Ủy viên Thường vụ": "عضو اللجنة الدائمة",
  "Ủy viên Thường vụ, Trưởng Ban Kiểm tra": "عضو اللجنة الدائمة، رئيس لجنة التفتيش",
  "Ủy viên Ban Kiểm tra": "عضو لجنة التفتيش",
  "Ủy viên": "عضو",
}

const HONORIFIC_AR: Record<string, string> = {
  "Ông": "السيد",
  "Bà": "السيدة",
  "TS.": "د.",
  "ThS.": "ماجستير",
  "PGS.TS.": "أ.م.د.",
  "PGS. TS": "أ.م.د.",
  "GS.TS.": "أ.د.",
}

function lookup(map: Record<string, string>, v: string | null): string | null {
  if (!v) return null
  const trimmed = v.trim()
  if (map[trimmed]) return map[trimmed]
  return null
}

async function main() {
  const leaders = await prisma.leader.findMany({
    where: { isActive: true },
    select: { id: true, name: true, title: true, title_ar: true, honorific: true, honorific_ar: true },
  })

  let titleUpdated = 0; let honorificUpdated = 0
  const unmatchedTitles: string[] = []; const unmatchedHonorifics: string[] = []

  for (const l of leaders) {
    const data: { title_ar?: string; honorific_ar?: string } = {}

    if (!l.title_ar || !l.title_ar.trim()) {
      const ar = lookup(TITLE_AR, l.title)
      if (ar) { data.title_ar = ar; titleUpdated++ }
      else unmatchedTitles.push(l.title)
    }

    if (l.honorific && (!l.honorific_ar || !l.honorific_ar.trim())) {
      const ar = lookup(HONORIFIC_AR, l.honorific)
      if (ar) { data.honorific_ar = ar; honorificUpdated++ }
      else unmatchedHonorifics.push(l.honorific)
    }

    if (Object.keys(data).length > 0) {
      await prisma.leader.update({ where: { id: l.id }, data })
      console.log(`✓ ${l.name.padEnd(30)} · ${JSON.stringify(data)}`)
    }
  }

  console.log(`\ntitle_ar updated: ${titleUpdated}`)
  console.log(`honorific_ar updated: ${honorificUpdated}`)
  if (unmatchedTitles.length) {
    console.log(`\n⚠ Unmatched titles (cần thêm vào TITLE_AR map):`)
    ;[...new Set(unmatchedTitles)].forEach((t) => console.log(`  ${t}`))
  }
  if (unmatchedHonorifics.length) {
    console.log(`\n⚠ Unmatched honorifics:`)
    ;[...new Set(unmatchedHonorifics)].forEach((h) => console.log(`  ${h}`))
  }
  console.log(`\nKhông seed: name_ar (${leaders.length}), workTitle_ar, bio_ar — admin cần điền thủ công.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
