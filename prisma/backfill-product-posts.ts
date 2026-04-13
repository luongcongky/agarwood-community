// ============================================================
// Backfill Post cho mỗi Product chưa có postId.
// Mục đích: sau khi gộp Feed + Marketplace, mọi product cũ phải
// xuất hiện trên feed dưới dạng Post(category=PRODUCT, productId=…).
//
// Chạy local:    npx tsx prisma/backfill-product-posts.ts
// Chạy Supabase: MIGRATE_TARGET=supabase npx tsx prisma/backfill-product-posts.ts
// ============================================================

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

async function main() {
  const target = process.env.MIGRATE_TARGET === "supabase" ? "Supabase" : "local"
  console.log(`🔁 Backfill Product → Post (${target})`)

  const orphanProducts = await prisma.product.findMany({
    where: { postId: null },
    select: {
      id: true,
      ownerId: true,
      name: true,
      description: true,
      imageUrls: true,
      ownerPriority: true,
      createdAt: true,
      owner: { select: { role: true, accountType: true } },
    },
  })

  if (orphanProducts.length === 0) {
    console.log("✅ Không có product nào cần backfill.")
    return
  }
  console.log(`   Tìm thấy ${orphanProducts.length} product chưa có Post liên kết`)

  let created = 0
  for (const p of orphanProducts) {
    const isPremium = p.owner.role === "VIP"
    const content =
      (p.description && p.description.trim().length > 0
        ? p.description
        : `Sản phẩm: ${p.name}`
      ).slice(0, 10_000)

    await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId: p.ownerId,
          title: p.name,
          content,
          imageUrls: p.imageUrls,
          category: "PRODUCT",
          status: "PUBLISHED",
          isPremium,
          authorPriority: p.ownerPriority,
          createdAt: p.createdAt, // giữ thứ tự timeline
        },
        select: { id: true },
      })
      await tx.product.update({
        where: { id: p.id },
        data: { postId: post.id },
      })
    })
    created++
  }

  console.log(`✅ Đã tạo ${created} Post cho product cũ`)
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
