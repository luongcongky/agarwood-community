/**
 * Backup schema `public` từ Supabase (live) → schema `backup` trên local DB.
 *
 * Flow (hướng A trong phân tích):
 *   1. Auto-detect pg_dump + psql (Windows: quét C:\Program Files\PostgreSQL\{ver}\bin)
 *   2. pg_dump --schema=public từ SUPABASE_DIRECT_URL → file SQL tạm
 *   3. Rewrite tất cả tham chiếu `public.` → `backup.` trong file
 *   4. DROP SCHEMA backup CASCADE + CREATE SCHEMA backup (local)
 *   5. psql -f file đã rewrite vào local DB
 *   6. Cleanup + log số bảng + rows
 *
 * An toàn:
 *   - CHỈ ĐỌC từ Supabase (pg_dump)
 *   - GHI vào local, schema `backup` (không đụng schema `public` đang dùng)
 *
 * Chạy: npm run db:backup
 */

import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { config as loadEnv } from "dotenv"

loadEnv({ path: path.resolve(process.cwd(), ".env.local") })

// ── Config ───────────────────────────────────────────────────────────────

if (!process.env.SUPABASE_DIRECT_URL) {
  console.error("❌ Thiếu SUPABASE_DIRECT_URL trong .env.local")
  process.exit(1)
}
if (!process.env.DIRECT_URL) {
  console.error("❌ Thiếu DIRECT_URL (local DB) trong .env.local")
  process.exit(1)
}
const SUPABASE_URL: string = process.env.SUPABASE_DIRECT_URL
const LOCAL_URL: string = process.env.DIRECT_URL

// ── Auto-detect pg_dump + psql ───────────────────────────────────────────

function findPgBinary(name: "pg_dump" | "psql"): string {
  // Cho phép override qua env
  const envOverride = process.env[name === "pg_dump" ? "PG_DUMP_PATH" : "PSQL_PATH"]
  if (envOverride && existsSync(envOverride)) return envOverride

  const exeName = process.platform === "win32" ? `${name}.exe` : name

  // Windows: quét C:\Program Files\PostgreSQL\{major}\bin
  if (process.platform === "win32") {
    const root = "C:\\Program Files\\PostgreSQL"
    if (existsSync(root)) {
      const versions = readdirSync(root)
        .filter((v) => /^\d+$/.test(v))
        .sort((a, b) => Number(b) - Number(a)) // version mới nhất trước
      for (const v of versions) {
        const p = path.join(root, v, "bin", exeName)
        if (existsSync(p)) return p
      }
    }
  }

  // Fallback: để OS tự resolve qua PATH
  return exeName
}

const PG_DUMP = findPgBinary("pg_dump")
const PSQL = findPgBinary("psql")

console.log(`🔧 pg_dump: ${PG_DUMP}`)
console.log(`🔧 psql:    ${PSQL}`)

// ── Helpers ──────────────────────────────────────────────────────────────

function run(
  cmd: string,
  args: string[],
  opts: { input?: string; capture?: boolean; env?: Record<string, string> } = {},
): string {
  const res = spawnSync(cmd, args, {
    input: opts.input,
    encoding: "utf8",
    env: { ...process.env, ...(opts.env ?? {}) },
    // Windows: shell=false để tránh quote hell; args đã mảng hoá
    shell: false,
    stdio: opts.capture || opts.input !== undefined
      ? ["pipe", "pipe", "pipe"]
      : ["ignore", "inherit", "inherit"],
    maxBuffer: 1024 * 1024 * 512, // 512MB — tăng buffer cho DB lớn
  })
  if (res.status !== 0) {
    if (opts.capture) console.error(res.stderr)
    throw new Error(`${path.basename(cmd)} exit code ${res.status}`)
  }
  return res.stdout?.toString() ?? ""
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now()

  // Step 1: pg_dump Supabase → file tạm
  const tmp = mkdtempSync(path.join(tmpdir(), "supabase-backup-"))
  const rawDump = path.join(tmp, "supabase-public.sql")
  const rewritten = path.join(tmp, "backup-schema.sql")

  console.log(`📥 Đang dump public từ Supabase...`)
  run(PG_DUMP, [
    SUPABASE_URL,
    "--schema=public",
    "--no-owner",
    "--no-acl",
    "--no-subscriptions",
    "--no-publications",
    "-f",
    rawDump,
  ])
  const dumpSize = readFileSync(rawDump).length
  console.log(`   ✓ Dump xong — ${(dumpSize / 1024 / 1024).toFixed(2)} MB`)

  // Step 2: rewrite public → backup
  console.log(`🔄 Rewrite public → backup...`)
  let sql = readFileSync(rawDump, "utf8")
  sql = sql
    // Xoá các dòng tạo extension / role mặc định ở schema public mà local đã có
    .replace(/CREATE SCHEMA public;?\s*\n/g, "")
    .replace(/COMMENT ON SCHEMA public[^;]*;\s*\n/g, "")
    // Đổi search_path
    .replace(/SET search_path = public\b/g, "SET search_path = backup")
    // Đổi mọi tham chiếu schema.table (có boundary để tránh substring trong string literal)
    .replace(/\bpublic\./g, "backup.")
    // Các ALTER/SCHEMA tĩnh
    .replace(/\bSCHEMA public\b/g, "SCHEMA backup")
  writeFileSync(rewritten, sql, "utf8")
  console.log(`   ✓ Rewrite xong`)

  // Step 3: drop + create backup schema (local)
  console.log(`🗑️  DROP SCHEMA backup CASCADE + CREATE SCHEMA backup (local)...`)
  run(
    PSQL,
    [
      LOCAL_URL,
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      "DROP SCHEMA IF EXISTS backup CASCADE; CREATE SCHEMA backup;",
    ],
  )
  console.log(`   ✓ Schema sạch`)

  // Step 4: apply dump đã rewrite
  console.log(`📤 Restore vào local...`)
  run(PSQL, [LOCAL_URL, "-v", "ON_ERROR_STOP=1", "-f", rewritten])
  console.log(`   ✓ Restore xong`)

  // Step 5: stats
  const tableCountRaw = run(
    PSQL,
    [
      LOCAL_URL,
      "-At", // -A: unaligned, -t: tuples-only
      "-c",
      "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'backup';",
    ],
    { capture: true },
  ).trim()

  const rowSampleRaw = run(
    PSQL,
    [
      LOCAL_URL,
      "-At",
      "-F",
      "|",
      "-c",
      `SELECT table_name, (
         SELECT n_live_tup FROM pg_stat_user_tables s
         WHERE s.schemaname='backup' AND s.relname=t.table_name
       )
       FROM information_schema.tables t
       WHERE table_schema='backup'
       ORDER BY table_name;`,
    ],
    { capture: true },
  )

  // Cleanup temp
  rmSync(tmp, { recursive: true, force: true })

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`\n✅ Hoàn tất sau ${elapsed}s`)
  console.log(`   Schema: backup (local)`)
  console.log(`   Tổng số bảng: ${tableCountRaw}`)
  console.log(`   Chi tiết (bảng | ~rows):`)
  rowSampleRaw
    .split("\n")
    .filter((l) => l.includes("|"))
    .forEach((l) => console.log(`     ${l}`))
  console.log(
    `\n💡 Truy vấn: psql <LOCAL_URL> -c "SELECT * FROM backup.users LIMIT 5;"`,
  )
}

main().catch((err) => {
  console.error("\n❌ Backup thất bại:", err.message)
  process.exit(1)
})
