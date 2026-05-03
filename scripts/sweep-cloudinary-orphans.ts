/**
 * Sweep orphan Cloudinary asset — hướng B trong phân tích orphan cleanup.
 *
 * Scan 1 folder trên Cloudinary (mặc định `tin-tuc`), đối chiếu mọi public_id
 * với những gì DB đang tham chiếu (news.coverImageUrl + content 4-locale).
 * Asset nào không còn được tham chiếu → xoá.
 *
 * Usage:
 *   npx tsx scripts/sweep-cloudinary-orphans.ts                  # dry-run
 *   npx tsx scripts/sweep-cloudinary-orphans.ts --execute        # thực sự xoá
 *   npx tsx scripts/sweep-cloudinary-orphans.ts --folder multimedia --execute
 *
 * Safety:
 *   - Default dry-run: in ra danh sách, không xoá.
 *   - Chỉ scan 1 folder prefix — không đụng avatar/, companies/, banners/…
 *   - Min-age filter 1h (config qua SWEEP_MIN_AGE_HOURS env): asset mới
 *     upload < 1h được bỏ qua để tránh race với editor đang soạn bài
 *     (user vừa upload ảnh nhưng chưa nhấn Save).
 *   - Batch delete 100/call (giới hạn `api.delete_resources`).
 */

import { readFileSync, existsSync } from "node:fs"
import { collectNewsCloudinaryIds } from "@/lib/cloudinary-url"
import { prisma } from "@/lib/prisma"

// ── Env loading (same convention as cloudinary-cleanup-root.ts) ─────────
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

/* eslint-disable @typescript-eslint/no-require-imports */
const cloudinary = require("cloudinary").v2 as typeof import("cloudinary").v2
/* eslint-enable @typescript-eslint/no-require-imports */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

// ── CLI args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const EXECUTE = args.includes("--execute")
const folderIdx = args.indexOf("--folder")
const FOLDER = folderIdx >= 0 ? (args[folderIdx + 1] ?? "tin-tuc") : "tin-tuc"
const MIN_AGE_HOURS = Number(process.env.SWEEP_MIN_AGE_HOURS ?? 1)

type CloudinaryResource = { public_id: string; created_at: string }

async function listAllAssets(folder: string): Promise<CloudinaryResource[]> {
  const assets: CloudinaryResource[] = []
  let cursor: string | undefined
  do {
    // `resources` API với type=upload + prefix scan folder cụ thể; 500 max.
    const res = (await cloudinary.api.resources({
      type: "upload",
      prefix: folder + "/",
      max_results: 500,
      ...(cursor ? { next_cursor: cursor } : {}),
    })) as {
      resources: Array<{ public_id: string; created_at: string }>
      next_cursor?: string
    }
    for (const r of res.resources ?? []) {
      assets.push({ public_id: r.public_id, created_at: r.created_at })
    }
    cursor = res.next_cursor
  } while (cursor)
  return assets
}

async function collectReferencedIds(): Promise<Set<string>> {
  const rows = await prisma.news.findMany({
    select: {
      coverImageUrl: true,
      content: true,
      content_en: true,
      content_zh: true,
      content_ar: true,
    },
  })
  const ids = new Set<string>()
  for (const row of rows) {
    for (const id of collectNewsCloudinaryIds(row)) ids.add(id)
  }
  return ids
}

async function main(): Promise<void> {
  console.log("═".repeat(60))
  console.log("CLOUDINARY SWEEP — orphan cleanup")
  console.log(`Folder:   ${FOLDER}/`)
  console.log(`Min age:  ${MIN_AGE_HOURS}h (asset mới hơn bị skip)`)
  console.log(`Mode:     ${EXECUTE ? "🔴 EXECUTE" : "🟢 DRY-RUN"}`)
  console.log("═".repeat(60))

  const [assets, referenced] = await Promise.all([
    listAllAssets(FOLDER),
    collectReferencedIds(),
  ])

  console.log(
    `\n📦 Cloudinary:  ${assets.length} asset trong folder "${FOLDER}/"`,
  )
  console.log(`🔗 DB:          ${referenced.size} public_id được tham chiếu\n`)

  const cutoff = Date.now() - MIN_AGE_HOURS * 3600 * 1000
  const orphans: CloudinaryResource[] = []
  let skippedFresh = 0
  for (const a of assets) {
    if (referenced.has(a.public_id)) continue
    if (new Date(a.created_at).getTime() > cutoff) {
      skippedFresh++
      continue
    }
    orphans.push(a)
  }

  console.log(`🗑️  Orphan:     ${orphans.length}`)
  if (skippedFresh > 0) {
    console.log(`⏳ Skip fresh:  ${skippedFresh} (asset mới < ${MIN_AGE_HOURS}h)`)
  }

  if (orphans.length === 0) {
    console.log("\n✅ Không có orphan cần dọn.")
    return
  }

  console.log("\nDanh sách orphan:")
  for (const o of orphans.slice(0, 50)) {
    console.log(`  - ${o.public_id}  (created ${o.created_at})`)
  }
  if (orphans.length > 50) {
    console.log(`  ... và ${orphans.length - 50} cái khác`)
  }

  if (!EXECUTE) {
    console.log("\n⚠️  DRY-RUN — chạy lại với --execute để xoá.")
    return
  }

  console.log("\n🔴 Đang xoá...")
  let deleted = 0
  const CHUNK = 100
  for (let i = 0; i < orphans.length; i += CHUNK) {
    const chunk = orphans.slice(i, i + CHUNK).map((o) => o.public_id)
    try {
      const res = (await cloudinary.api.delete_resources(chunk)) as {
        deleted?: Record<string, string>
      }
      for (const status of Object.values(res.deleted ?? {})) {
        if (status === "deleted" || status === "not_found") deleted++
      }
      console.log(`  ✅ ${Math.min(i + CHUNK, orphans.length)}/${orphans.length}`)
    } catch (e) {
      console.error(
        `  ❌ Chunk ${i}-${i + chunk.length} failed:`,
        e instanceof Error ? e.message : e,
      )
    }
  }
  console.log(`\n🎉 Đã xoá ${deleted}/${orphans.length} orphan.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
