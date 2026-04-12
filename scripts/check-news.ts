import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const all = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, category: true, isPublished: true, createdAt: true }
  })

  console.log(`\n=== NEWS TABLE SUMMARY ===`)
  console.log(`Total records: ${all.length}`)

  const byCategory: Record<string, number> = {}
  const byPublished: Record<string, number> = {}
  for (const n of all) {
    byCategory[n.category] = (byCategory[n.category] || 0) + 1
    if (n.isPublished) byPublished[n.category] = (byPublished[n.category] || 0) + 1
  }
  console.log(`By category (all):`, byCategory)
  console.log(`By category (isPublished=true only):`, byPublished)

  console.log(`\nAll records:`)
  for (const n of all) {
    console.log(`  [${n.category.padEnd(8)}] ${n.isPublished ? "✅ PUB  " : "⬜ DRAFT"}  ${n.title.substring(0, 70)}`)
  }

  await prisma.$disconnect()
  await pool.end()
}

main().catch(console.error)
