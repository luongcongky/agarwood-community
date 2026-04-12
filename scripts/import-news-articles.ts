/**
 * Step 1: Import metadata cơ bản của các bài tin tức (category=GENERAL)
 * từ trang cũ hoitramhuongvietnam.org, dựa trên danh sách JSON
 * scripts/bang-tin-hoi-articles.json
 *
 * Workflow per article:
 *   1. Parse title/date/thumbnail/link từ JSON
 *   2. Extract slug từ URL gốc (đã unique theo slug của trang cũ)
 *   3. Download thumbnail → Cloudinary folder agarwood-community/news/thumbnails/
 *   4. Create News record với:
 *      - category: GENERAL
 *      - content: placeholder (chi tiết sẽ crawl ở step 2)
 *      - sourceUrl: link gốc
 *      - originalAuthor: "Admin" (per JSON)
 *
 * Chạy: npx tsx scripts/import-news-articles.ts
 * Idempotent: skip nếu slug đã tồn tại.
 */

// TLS workaround cho legacy site với cert kém
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

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

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════

type JsonArticle = {
  title: string
  author: string
  date: string // DD-MM-YYYY
  thumbnail: string
  link: string
}

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/webp,image/*,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
  "Accept-Encoding": "identity",
}

const PLACEHOLDER_CONTENT = `
<p><em>Đây là bài tin tức được nhập từ website cũ của Hội Trầm Hương Việt Nam. Nội dung đầy đủ đang được cập nhật.</em></p>
<p>Trong khi chờ đợi, bạn có thể xem bản gốc tại: <a href="__SOURCE_URL__" target="_blank" rel="noopener noreferrer">__SOURCE_URL__</a></p>
`.trim()

/** Parse "DD-MM-YYYY" → Date object */
function parseDate(dmy: string): Date {
  const [d, m, y] = dmy.split("-").map((n) => parseInt(n, 10))
  return new Date(Date.UTC(y, m - 1, d))
}

/** Extract slug từ URL gốc: .../bang-tin-hoi/{slug}.html → {slug} */
function slugFromUrl(url: string): string | null {
  const match = url.match(/\/bang-tin-hoi\/([^/]+)\.html$/i)
  return match ? match[1] : null
}

/**
 * Encode URL có ký tự tiếng Việt hoặc dấu gạch dưới Unicode.
 * hoitramhuongvietnam.org server expect percent-encoded.
 */
function encodeImageUrl(url: string): string {
  try {
    const u = new URL(url)
    // Re-encode pathname preserving slashes
    u.pathname = u.pathname
      .split("/")
      .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
      .join("/")
    return u.toString()
  } catch {
    return url
  }
}

