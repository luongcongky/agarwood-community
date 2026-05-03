/**
 * Auto-link Leader orphan rows (userId=null) với User.name match.
 *
 * Match rules:
 *  - Chuẩn hóa name: bỏ academic prefix (ThS., TS., PGS., GS., BS., CN.)
 *    + trim + lowercase + NFC.
 *  - Nếu có DUY NHẤT 1 User match → set Leader.userId.
 *  - 0 hoặc >1 match → skip + in ra để admin tự xử lý.
 *
 * Idempotent: chạy lại chỉ xử lý Leader userId=null còn lại.
 *
 * Usage:
 *   npx tsx scripts/autolink-leaders-to-users.ts             # dry-run
 *   npx tsx scripts/autolink-leaders-to-users.ts --execute
 *   npx tsx scripts/autolink-leaders-to-users.ts --supabase --execute
 */

import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

function loadEnv() {
  const p = path.resolve(process.cwd(), ".env.local")
  if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf-8").split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const eq = t.indexOf("=")
    if (eq < 0) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!(k in process.env)) process.env[k] = v.replace(/\\n/g, "\n")
  }
}
loadEnv()

const EXECUTE = process.argv.includes("--execute")
const USE_SUPABASE = process.argv.includes("--supabase")
const connectionString = USE_SUPABASE ? process.env.SUPABASE_DIRECT_URL : process.env.DIRECT_URL
if (!connectionString) {
  console.error("❌ Thiếu connection string trong .env.local")
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: USE_SUPABASE ? { rejectUnauthorized: false } : undefined,
})
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const ACADEMIC_PREFIX_RE = /^(?:ThS|TS|PGS|GS|BS|CN|KS|ThS\.|TS\.|PGS\.|GS\.|BS\.|CN\.|KS\.)\s+/i

function normalizeName(name: string): string {
  return name
    .normalize("NFC")
    .replace(ACADEMIC_PREFIX_RE, "")
    .trim()
    .toLowerCase()
}

async function main() {
  console.log("═".repeat(60))
  console.log("AUTO-LINK — Leader.userId từ User.name match")
  console.log(`DB:   ${USE_SUPABASE ? "🔴 SUPABASE" : "🟢 LOCAL"}`)
  console.log(`Mode: ${EXECUTE ? "🔴 EXECUTE" : "🟢 DRY-RUN"}`)
  console.log("═".repeat(60))

  const orphans = await prisma.leader.findMany({
    where: { userId: null, isActive: true },
    select: { id: true, name: true, title: true, category: true },
  })
  console.log(`\n📋 Leader orphans (userId=null, isActive=true): ${orphans.length}`)

  if (orphans.length === 0) {
    console.log("✅ Không có gì cần link.")
    return
  }

  // Fetch all users 1 lần — match in-memory nhanh hơn 1 query per leader
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  })

  // Index users theo normalized name — 1 name có thể có nhiều user (trùng tên)
  const usersByNormName = new Map<string, typeof users>()
  for (const u of users) {
    const key = normalizeName(u.name)
    if (!key) continue
    const bucket = usersByNormName.get(key) ?? []
    bucket.push(u)
    usersByNormName.set(key, bucket)
  }

  type LinkPlan = {
    leaderId: string
    leaderName: string
    leaderTitle: string
    leaderCategory: string
    userId: string
    userName: string
    userEmail: string
  }
  const toLink: LinkPlan[] = []
  const ambiguous: Array<{ leader: (typeof orphans)[number]; candidates: typeof users }> = []
  const unmatched: (typeof orphans)[number][] = []

  for (const l of orphans) {
    const key = normalizeName(l.name)
    const matches = usersByNormName.get(key) ?? []
    if (matches.length === 1) {
      toLink.push({
        leaderId: l.id,
        leaderName: l.name,
        leaderTitle: l.title,
        leaderCategory: l.category,
        userId: matches[0].id,
        userName: matches[0].name,
        userEmail: matches[0].email,
      })
    } else if (matches.length > 1) {
      ambiguous.push({ leader: l, candidates: matches })
    } else {
      unmatched.push(l)
    }
  }

  console.log(`\n✅ Match 1-1 (sẽ link):     ${toLink.length}`)
  console.log(`⚠️  Ambiguous (≥2 match):    ${ambiguous.length}`)
  console.log(`❌ Không match user nào:    ${unmatched.length}`)

  if (toLink.length > 0) {
    console.log("\n🔗 Planned links:")
    for (const p of toLink) {
      console.log(`  - Leader "${p.leaderName}" (${p.leaderCategory}) → User "${p.userName}" <${p.userEmail}>`)
    }
  }
  if (ambiguous.length > 0) {
    console.log("\n⚠️  Ambiguous (admin cần tự chọn):")
    for (const a of ambiguous) {
      console.log(`  - Leader "${a.leader.name}" → ${a.candidates.length} users:`)
      for (const c of a.candidates) {
        console.log(`      • ${c.name} <${c.email}> id=${c.id}`)
      }
    }
  }
  if (unmatched.length > 0) {
    console.log("\n❌ Unmatched (có thể là external leader / name sai chính tả):")
    for (const l of unmatched) {
      console.log(`  - "${l.name}" (${l.category})`)
    }
  }

  if (!EXECUTE) {
    console.log("\n⚠️  DRY-RUN — chạy với --execute để thực sự link.")
    return
  }
  if (toLink.length === 0) {
    console.log("✅ Không có link mới để apply.")
    return
  }

  console.log("\n🔴 Updating...")
  let success = 0
  for (const p of toLink) {
    try {
      await prisma.leader.update({
        where: { id: p.leaderId },
        data: { userId: p.userId },
      })
      success++
    } catch (e) {
      console.error(`  ❌ Failed ${p.leaderName}:`, e instanceof Error ? e.message : e)
    }
  }
  console.log(`✅ Đã link ${success}/${toLink.length} Leader rows.`)
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect()
  await pool.end()
})
