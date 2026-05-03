/**
 * Restore schema `backup` → `public` trên local DB.
 *
 * ⚠️ CẢNH BÁO: Thao tác phá huỷ — sẽ DROP SCHEMA public CASCADE rồi copy toàn bộ
 * cấu trúc + data từ schema `backup` sang. Dùng để reset môi trường local về đúng
 * snapshot của Supabase (đã chạy `npm run db:backup` trước đó).
 *
 * Flow:
 *   1. Yêu cầu xác nhận (gõ "RESTORE") — bỏ qua bằng flag `--force` hoặc env FORCE=1
 *   2. DROP SCHEMA public CASCADE + CREATE SCHEMA public (local)
 *   3. pg_dump local `backup` schema → file tạm
 *   4. Rewrite `backup.` → `public.`
 *   5. psql -f file đã rewrite vào local
 *   6. Stats
 *
 * An toàn:
 *   - CHỈ đụng local DB — KHÔNG đụng Supabase
 *   - Cần chạy `npm run db:backup` trước để có schema `backup` mới nhất
 *
 * Chạy: npm run db:restore-public  (hoặc thêm --force để bỏ prompt)
 */

import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createInterface } from "node:readline/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { config as loadEnv } from "dotenv"

loadEnv({ path: path.resolve(process.cwd(), ".env.local") })

const LOCAL_URL = process.env.DIRECT_URL
if (!LOCAL_URL) {
  console.error("❌ Thiếu DIRECT_URL (local DB) trong .env.local")
  process.exit(1)
}

const FORCE = process.argv.includes("--force") || process.env.FORCE === "1"

// ── Auto-detect pg_dump + psql ───────────────────────────────────────────

function findPgBinary(name: "pg_dump" | "psql"): string {
  const envOverride = process.env[name === "pg_dump" ? "PG_DUMP_PATH" : "PSQL_PATH"]
  if (envOverride && existsSync(envOverride)) return envOverride

  const exeName = process.platform === "win32" ? `${name}.exe` : name

  if (process.platform === "win32") {
    const root = "C:\\Program Files\\PostgreSQL"
    if (existsSync(root)) {
      const versions = readdirSync(root)
        .filter((v) => /^\d+$/.test(v))
        .sort((a, b) => Number(b) - Number(a))
      for (const v of versions) {
        const p = path.join(root, v, "bin", exeName)
        if (existsSync(p)) return p
      }
    }
  }
  return exeName
}

const PG_DUMP = findPgBinary("pg_dump")
const PSQL = findPgBinary("psql")

function run(
  cmd: string,
  args: string[],
  opts: { capture?: boolean } = {},
): string {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: false,
    stdio: opts.capture ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"],
    maxBuffer: 1024 * 1024 * 512,
  })
  if (res.status !== 0) {
    if (opts.capture) console.error(res.stderr)
    throw new Error(`${path.basename(cmd)} exit code ${res.status}`)
  }
  return res.stdout?.toString() ?? ""
}

// ── Pre-flight checks ────────────────────────────────────────────────────

async function main() {
  // Verify schema `backup` tồn tại + có bảng
  const countRaw = run(
    PSQL,
    [
      LOCAL_URL!,
      "-At",
      "-c",
      "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'backup';",
    ],
    { capture: true },
  ).trim()

  const backupTableCount = Number(countRaw)
  if (!Number.isFinite(backupTableCount) || backupTableCount === 0) {
    console.error(
      "❌ Schema `backup` trống hoặc không tồn tại trên local. Hãy chạy `npm run db:backup` trước.",
    )
    process.exit(1)
  }
  console.log(`📦 Schema 'backup' hiện có ${backupTableCount} bảng`)

  // Confirm
  if (!FORCE) {
    console.log(
      "\n⚠️  Thao tác này sẽ XOÁ TOÀN BỘ schema 'public' hiện tại trên local (bao gồm data dev của bạn).",
    )
    console.log(`   Schema đích: ${LOCAL_URL}`)
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question('   Gõ "RESTORE" để xác nhận: ')
    rl.close()
    if (answer.trim() !== "RESTORE") {
      console.log("❎ Đã huỷ.")
      process.exit(0)
    }
  }

  const t0 = Date.now()

  // Step 1: dump schema backup local
  const tmp = mkdtempSync(path.join(tmpdir(), "restore-public-"))
  const rawDump = path.join(tmp, "backup-schema.sql")
  const rewritten = path.join(tmp, "public-schema.sql")

  console.log(`📥 Dumping local schema 'backup'...`)
  run(PG_DUMP, [
    LOCAL_URL!,
    "--schema=backup",
    "--no-owner",
    "--no-acl",
    "-f",
    rawDump,
  ])
  console.log(`   ✓ Dump xong — ${(readFileSync(rawDump).length / 1024 / 1024).toFixed(2)} MB`)

  // Step 2: rewrite backup → public
  console.log(`🔄 Rewrite backup → public...`)
  let sql = readFileSync(rawDump, "utf8")
  sql = sql
    .replace(/CREATE SCHEMA backup;?\s*\n/g, "")
    .replace(/COMMENT ON SCHEMA backup[^;]*;\s*\n/g, "")
    .replace(/SET search_path = backup\b/g, "SET search_path = public")
    .replace(/\bbackup\./g, "public.")
    .replace(/\bSCHEMA backup\b/g, "SCHEMA public")
  writeFileSync(rewritten, sql, "utf8")
  console.log(`   ✓ Rewrite xong`)

  // Step 3: DROP + CREATE public
  console.log(`🗑️  DROP SCHEMA public CASCADE + CREATE SCHEMA public...`)
  run(PSQL, [
    LOCAL_URL!,
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO PUBLIC;",
  ])

  // Step 4: apply
  console.log(`📤 Restore vào public...`)
  run(PSQL, [LOCAL_URL!, "-v", "ON_ERROR_STOP=1", "-f", rewritten])

  rmSync(tmp, { recursive: true, force: true })

  // Stats
  const tableCount = run(
    PSQL,
    [
      LOCAL_URL!,
      "-At",
      "-c",
      "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';",
    ],
    { capture: true },
  ).trim()

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`\n✅ Hoàn tất sau ${elapsed}s`)
  console.log(`   Schema 'public' local: ${tableCount} bảng`)
  console.log(`\n💡 Gợi ý: chạy \`npm run db:generate\` nếu Prisma client bị lệch schema.`)
}

main().catch((err) => {
  console.error("\n❌ Restore thất bại:", err.message)
  process.exit(1)
})
