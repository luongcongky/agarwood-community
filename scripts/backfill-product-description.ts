/**
 * Bug fix (2026-04-29): SP cũ tạo qua /feed/tao-bai trước fix htmlToPlainText
 * có Product.description là plain text 1 dòng (mất paragraph breaks). Hoặc
 * SP đã được save 1 lần qua ProductForm khiến plain text bị wrap trong 1 <p>
 * (kỹ thuật là HTML nhưng cấu trúc paragraph vẫn mất).
 *
 * Script này:
 *   - DRY-RUN mặc định: list ra SP ảnh hưởng, KHÔNG ghi DB.
 *   - --execute: copy Post.content → Product.description.
 *   - --target=supabase: chạy trên SUPABASE_DIRECT_URL thay vì DATABASE_URL.
 *
 * Run:
 *   npx tsx scripts/backfill-product-description.ts                    # dry run local
 *   npx tsx scripts/backfill-product-description.ts --execute          # exec local
 *   npx tsx scripts/backfill-product-description.ts --target=supabase  # dry run prod
 *   npx tsx scripts/backfill-product-description.ts --target=supabase --execute
 */
import path from "node:path"
import { config as loadEnv } from "dotenv"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

loadEnv({ path: path.resolve(process.cwd(), ".env.local") })

const HTML_TAG_REGEX = /<\w+[\s>]/

/** Số block-level tag mà render thành paragraph riêng. <p>, <li>, <h1-6>,
 *  <figure>, <ul>, <ol>, <blockquote>. */
function countBlockTags(html: string): number {
  return (html.match(/<(p|li|h[1-6]|figure|ul|ol|blockquote)\b/gi) ?? []).length
}

function buildClient(target: "local" | "supabase") {
  const url =
    target === "supabase"
      ? process.env.SUPABASE_DIRECT_URL
      : process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      `Missing connection URL for target=${target}. Cần ${
        target === "supabase" ? "SUPABASE_DIRECT_URL" : "DATABASE_URL"
      } trong .env.local`,
    )
  }
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1")
  const pool = new Pool({
    connectionString: url,
    max: 5,
    ssl: target === "supabase" || !isLocal ? { rejectUnauthorized: false } : undefined,
  })
  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

async function main() {
  const target: "local" | "supabase" = process.argv.includes("--target=supabase")
    ? "supabase"
    : "local"
  const prisma = buildClient(target)
  console.log(`🎯 Target: ${target.toUpperCase()}`)

  const dryRun = !process.argv.includes("--execute")

  const candidates = await prisma.product.findMany({
    where: { postId: { not: null } },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      post: { select: { content: true } },
    },
  })

  /**
   * Cần backfill nếu (có post.content) AND một trong các điều kiện:
   *   1. description null / không có HTML tag (legacy plain text)
   *   2. description "wrapped plain": có HTML nhưng ít block tag hơn post
   *      (case: ProductForm đã save plain text → wrap 1 <p> bao tất cả)
   */
  const targets = candidates.filter((p) => {
    if (!p.post?.content) return false
    const desc = p.description ?? ""
    if (!desc.trim()) return true
    if (!HTML_TAG_REGEX.test(desc)) return true
    const descBlocks = countBlockTags(desc)
    const postBlocks = countBlockTags(p.post.content)
    return postBlocks > descBlocks + 1 // chênh lệch >1 mới coi là loss
  })

  console.log(`SP có postId: ${candidates.length}`)
  console.log(`SP cần backfill: ${targets.length}`)
  if (targets.length === 0) {
    console.log("Không có gì để backfill.")
    await prisma.$disconnect()
    return
  }

  console.log("\nDanh sách 10 SP đầu tiên:")
  for (const t of targets.slice(0, 10)) {
    const preview = (t.description ?? "(null)").slice(0, 60).replace(/\s+/g, " ")
    console.log(`  - ${t.slug} | ${preview}${(t.description?.length ?? 0) > 60 ? "..." : ""}`)
  }

  if (dryRun) {
    console.log("\n💡 Dry run — chưa ghi DB. Chạy với --execute để backfill thật.")
    await prisma.$disconnect()
    return
  }

  console.log("\n⚙️  Đang backfill...")
  let updated = 0
  for (const t of targets) {
    if (!t.post?.content) continue
    await prisma.product.update({
      where: { id: t.id },
      data: { description: t.post.content },
    })
    updated++
  }
  console.log(`✅ Đã update ${updated} SP.`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
