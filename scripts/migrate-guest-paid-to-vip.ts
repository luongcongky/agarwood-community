/**
 * One-time migration: user role=GUEST đã đóng phí (contributionTotal > 0
 * hoặc membershipExpires còn trong tương lai) được upgrade → VIP.
 *
 * Vấn đề gốc: flow /api/admin/payments/[id]/confirm cũ chỉ update
 * membershipExpires + contributionTotal + displayPriority, không upgrade role.
 * Sau khi vá (cùng commit này), payment mới tự upgrade; nhưng user cũ đã
 * đóng phí và stuck ở GUEST cần migration này.
 *
 * Cách chạy:
 *   - Local:    npx tsx scripts/migrate-guest-paid-to-vip.ts
 *   - Supabase: $env:MIGRATE_TARGET='supabase'; npx tsx scripts/migrate-guest-paid-to-vip.ts
 *
 * Dry-run trước để xem ảnh hưởng:
 *   npx tsx scripts/migrate-guest-paid-to-vip.ts --dry-run
 */

import { config } from "dotenv"
config({ path: ".env.local" })

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const isSupabase = process.env.MIGRATE_TARGET === "supabase"
  const target = isSupabase ? "Supabase" : "Local"

  // Chọn connection URL theo MIGRATE_TARGET — khớp cơ chế của prisma.config.ts.
  // Supabase dùng SUPABASE_DIRECT_URL (port 5432, không qua pooler).
  const url = isSupabase
    ? process.env.SUPABASE_DIRECT_URL
    : process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      isSupabase
        ? "SUPABASE_DIRECT_URL chưa set trong .env.local"
        : "DATABASE_URL chưa set trong .env.local",
    )
  }

  const { PrismaClient } = await import("@prisma/client")
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { Pool } = await import("pg")
  const pool = new Pool({
    connectionString: url,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

  const now = new Date()
  const candidates = await prisma.user.findMany({
    where: {
      role: "GUEST",
      isActive: true,
      OR: [
        { membershipExpires: { gt: now } },
        { contributionTotal: { gt: 0 } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      contributionTotal: true,
      membershipExpires: true,
    },
    orderBy: { createdAt: "asc" },
  })

  console.log(`\n📋 Target: ${target}`)
  console.log(`   Tổng số user sẽ upgrade GUEST → VIP: ${candidates.length}\n`)

  if (candidates.length === 0) {
    console.log("   Không có user nào thỏa điều kiện. Không cần migration.")
    await prisma.$disconnect()
    return
  }

  for (const u of candidates) {
    const exp = u.membershipExpires
      ? u.membershipExpires.toISOString().slice(0, 10)
      : "(null)"
    console.log(
      `   - ${u.email.padEnd(40)} | ${u.name.padEnd(30)} | contrib=${u.contributionTotal.toLocaleString("vi-VN")}đ | expires=${exp}`,
    )
  }

  if (dryRun) {
    console.log("\n⚠️  Dry-run — không update. Bỏ --dry-run để thực thi.\n")
    await prisma.$disconnect()
    return
  }

  console.log("\n⏳ Đang update role GUEST → VIP...")
  const result = await prisma.user.updateMany({
    where: { id: { in: candidates.map((c) => c.id) } },
    data: { role: "VIP" },
  })
  console.log(`✅ Updated ${result.count} user.\n`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
