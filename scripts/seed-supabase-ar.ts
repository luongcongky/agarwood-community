/**
 * Seed *_ar cho DB production (Supabase):
 *   - MenuItem.label_ar       (18 navbar items)
 *   - Leader.title_ar          (9 unique titles)
 *   - Leader.honorific_ar      (common honorifics: Ông, TS., PGS.TS., ...)
 *
 * Dùng pg Pool với SUPABASE_DIRECT_URL để KHÔNG đụng DATABASE_URL (local).
 * Idempotent: chỉ update row đang có field_ar NULL hoặc rỗng.
 *
 * Chạy:   npx tsx scripts/seed-supabase-ar.ts
 */
import { readFileSync, existsSync } from "fs"
import { Pool } from "pg"

function loadEnv(): void {
  if (!existsSync(".env.local")) return
  for (const line of readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue
    const eq = t.indexOf("="); if (eq === -1) continue
    const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!(k in process.env)) process.env[k] = v
  }
}
loadEnv()

// ── MenuItem dictionaries ──────────────────────────────────────────────────

/** Theo menuKey (stable, không đổi). */
const MENU_BY_KEY: Record<string, string> = {
  home: "الرئيسية",
  trang_chu: "الرئيسية",
  about: "من نحن",
  gioi_thieu: "من نحن",
  leadership: "القيادة",
  news: "الأخبار",
  research: "الأبحاث",
  nghien_cuu: "الأبحاث",
  feed: "المجتمع",
  companies: "الشركات",
  members: "الأعضاء",
  hoi_vien: "الأعضاء",
  marketplace: "المنتجات",
  cert_products: "المنتجات المعتمدة",
  certified_products: "المنتجات المعتمدة",
  services: "الخدمات",
  register: "التسجيل",
  contact: "اتصل بنا",
  charter: "النظام الأساسي",
  dieu_le: "النظام الأساسي",
  legal_docs: "الوثائق القانونية",
  phap_ly: "الوثائق القانونية",
  surveys: "الاستبيانات",
  banner: "الإعلانات",
  partners: "الشركاء",
  verify: "التحقق",
  mxh: "منصة العود الاجتماعية",
}

/** Fallback theo label VI (trim). */
const MENU_BY_VI: Record<string, string> = {
  "Trang chủ": "الرئيسية",
  "Giới thiệu": "من نحن",
  "Về chúng tôi": "من نحن",
  "Ban lãnh đạo": "القيادة",
  "Tin tức": "الأخبار",
  "Nghiên cứu": "الأبحاث",
  "Cộng đồng": "المجتمع",
  "Diễn đàn": "المجتمع",
  "Doanh nghiệp": "الشركات",
  "Hội viên": "الأعضاء",
  "Thành viên": "الأعضاء",
  "Sản phẩm": "المنتجات",
  "Sản phẩm chứng nhận": "المنتجات المعتمدة",
  "Sản phẩm tiêu biểu": "المنتجات المميزة",
  "Dịch vụ": "الخدمات",
  "Đăng ký": "التسجيل",
  "Liên hệ": "اتصل بنا",
  "Điều lệ": "النظام الأساسي",
  "Điều lệ Hội": "النظام الأساسي للجمعية",
  "Pháp lý": "الوثائق القانونية",
  "Khảo sát": "الاستبيانات",
  "Quảng cáo": "الإعلانات",
  "Đối tác": "الشركاء",
  "Xác thực": "التحقق",
  "Xác minh": "التحقق",
  "MXH Trầm Hương": "منصة العود الاجتماعية",
  "Tổng quan": "نظرة عامة",
  "Bảng tin": "اللوحة الإخبارية",
  "Tin tức ngành": "أخبار القطاع",
  "Trang giới thiệu": "من نحن",
  "Danh sách hội viên": "دليل الأعضاء",
  "Sản phẩm doanh nghiệp": "منتجات الشركات",
  "Thẻ hội viên": "بطاقة العضوية",
}

