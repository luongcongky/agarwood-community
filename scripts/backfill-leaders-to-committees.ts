/**
 * Backfill: mọi Leader đang active + có `userId` + có `category` mappable
 * → tạo CommitteeMembership tương ứng (nếu chưa có).
 *
 * Mapping (xem `lib/committee-leader-bridge.ts`):
 *   BTV  → THUONG_VU
 *   BCH  → CHAP_HANH
 *   BKT  → KIEM_TRA
 *   HDTD → THAM_DINH
 *
 * Chạy:
 *   npx tsx scripts/backfill-leaders-to-committees.ts              # dry-run
 *   npx tsx scripts/backfill-leaders-to-committees.ts --execute    # thực hiện
 *
 * Idempotent: chạy nhiều lần an toàn, đã có row → skip.
 */

import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import type { Committee, LeaderCategory } from "@prisma/client"

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local")
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, "utf-8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    value = value.replace(/\\n/g, "\n")
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvLocal()

const EXECUTE = process.argv.includes("--execute")
const USE_SUPABASE = process.argv.includes("--supabase")
const connectionString = USE_SUPABASE
  ? process.env.SUPABASE_DIRECT_URL
  : process.env.DIRECT_URL

if (!connectionString) {
  console.error("❌ Thiếu connection string — set DIRECT_URL hoặc SUPABASE_DIRECT_URL trong .env.local")
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: USE_SUPABASE ? { rejectUnauthorized: false } : undefined,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const LEADER_TO_COMMITTEE: Record<LeaderCategory, Committee> = {
  BTV: "THUONG_VU",
  BCH: "CHAP_HANH",
  BKT: "KIEM_TRA",
  HDTD: "THAM_DINH",
}

async function main() {
  console.log("═".repeat(60))
  console.log("BACKFILL — Leader rows → CommitteeMembership")
  console.log(`DB:   ${USE_SUPABASE ? "🔴 SUPABASE" : "🟢 LOCAL"}`)
  console.log(`Mode: ${EXECUTE ? "🔴 EXECUTE" : "🟢 DRY-RUN"}`)
  console.log("═".repeat(60))

  // Lấy các Leader có userId + isActive — có gán với hội viên có tài khoản
  const leaders = await prisma.leader.findMany({
    where: { userId: { not: null }, isActive: true },
    select: {
      id: true,
      name: true,
      title: true,
      category: true,
      userId: true,
      user: { select: { name: true, role: true } },
    },
  })

  console.log(`\n📋 Leaders active có userId: ${leaders.length}`)

  // Check committee membership đã tồn tại
  const existing = await prisma.committeeMembership.findMany({
    select: { userId: true, committee: true },
  })
  const existingKeys = new Set(existing.map((e) => `${e.userId}:${e.committee}`))

  const toCreate: {
    userId: string
    committee: Committee
    position: string
    userName: string
    leaderTitle: string
  }[] = []
  let skipped = 0

  for (const l of leaders) {
    if (!l.userId) continue
    const committee = LEADER_TO_COMMITTEE[l.category]
    const key = `${l.userId}:${committee}`
    if (existingKeys.has(key)) {
      skipped++
      continue
    }
    toCreate.push({
      userId: l.userId,
      committee,
      // Dùng Leader.title làm position — "Chủ tịch", "Phó CT", "Ủy viên"…
      position: l.title,
      userName: l.user?.name ?? "—",
      leaderTitle: l.title,
    })
  }

  console.log(`✅ Đã có membership: ${skipped}`)
  console.log(`➕ Cần tạo mới:      ${toCreate.length}\n`)

  if (toCreate.length > 0) {
    console.log("Danh sách sẽ tạo:")
    for (const r of toCreate.slice(0, 20)) {
      console.log(
        `  - ${r.userName.padEnd(30)} → ${r.committee.padEnd(14)} (position="${r.leaderTitle}")`,
      )
    }
    if (toCreate.length > 20) console.log(`  … và ${toCreate.length - 20} dòng khác`)
  }

  if (!EXECUTE) {
    console.log(
      "\n⚠️  DRY-RUN — chạy lại với --execute để thực sự insert.",
    )
    return
  }
  if (toCreate.length === 0) {
    console.log("✅ Không có gì cần làm.")
    return
  }

  console.log("\n🔴 Inserting...")
  const result = await prisma.committeeMembership.createMany({
    data: toCreate.map((r) => ({
      userId: r.userId,
      committee: r.committee,
      position: r.position,
    })),
    skipDuplicates: true,
  })
  console.log(`✅ Đã tạo ${result.count} membership.`)

  // Sync flag isCouncilMember cho ai vừa được gán THAM_DINH (backward compat)
  const thamDinhUsers = toCreate
    .filter((r) => r.committee === "THAM_DINH")
    .map((r) => r.userId)
  if (thamDinhUsers.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: thamDinhUsers } },
      data: { isCouncilMember: true },
    })
    console.log(`✅ Đã sync isCouncilMember=true cho ${thamDinhUsers.length} user.`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
