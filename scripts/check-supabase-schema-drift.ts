/**
 * Cho từng pending migration, kiểm tra xem object chính (bảng/column/enum)
 * đã tồn tại trên Supabase chưa. Dùng để phân biệt drift vs genuine-pending.
 * Read-only.
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

type Check = {
  migration: string
  probe: string
  sql: string
}

const CHECKS: Check[] = [
  // (1) honorary_contribution — already confirmed incomplete; table exists
  { migration: "20260416100000_add_honorary_contribution", probe: "enum HonoraryCategory", sql: `SELECT 1 FROM pg_type WHERE typname = 'HonoraryCategory'` },
  // (2) add_user_bio — check column User.bio
  { migration: "20260416200000_add_user_bio", probe: "User.bio column", sql: `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='bio'` },
  // (3) baseline_db_push_drift — check leaders table
  { migration: "20260416200000_baseline_db_push_drift", probe: "leaders table", sql: `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leaders'` },
  // (4) baseline_part2 — check NewsCategory LEGAL value
  { migration: "20260416300000_baseline_db_push_drift_part2", probe: "NewsCategory LEGAL value", sql: `SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='NewsCategory' AND e.enumlabel='LEGAL'` },
  // (5) i18n columns — check news.title_en
  { migration: "20260417000000_add_i18n_columns", probe: "news.title_en column", sql: `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='news' AND column_name='title_en'` },
  // (6) profile i18n — check users.bio_en or similar
  { migration: "20260418000000_add_profile_i18n_columns", probe: "users.bio_en column", sql: `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='bio_en'` },
  // (7) contact_messages — NEW table
  { migration: "20260419000000_add_contact_messages", probe: "contact_messages table", sql: `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contact_messages'` },
  // (8) sidebar banner — enum value
  { migration: "20260419100000_add_sidebar_banner_position", probe: "BannerPosition SIDEBAR value", sql: `SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='BannerPosition' AND e.enumlabel='SIDEBAR'` },
  // (9) arabic columns
  { migration: "20260420000000_add_arabic_locale_columns", probe: "news.title_ar column", sql: `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='news' AND column_name='title_ar'` },
  // (10) news/banner perf indexes
  { migration: "20260420010000_add_news_banner_perf_indexes", probe: "news_isPublished_publishedAt index", sql: `SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname LIKE 'news_%published%'` },
  // (11) news SEO fields
  { migration: "20260420020000_add_news_seo_fields", probe: "news.seoTitle column", sql: `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='news' AND column_name='seoTitle'` },
  // (12) HDTD enum
  { migration: "20260421000000_add_hdtd_leader_category", probe: "LeaderCategory HDTD value", sql: `SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='LeaderCategory' AND e.enumlabel='HDTD'` },
  // (13) document ticker index
  { migration: "20260421010000_add_document_ticker_index", probe: "documents_isPublic_createdAt index", sql: `SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname = 'documents_isPublic_createdAt_idx'` },
  // (14) company gallery
  { migration: "20260421020000_add_company_gallery_images", probe: "company_gallery_images table", sql: `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='company_gallery_images'` },
]

async function main() {
  const url = process.env.SUPABASE_DIRECT_URL
  if (!url) throw new Error("Missing SUPABASE_DIRECT_URL")
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } })

  console.log("Probing Supabase for drift vs genuine pending:\n")
  const drift: string[] = []
  const pending: string[] = []

  for (const c of CHECKS) {
    const { rowCount } = await pool.query(c.sql)
    const exists = (rowCount ?? 0) > 0
    const status = exists ? "DRIFT (exists)" : "PENDING (missing)"
    const marker = exists ? "⚠" : "→"
    console.log(`  ${marker} ${c.migration.padEnd(55)} ${status}  [${c.probe}]`)
    if (exists) drift.push(c.migration)
    else pending.push(c.migration)
  }

  console.log()
  console.log(`Drift (needs 'migrate resolve --applied'): ${drift.length}`)
  console.log(`Genuine pending (will apply cleanly):      ${pending.length}`)

  if (drift.length > 0) {
    console.log("\nBash commands to resolve drift:")
    for (const m of drift) {
      console.log(`  MIGRATE_TARGET=supabase npx prisma migrate resolve --applied ${m}`)
    }
  }

  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
