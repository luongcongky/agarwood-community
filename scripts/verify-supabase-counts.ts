/** Verify row counts trên Supabase sau migration — so với backup. */
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

const EXPECTED = {
  users: 61, companies: 28, news: 59, leaders: 23, posts: 202,
  products: 100, menu_items: 17, partners: 8, documents: 8, site_config: 29,
  hero_images: 1, membership_applications: 1, post_tags: 206, tags: 14,
  survey_responses: 2, surveys: 2, honorary_contributions: 0,
  // New tables (should exist & be empty):
  contact_messages: 0, company_gallery_images: 0,
} as const

async function main() {
  const url = process.env.SUPABASE_DIRECT_URL
  if (!url) throw new Error("Missing SUPABASE_DIRECT_URL")
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } })

  let ok = 0; let drift = 0
  console.log("Post-migration row-count verification:\n")
  for (const [table, expected] of Object.entries(EXPECTED)) {
    try {
      const { rows } = await pool.query<{ c: string }>(`SELECT COUNT(*)::text AS c FROM "${table}"`)
      const actual = Number(rows[0].c)
      const match = actual === expected
      const icon = match ? "✓" : "⚠"
      console.log(`  ${icon} ${table.padEnd(30)} expected=${expected} actual=${actual}`)
      if (match) ok++; else drift++
    } catch (e) {
      console.log(`  ✗ ${table.padEnd(30)} ERROR: ${(e as Error).message}`)
      drift++
    }
  }
  console.log(`\n${ok}/${ok + drift} tables match expected counts.`)
  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
