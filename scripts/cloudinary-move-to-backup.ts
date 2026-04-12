/**
 * Di chuyển ảnh cũ trên Cloudinary vào backup/2026/
 *
 * Ảnh cũ (prefix cũ):
 *   - agarwood-community/news/*
 *   - agarwood-community/research/*
 *   - agarwood-community/members/*
 *   - agarwood/posts/*
 *
 * → Di chuyển sang: backup/2026/{original-path}
 *
 * Usage:
 *   npx tsx scripts/cloudinary-move-to-backup.ts           # dry-run (chỉ liệt kê)
 *   npx tsx scripts/cloudinary-move-to-backup.ts --execute  # thực hiện di chuyển
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
const OLD_PREFIXES = [
  "agarwood-community/",
  "agarwood/",
]
const BACKUP_PREFIX = "backup/2026"

async function getAllImages(): Promise<{ public_id: string }[]> {
  const all: { public_id: string }[] = []
  let cursor: string | undefined

  do {
    const search = cloudinary.search
      .expression("resource_type:image")
      .sort_by("public_id", "asc")
      .max_results(500)
      .fields(["public_id"])

    if (cursor) search.next_cursor(cursor)
    const result = await search.execute()
    all.push(...result.resources)
    cursor = result.next_cursor
  } while (cursor)

  return all
}

async function main() {
  console.log("═".repeat(60))
  console.log(`CLOUDINARY — Di chuyển ảnh cũ → ${BACKUP_PREFIX}/`)
  console.log(`Mode: ${EXECUTE ? "🔴 EXECUTE (thực hiện di chuyển)" : "🟢 DRY-RUN (chỉ liệt kê)"}`)
  console.log("═".repeat(60))

  // 1. List all images
  console.log("\n📋 Đang quét toàn bộ ảnh trên Cloudinary...")
  const allImages = await getAllImages()
  console.log(`   Tổng: ${allImages.length} ảnh\n`)

  // 2. Filter images with old prefixes
  const toMove = allImages.filter((img) =>
    OLD_PREFIXES.some((prefix) => img.public_id.startsWith(prefix))
  )

  if (toMove.length === 0) {
    console.log("✅ Không có ảnh cũ nào cần di chuyển.")
    return
  }

  // Group by prefix for display
  const groups = new Map<string, number>()
  for (const img of toMove) {
    const parts = img.public_id.split("/")
    const prefix = parts.slice(0, 2).join("/")
    groups.set(prefix, (groups.get(prefix) || 0) + 1)
  }

  console.log(`📦 Cần di chuyển ${toMove.length} ảnh:`)
  for (const [prefix, count] of [...groups.entries()].sort()) {
    console.log(`   ${prefix}: ${count}`)
  }
  console.log()

  if (!EXECUTE) {
    console.log("─".repeat(60))
    console.log("⚠️  DRY-RUN — Không thực hiện di chuyển.")
    console.log("   Chạy lại với --execute để thực hiện.")
    console.log("─".repeat(60))

    // Show sample moves
    console.log("\nVí dụ 5 ảnh đầu tiên sẽ di chuyển:")
    for (const img of toMove.slice(0, 5)) {
      const newId = `${BACKUP_PREFIX}/${img.public_id}`
      console.log(`   ${img.public_id}`)
      console.log(`   → ${newId}\n`)
    }
    return
  }

  // 3. Execute moves
  let moved = 0
  let failed = 0
  const failures: { id: string; error: string }[] = []

  for (let i = 0; i < toMove.length; i++) {
    const img = toMove[i]
    const newId = `${BACKUP_PREFIX}/${img.public_id}`

    try {
      await cloudinary.uploader.rename(img.public_id, newId, { overwrite: true })
      moved++
      if (moved % 20 === 0 || moved === toMove.length) {
        console.log(`   ✅ ${moved}/${toMove.length} di chuyển xong...`)
      }
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ id: img.public_id, error: msg })
      console.log(`   ❌ ${img.public_id}: ${msg}`)
    }
  }

  // Summary
  console.log(`\n${"═".repeat(60)}`)
  console.log("🎉 KẾT QUẢ")
  console.log("═".repeat(60))
  console.log(`✅ Di chuyển: ${moved}`)
  console.log(`❌ Lỗi:      ${failed}`)

  if (failures.length > 0) {
    console.log("\nẢnh bị lỗi:")
    for (const f of failures) {
      console.log(`  - ${f.id}: ${f.error}`)
    }
  }
  console.log("═".repeat(60))
}

main().catch((e) => {
  console.error("❌ Fatal:", e)
  process.exit(1)
})