async function tryFetchImage(url: string): Promise<{ buffer: Buffer; mime: string } | null> {
  try {
    const encoded = encodeImageUrl(url)
    const res = await fetch(encoded, { headers: FETCH_HEADERS, redirect: "follow" })
    if (!res.ok) {
      console.log(`      ⚠️  HTTP ${res.status}`)
      return null
    }
    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    if (!contentType.startsWith("image/")) {
      console.log(`      ⚠️  Content-Type: ${contentType}`)
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 512) {
      console.log(`      ⚠️  Buffer quá nhỏ: ${buffer.length}b`)
      return null
    }
    return { buffer, mime: contentType.split(";")[0].trim() }
  } catch (err) {
    console.log(`      ⚠️  Fetch err: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

async function uploadToCloudinary(buffer: Buffer, mime: string, publicId: string): Promise<string | null> {
  try {
    // Check if already exists
    const existing = await cloudinary.api.resource(publicId).catch(() => null)
    if (existing) {
      return existing.secure_url as string
    }
    const dataUri = `data:${mime};base64,${buffer.toString("base64")}`
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      overwrite: false,
      resource_type: "image",
      transformation: [
        { width: 1200, height: 800, crop: "limit" },
        { fetch_format: "auto", quality: "auto" },
      ],
    })
    return result.secure_url
  } catch (err) {
    console.log(`      ❌ Upload failed: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function importOne(
  article: JsonArticle,
  adminId: string,
): Promise<"imported" | "skipped" | "failed"> {
  const slug = slugFromUrl(article.link)
  if (!slug) {
    console.log(`   ❌ Không extract được slug từ URL: ${article.link}`)
    return "failed"
  }

  // Check existing
  const existing = await prisma.news.findUnique({ where: { slug } })
  if (existing) {
    console.log(`   ⏭️  Skip (slug đã tồn tại): ${slug}`)
    return "skipped"
  }

  console.log(`\n📰 ${article.title}`)
  console.log(`   slug: ${slug}`)

  // Step 1: Download thumbnail
  let coverImageUrl: string | null = null
  if (article.thumbnail) {
    console.log(`   📥 Thumbnail: ${article.thumbnail.slice(0, 90)}`)
    const dl = await tryFetchImage(article.thumbnail)
    if (dl) {
      console.log(`      ${(dl.buffer.length / 1024).toFixed(0)} KB`)
      const publicId = `agarwood-community/news/thumbnails/${slug}`
      coverImageUrl = await uploadToCloudinary(dl.buffer, dl.mime, publicId)
      if (coverImageUrl) {
        console.log(`      ☁️  ${coverImageUrl.slice(0, 80)}`)
      }
    }
  }

  try {
    await prisma.news.create({
      data: {
        title: article.title,
        slug,
        excerpt: null,
        content: PLACEHOLDER_CONTENT.replace(/__SOURCE_URL__/g, article.link),
        coverImageUrl,
        category: "GENERAL",
        isPublished: true,
        isPinned: false,
        publishedAt: parseDate(article.date),
        authorId: adminId,
        sourceUrl: article.link,
        originalAuthor: article.author,
      },
    })
    console.log(`   ✅ DB record created`)
    return "imported"
  } catch (err) {
    console.error(`   ❌ DB create failed: ${err instanceof Error ? err.message : String(err)}`)
    return "failed"
  }
}

async function main() {
  console.log("═".repeat(70))
  console.log("IMPORT TIN TỨC (bang-tin-hoi) — Step 1 (metadata + thumbnails)")
  console.log("═".repeat(70))

  const jsonPath = resolve(process.cwd(), "scripts/bang-tin-hoi-articles.json")
  if (!existsSync(jsonPath)) {
    throw new Error(`Không tìm thấy JSON file: ${jsonPath}`)
  }
  // Strip BOM nếu có (một số editor trên Windows thêm BOM vào file UTF-8)
  const raw = readFileSync(jsonPath, "utf-8").replace(/^\uFEFF/, "")
  const articles: JsonArticle[] = JSON.parse(raw)
  console.log(`JSON: ${articles.length} articles`)

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    throw new Error("Không tìm thấy admin user. Chạy 'npx prisma db seed' trước.")
  }
  console.log(`Admin: ${admin.email}`)
  console.log("─".repeat(70))

  let imported = 0
  let skipped = 0
  let failed = 0
  const failedSlugs: string[] = []

  for (const article of articles) {
    const result = await importOne(article, admin.id)
    if (result === "imported") imported++
    else if (result === "skipped") skipped++
    else {
      failed++
      failedSlugs.push(article.title)
    }
  }

  console.log("\n" + "═".repeat(70))
  console.log("KẾT QUẢ")
  console.log("═".repeat(70))
  console.log(`✅ Imported: ${imported}`)
  console.log(`⏭️  Skipped:  ${skipped}`)
  console.log(`❌ Failed:   ${failed}`)
  if (failedSlugs.length > 0) {
    console.log("\nFailed:")
    failedSlugs.forEach((s) => console.log(`  - ${s}`))
  }
  console.log("")
  console.log("⚠️  Step 2: chạy `npx tsx scripts/crawl-research-content.ts --category=GENERAL`")
  console.log("   để crawl full content + migrate images → Cloudinary.")
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
