/**
 * Fix Cloudinary double-prefix bug cho logos của hội viên.
 *
 * Bug: scripts/seed-partners.ts trước đây vừa truyền publicId="agarwood-community/members/xxx"
 * vừa truyền option folder="agarwood-community/members" → Cloudinary concat 2 lần:
 *   Wrong: .../agarwood-community/members/agarwood-community/members/xxx.jpg
 *   Right: .../agarwood-community/members/xxx.jpg
 *
 * Script này:
 *   1. Tìm tất cả company có logoUrl chứa "agarwood-community/members/agarwood-community/members/"
 *   2. Rename Cloudinary resource sang public_id đúng (xoá 1 lớp prefix thừa)
 *   3. Cập nhật Company.logoUrl trong DB
 *
 * Idempotent: chạy lại sẽ skip các logo đã đúng path.
 *
 * Usage: npx tsx scripts/fix-cloudinary-double-prefix.ts
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
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvLocal()

/* eslint-disable @typescript-eslint/no-require-imports */
const { prisma } = require("../lib/prisma") as typeof import("../lib/prisma")
const cloudinary = require("cloudinary").v2 as typeof import("cloudinary").v2
/* eslint-enable @typescript-eslint/no-require-imports */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

const DUPLICATE_PATTERN = "agarwood-community/members/agarwood-community/members/"
const CORRECT_PREFIX = "agarwood-community/members/"

/**
 * Parse public_id from a Cloudinary URL.
 * Input: https://res.cloudinary.com/cloud/image/upload/v123/agarwood-community/members/agarwood-community/members/xxx.jpg
 * Output: agarwood-community/members/agarwood-community/members/xxx
 */
function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i)
  if (!match) return null
  return match[1]
}

async function main() {
  console.log("═".repeat(70))
  console.log("FIX CLOUDINARY DOUBLE-PREFIX")
  console.log("═".repeat(70))

  const companies = await prisma.company.findMany({
    where: {
      logoUrl: {
        contains: DUPLICATE_PATTERN,
      },
    },
    select: { id: true, name: true, logoUrl: true },
  })

  if (companies.length === 0) {
    console.log("✅ Không có logo nào bị double-prefix. Xong.")
    return
  }

  console.log(`Tìm thấy ${companies.length} company bị double-prefix:\n`)

  let fixed = 0
  let failed = 0

  for (const company of companies) {
    console.log(`📁 ${company.name}`)
    const oldUrl = company.logoUrl!
    const oldPublicId = extractPublicId(oldUrl)
    if (!oldPublicId) {
      console.log(`   ❌ Không parse được public_id từ URL: ${oldUrl}`)
      failed++
      continue
    }

    // New public_id = strip 1 layer of duplicate prefix
    // oldPublicId: "agarwood-community/members/agarwood-community/members/xxx"
    // newPublicId: "agarwood-community/members/xxx"
    const newPublicId = oldPublicId.replace(
      /^agarwood-community\/members\/agarwood-community\/members\//,
      "agarwood-community/members/",
    )

    if (newPublicId === oldPublicId) {
      console.log(`   ⏭️  Đã đúng path, skip`)
      continue
    }

    console.log(`   Old: ${oldPublicId}`)
    console.log(`   New: ${newPublicId}`)

    try {
      // Rename on Cloudinary
      const renameResult = await cloudinary.uploader.rename(oldPublicId, newPublicId, {
        overwrite: true,
        invalidate: true,
      })
      const newUrl = renameResult.secure_url as string
      console.log(`   ☁️  Renamed on Cloudinary`)

      // Update DB
      await prisma.company.update({
        where: { id: company.id },
        data: { logoUrl: newUrl },
      })

      // Also update user.avatarUrl if it was pointing to the same old URL
      await prisma.user.updateMany({
        where: { avatarUrl: oldUrl },
        data: { avatarUrl: newUrl },
      })

      console.log(`   ✅ DB updated`)
      console.log(`   New URL: ${newUrl}\n`)
      fixed++
    } catch (err) {
      // If target public_id already exists (e.g. half-migrated), Cloudinary throws
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`   ❌ Rename failed: ${msg}`)

      // Fallback: if new resource already exists, just update DB URL to use correct path
      if (msg.toLowerCase().includes("already exists")) {
        const newUrl = oldUrl.replace(DUPLICATE_PATTERN, CORRECT_PREFIX)
        console.log(`   🔧 Fallback: DB only update (resource đã tồn tại ở path mới)`)
        await prisma.company.update({
          where: { id: company.id },
          data: { logoUrl: newUrl },
        })
        await prisma.user.updateMany({
          where: { avatarUrl: oldUrl },
          data: { avatarUrl: newUrl },
        })
        console.log(`   ✅ DB updated với URL mới: ${newUrl}\n`)
        fixed++
      } else {
        failed++
      }
    }
  }

  console.log("═".repeat(70))
  console.log(`✅ Fixed: ${fixed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log("═".repeat(70))
}

main()
  .catch((err) => {
    console.error("FATAL:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
