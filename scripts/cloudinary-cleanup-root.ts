/**
 * Xóa toàn bộ ảnh cũ trên Cloudinary có prefix cũ (virtual path, không folder thật)
 *
 * Targets:
 *   - tin-tuc/*          (crawl lần trước - virtual path)
 *   - nghien-cuu/*       (crawl lần trước - virtual path)
 *   - backup/2026/*      (ảnh đã backup)
 *   - agarwood-community/* (nếu còn sót)
 *   - agarwood/*         (nếu còn sót)
 *
 * Usage:
 *   npx tsx scripts/cloudinary-cleanup-root.ts             # dry-run
 *   npx tsx scripts/cloudinary-cleanup-root.ts --execute   # thực hiện xóa
 */

import { readFileSync, existsSync } from "fs"

function loadEnvLocal(): void {
  if (!existsSync(".env.local")) return
  const content = readFileSync(".env.local", "utf-8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    value = value.replace(/\\n/g, "\n")
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvLocal()

/* eslint-disable @typescript-eslint/no-require-imports */
const cloudinary = require("cloudinary").v2 as typeof import("cloudinary").v2
/* eslint-enable @typescript-eslint/no-require-imports */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

const EXECUTE = process.argv.includes("--execute")
const DELETE_PREFIXES = [
  "tin-tuc/",
  "nghien-cuu/",
  "backup/",
  "agarwood-community/",
  "agarwood/",
]

async function main() {
  console.log("═".repeat(60))
  console.log("CLOUDINARY — Xóa ảnh cũ (virtual path)")
  console.log(`Mode: ${EXECUTE ? "🔴 EXECUTE" : "🟢 DRY-RUN"}`)
  console.log("═".repeat(60))

  // Collect all images
  const all: { public_id: string }[] = []
  let cursor: string | undefined
  do {
    const search = cloudinary.search
      .expression("resource_type:image")
      .sort_by("public_id", "asc")
      .max_results(500)
      .fields(["public_id"])
    if (cursor) search.next_cursor(cursor)
    const r = await search.execute()
    all.push(...r.resources)
    cursor = r.next_cursor
  } while (cursor)

  const toDelete = all.filter((img) =>
    DELETE_PREFIXES.some((p) => img.public_id.startsWith(p))
  )

  // Group
  const groups = new Map<string, number>()
  for (const img of toDelete) {
    const parts = img.public_id.split("/")
    const prefix = parts.slice(0, 2).join("/")
    groups.set(prefix, (groups.get(prefix) || 0) + 1)
  }

  console.log(`\nTổng ảnh: ${all.length}`)
  console.log(`Cần xóa: ${toDelete.length}\n`)
  for (const [k, v] of [...groups.entries()].sort()) {
    console.log(`  ${k}: ${v}`)
  }

  if (!EXECUTE) {
    console.log("\n⚠️  DRY-RUN. Chạy --execute để xóa.")
    return
  }

  // Delete in batches of 100
  let deleted = 0
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100).map((img) => img.public_id)
    try {
      await cloudinary.api.delete_resources(batch)
      deleted += batch.length
      console.log(`  ✅ Đã xóa ${deleted}/${toDelete.length}`)
    } catch (err) {
      console.log(`  ❌ Batch error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`\n✅ Xong — đã xóa ${deleted} ảnh`)
}

main().catch((e) => { console.error("❌", e); process.exit(1) })