// ── Leader dictionaries ───────────────────────────────────────────────────

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

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const url = process.env.SUPABASE_DIRECT_URL
  if (!url) throw new Error("Missing SUPABASE_DIRECT_URL")

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  })

  console.log("Target: Supabase public schema\n")

  // ─── Phase 1: MenuItem.label_ar ───────────────────────────────────────────
  console.log("── Seeding MenuItem.label_ar ──")
  const { rows: menuItems } = await pool.query<{ id: string; menuKey: string | null; label: string; label_ar: string | null }>(
    `SELECT id, "menuKey", label, label_ar FROM menu_items`,
  )

  let menuUpdated = 0
  const menuUnmatched: string[] = []
  for (const m of menuItems) {
    if (m.label_ar && m.label_ar.trim()) continue // đã có

    const byKey = m.menuKey ? MENU_BY_KEY[m.menuKey] : undefined
    const byVi = MENU_BY_VI[m.label.trim()]
    const ar = byKey ?? byVi
    if (!ar) {
      menuUnmatched.push(`${m.menuKey ?? "(no key)"} | ${m.label}`)
      continue
    }
    await pool.query(`UPDATE menu_items SET label_ar = $1 WHERE id = $2`, [ar, m.id])
    menuUpdated++
    console.log(`  ✓ ${(m.menuKey ?? m.label).padEnd(32)} → ${ar}`)
  }
  console.log(`MenuItem: ${menuUpdated}/${menuItems.length} updated.`)
  if (menuUnmatched.length) {
    console.log("⚠ Unmatched (cần điền thủ công):")
    menuUnmatched.forEach((x) => console.log(`    ${x}`))
  }

  // ─── Phase 2: Leader.title_ar + honorific_ar ──────────────────────────────
  console.log("\n── Seeding Leader.title_ar + honorific_ar ──")
  const { rows: leaders } = await pool.query<{
    id: string
    name: string
    title: string
    title_ar: string | null
    honorific: string | null
    honorific_ar: string | null
  }>(
    `SELECT id, name, title, title_ar, honorific, honorific_ar FROM leaders WHERE "isActive" = true`,
  )

  let titleUpdated = 0; let honorificUpdated = 0
  const unmatchedTitles: string[] = []; const unmatchedHonorifics: string[] = []

  for (const l of leaders) {
    const sets: string[] = []
    const vals: (string | number)[] = []
    let idx = 1

    if (!l.title_ar || !l.title_ar.trim()) {
      const ar = TITLE_AR[l.title.trim()]
      if (ar) {
        sets.push(`title_ar = $${idx++}`)
        vals.push(ar)
        titleUpdated++
      } else unmatchedTitles.push(l.title)
    }

    if (l.honorific && (!l.honorific_ar || !l.honorific_ar.trim())) {
      const ar = HONORIFIC_AR[l.honorific.trim()]
      if (ar) {
        sets.push(`honorific_ar = $${idx++}`)
        vals.push(ar)
        honorificUpdated++
      } else unmatchedHonorifics.push(l.honorific)
    }

    if (sets.length > 0) {
      vals.push(l.id)
      await pool.query(`UPDATE leaders SET ${sets.join(", ")} WHERE id = $${idx}`, vals)
      console.log(`  ✓ ${l.name.padEnd(32)} · ${sets.join(", ")}`)
    }
  }

  console.log(`Leader.title_ar: ${titleUpdated} updated.`)
  console.log(`Leader.honorific_ar: ${honorificUpdated} updated.`)
  if (unmatchedTitles.length) {
    console.log("⚠ Unmatched titles:")
    ;[...new Set(unmatchedTitles)].forEach((t) => console.log(`    ${t}`))
  }
  if (unmatchedHonorifics.length) {
    console.log("⚠ Unmatched honorifics:")
    ;[...new Set(unmatchedHonorifics)].forEach((h) => console.log(`    ${h}`))
  }

  console.log("\n⚠ KHÔNG seed: Leader.name_ar (phiên âm tên riêng), workTitle_ar, bio_ar.")
  console.log("   Các field này cần admin điền thủ công.")

  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
