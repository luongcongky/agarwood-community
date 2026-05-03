/**
 * Đọc _prisma_migrations trên Supabase để biết migration nào đã track.
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

async function main() {
  const url = process.env.SUPABASE_DIRECT_URL
  if (!url) throw new Error("Missing SUPABASE_DIRECT_URL")

  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } })

  const { rows } = await pool.query<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>(
    `SELECT migration_name, finished_at, rolled_back_at
     FROM _prisma_migrations
     ORDER BY migration_name ASC`,
  )

  console.log(`Total tracked on Supabase: ${rows.length}`)
  console.log()
  for (const r of rows) {
    const status = r.rolled_back_at ? "⊘ rolled back" : r.finished_at ? "✓" : "⚠ incomplete"
    console.log(`  ${status} ${r.migration_name}`)
  }

  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
