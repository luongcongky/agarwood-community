/**
 * Nâng cấp contributionTotal cho User linked vào Leader:
 *  - Chủ tịch + Phó Chủ tịch → GOLD (≥ threshold gold)
 *  - Thành viên ban lãnh đạo khác → SILVER (≥ threshold silver)
 *
 * Chạy local:    npx tsx scripts/upgrade-leader-tiers.ts
 * Chạy Supabase: MIGRATE_TARGET=supabase npx tsx scripts/upgrade-leader-tiers.ts
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { config as loadEnv } from "dotenv"
import path from "node:path"

loadEnv({ path: path.resolve(process.cwd(), ".env.local") })

const connectionString =
  process.env.MIGRATE_TARGET === "supabase"
    ? process.env.SUPABASE_DIRECT_URL
    : process.env.DATABASE_URL

if (!connectionString) throw new Error("Missing DATABASE_URL / SUPABASE_DIRECT_URL")

const pool = new Pool({ connectionString })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// Ngưỡng an toàn (vượt mức để đảm bảo tier đúng kể cả khi admin điều chỉnh threshold)
const TARGET = {
  BUSINESS: {
    gold: 25_000_000, // threshold gold 20M
    silver: 12_000_000, // threshold silver 10M
  },
  INDIVIDUAL: {
    gold: 6_000_000, // threshold gold 5M
    silver: 3_500_000, // threshold silver 3M
  },
} as const

function rankFromTitle(title: string): "gold" | "silver" {
  const t = title.toLowerCase()
  if (/^chủ tịch\b/.test(t) || /phó chủ tịch/.test(t)) return "gold"
  return "silver"
}

async function main() {
  const target = process.env.MIGRATE_TARGET === "supabase" ? "Supabase" : "local"
  console.log(`🏅 Upgrade tier cho ban lãnh đạo (${target})`)

  // Lấy tất cả leader đang active, có liên kết User
  const leaders = await prisma.leader.findMany({
    where: {
      isActive: true,
      userId: { not: null },
    },
    select: {
      id: true,
      name: true,
      title: true,
      userId: true,
      user: {
        select: {
          id: true,
          accountType: true,
          contributionTotal: true,
        },
      },
    },
  })

  console.log(`   Tìm thấy ${leaders.length} leader có linked User\n`)

  if (leaders.length === 0) {
    console.log("   ⚠ Không leader nào có userId — cần link leader với User trước")
    console.log("   (qua /admin/ban-lanh-dao hoặc seed-leaders script)")
    return
  }

  let goldCount = 0
  let silverCount = 0
  let skipped = 0

  for (const l of leaders) {
    if (!l.user) {
      skipped++
      continue
    }
    const rank = rankFromTitle(l.title)
    const accountType = l.user.accountType as "BUSINESS" | "INDIVIDUAL"
    const targetValue = TARGET[accountType][rank]

    // Chỉ update nếu đang thấp hơn — không hạ bậc user đã cao hơn target
    if (l.user.contributionTotal >= targetValue) {
      console.log(
        `   ⏭  ${l.name.padEnd(30)} | ${l.title.padEnd(20)} | ${rank.toUpperCase()} — đã đủ (${l.user.contributionTotal.toLocaleString("vi-VN")})`,
      )
      skipped++
      continue
    }

    await prisma.user.update({
      where: { id: l.user.id },
      data: { contributionTotal: targetValue, displayPriority: rank === "gold" ? 30 : 20 },
    })

    if (rank === "gold") goldCount++
    else silverCount++

    console.log(
      `   ✓ ${l.name.padEnd(30)} | ${l.title.padEnd(20)} | ${rank.toUpperCase()} · ${targetValue.toLocaleString("vi-VN")}đ`,
    )
  }

  console.log(`\n🎉 Hoàn tất:`)
  console.log(`   Gold (Chủ tịch/Phó CT):  ${goldCount}`)
  console.log(`   Silver (thành viên khác): ${silverCount}`)
  console.log(`   Đã đủ tier / skip:        ${skipped}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
