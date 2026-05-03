/** Verify coverage *_ar trên Supabase sau seed. */
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

async function main() {
  const url = process.env.SUPABASE_DIRECT_URL
  if (!url) throw new Error("Missing SUPABASE_DIRECT_URL")
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } })

  const q = async (sql: string) => (await pool.query<{ c: string }>(sql)).rows[0].c

  const checks: Array<[string, string]> = [
    ["MenuItem.label_ar",   `SELECT COUNT(*)::text AS c FROM menu_items WHERE label_ar IS NOT NULL AND label_ar <> ''`],
    ["MenuItem total",       `SELECT COUNT(*)::text AS c FROM menu_items`],
    ["Leader.title_ar",      `SELECT COUNT(*)::text AS c FROM leaders WHERE "isActive"=true AND title_ar IS NOT NULL AND title_ar <> ''`],
    ["Leader total active",  `SELECT COUNT(*)::text AS c FROM leaders WHERE "isActive"=true`],
    ["Leader.honorific_ar",  `SELECT COUNT(*)::text AS c FROM leaders WHERE "isActive"=true AND honorific_ar IS NOT NULL AND honorific_ar <> ''`],
    ["Leaders with honorific", `SELECT COUNT(*)::text AS c FROM leaders WHERE "isActive"=true AND honorific IS NOT NULL AND honorific <> ''`],
  ]
  console.log("Supabase Arabic coverage:\n")
  for (const [label, sql] of checks) {
    console.log(`  ${label.padEnd(28)} ${await q(sql)}`)
  }
  await pool.end()
}
main().catch((e) => { console.error(e); process.exit(1) })
