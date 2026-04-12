/**
 * Step 1: Import metadata cơ bản 7 bài nghiên cứu khoa học từ trang cũ
 * hoitramhuongvietnam.org
 *
 * Workflow:
 *   1. Download thumbnail từ URL (hoặc cố gắng parse og:image nếu URL fail)
 *   2. Upload Cloudinary folder agarwood-community/research/thumbnails/
 *   3. Tạo News record với:
 *      - category: RESEARCH
 *      - content: placeholder (chi tiết sẽ được crawl ở step 2)
 *      - sourceUrl: link gốc
 *
 * Chạy: npx tsx scripts/import-research-articles.ts
 * Idempotent: skip nếu slug đã tồn tại.
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

type SourceArticle = {
  title: string
  slug: string // ASCII slug generated from title
  publishedDate: string // YYYY-MM-DD
  thumbnailUrl: string | null // URL gốc từ trang cũ
  sourceUrl: string
}

const ARTICLES: SourceArticle[] = [
  {
    title: "Hội Trầm Hương Việt Nam đã tổ chức \"Thực nghiệm cấy tạo trầm hương trên cây dó bầu\"",
    slug: "hoi-tram-huong-viet-nam-to-chuc-thuc-nghiem-cay-tao-tram-tren-cay-do-bau",
    publishedDate: "2023-09-03",
    thumbnailUrl: "https://hoitramhuongvietnam.org/images/hth.jpg",
    sourceUrl:
      "https://hoitramhuongvietnam.org/nghien-cuu-khoa-hoc/hoi-tram-huong-viet-nam-to-chuc-thuc-nghiem-cay-tao-tram-tren-cây-do-bau.html",
  },
  {
    title: "Thông tin bước đầu về phân loại cây Dó bầu đang trồng rộng rãi tại Việt Nam",
    slug: "thong-tin-buoc-dau-ve-phan-loai-cay-do-bau-dang-trong-rong-rai-tai-viet-nam",
    publishedDate: "2016-07-25",
    thumbnailUrl: "https://hoitramhuongvietnam.org/images/dobau.jpg",
    sourceUrl:
      "https://hoitramhuongvietnam.org/nghien-cuu-khoa-hoc/thong-tin-buoc-dau-ve-phan-loai-cay-do-bau-dang-trong-rong-rai-tai-viet-nam..html",
  },
  {
    title: "Thực trạng về sản xuất hàng thủ công mỹ nghệ",
    slug: "thuc-trang-ve-san-xuat-hang-thu-cong-my-nghe",
    publishedDate: "2015-12-22",
    thumbnailUrl: "https://hoitramhuongvietnam.org/images/mynghe.jpg",
    sourceUrl:
      "https://hoitramhuongvietnam.org/nghien-cuu-khoa-hoc/thuc-trang-ve-san-xuat-hang-thu-cong-my-nghe.html",
  },
  {
    title: "Vai trò của tinh dầu trong đời sống thực vật",
    slug: "vai-tro-cua-tinh-dau-trong-doi-song-thuc-vat",
    publishedDate: "2015-12-22",
    thumbnailUrl: "https://hoitramhuongvietnam.org/images/tinhdau.jpg",
    sourceUrl:
      "https://hoitramhuongvietnam.org/nghien-cuu-khoa-hoc/vai-tro-cua-tinh-dau-trong-doi-song-thuc-vat.html",
  },
  {
    title: "Bước đầu tìm hiểu sự khác biệt giữa trầm hương và kỳ nam",
    slug: "buoc-dau-tim-hieu-su-khac-biet-giua-tram-huong-va-ky-nam",
    publishedDate: "2015-12-22",
    thumbnailUrl: "https://hoitramhuongvietnam.org/images/tramhuongkynam.jpg",
    sourceUrl:
      "https://hoitramhuongvietnam.org/nghien-cuu-khoa-hoc/buoc-dau-tim-hieu-su-khac-biet-giua-tram-huong-va-ky-nam.html",
  },
  {
    title: "Phương pháp cấy tạo trầm sử dụng vi sinh của FORDA Indonesia",
    slug: "phuong-phap-cay-tao-tram-su-dung-vi-sinh-cua-forda-indonesia",
    publishedDate: "2015-12-21",
    thumbnailUrl: "https://hoitramhuongvietnam.org/images/forda.jpg",
    sourceUrl:
      "https://hoitramhuongvietnam.org/nghien-cuu-khoa-hoc/phuong-phap-cay-tao-tram-su-dung-vi-sinh-cua-forda-indonesia.html",
  },
  {
    title: "Trầm hương: Cây dó bầu, tạo trầm — lợi ích, thách thức và triển vọng",
    slug: "tram-huong-cay-do-bau-tao-tram-loi-ich-thach-thuc-va-trien-vong",
    publishedDate: "2015-12-20",
    thumbnailUrl: "https://hoitramhuongvietnam.org/images/tramhuong.jpg",
    sourceUrl:
      "https://hoitramhuongvietnam.org/nghien-cuu-khoa-hoc/tram-huongcay-do-bautao-tram-loi-ichthach-thuc-va-trien-vong.html",
  },
]

const PLACEHOLDER_CONTENT = `
<p><em>Đây là bài nghiên cứu khoa học được nhập từ website cũ của Hội Trầm Hương Việt Nam. Nội dung đầy đủ đang được cập nhật.</em></p>
<p>Trong khi chờ đợi, bạn có thể xem bản gốc tại: <a href="__SOURCE_URL__" target="_blank" rel="noopener noreferrer">__SOURCE_URL__</a></p>
`.trim()

async function tryFetchImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Agarwood Research Import)" },
      redirect: "follow",
    })
    if (!res.ok) {
      console.log(`   ⚠️  HTTP ${res.status} cho ${url}`)
      return null
    }
    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.startsWith("image/")) {
      console.log(`   ⚠️  Content-Type không phải ảnh: ${contentType}`)
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    return buffer
  } catch (err) {
    console.log(`   ⚠️  Fetch failed: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

async function tryExtractOgImage(sourceUrl: string): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Agarwood Research Import)" },
    })
    if (!res.ok) return null
    const html = await res.text()
    // Regex extract og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    if (ogMatch) return ogMatch[1]
    // Fallback: first <img> in article body
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (imgMatch) {
      const src = imgMatch[1]
      // Convert relative → absolute
      if (src.startsWith("http")) return src
      if (src.startsWith("/")) {
        const origin = new URL(sourceUrl).origin
        return origin + src
      }
    }
    return null
  } catch {
    return null
  }
}

async function uploadThumbnail(buffer: Buffer, slug: string): Promise<string | null> {
  const publicId = `agarwood-community/research/thumbnails/${slug}`
  try {
    // Upload via data URI (raw buffer)
    const base64 = buffer.toString("base64")
    // Best-effort mime detection based on magic bytes
    let mime = "image/jpeg"
    if (buffer.slice(0, 8).toString("hex") === "89504e470d0a1a0a") mime = "image/png"
    else if (buffer.slice(0, 6).toString("ascii") === "GIF89a" || buffer.slice(0, 6).toString("ascii") === "GIF87a") mime = "image/gif"
    else if (buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP") mime = "image/webp"

    const dataUri = `data:${mime};base64,${base64}`
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
      transformation: [
        { width: 1200, height: 800, crop: "limit" },
        { fetch_format: "auto", quality: "auto" },
      ],
    })
    return result.secure_url
  } catch (err) {
    console.log(`   ❌ Upload Cloudinary failed: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

async function importOne(article: SourceArticle, adminId: string): Promise<"imported" | "skipped" | "failed"> {
  // Check if already exists
  const existing = await prisma.news.findUnique({ where: { slug: article.slug } })
  if (existing) {
    console.log(`   ⏭️  Skip (slug đã tồn tại): ${article.slug}`)
    return "skipped"
  }

  console.log(`\n📄 ${article.title}`)

  // Step 1: Get thumbnail
  let thumbnailBuffer: Buffer | null = null
  let thumbnailSource = "none"

  if (article.thumbnailUrl) {
    console.log(`   📥 Try thumbnail: ${article.thumbnailUrl}`)
    thumbnailBuffer = await tryFetchImage(article.thumbnailUrl)
    if (thumbnailBuffer) thumbnailSource = "direct"
  }

  // Fallback: extract og:image from source page
  if (!thumbnailBuffer) {
    console.log(`   🔍 Fallback: parse og:image từ source page`)
    const ogImageUrl = await tryExtractOgImage(article.sourceUrl)
    if (ogImageUrl) {
      console.log(`   📥 Try og:image: ${ogImageUrl}`)
      thumbnailBuffer = await tryFetchImage(ogImageUrl)
      if (thumbnailBuffer) thumbnailSource = "og:image"
    }
  }

  let coverImageUrl: string | null = null
  if (thumbnailBuffer) {
    console.log(`   ☁️  Upload Cloudinary (source: ${thumbnailSource}, ${(thumbnailBuffer.length / 1024).toFixed(0)} KB)`)
    coverImageUrl = await uploadThumbnail(thumbnailBuffer, article.slug)
    if (coverImageUrl) {
      console.log(`   ✅ Cloudinary: ${coverImageUrl}`)
    }
  } else {
    console.log(`   ⚠️  Không có thumbnail — sẽ dùng fallback icon trên UI`)
  }

  try {
    await prisma.news.create({
      data: {
        title: article.title,
        slug: article.slug,
        excerpt: null, // Sẽ điền ở step 2 từ paragraph đầu
        content: PLACEHOLDER_CONTENT.replace(/__SOURCE_URL__/g, article.sourceUrl),
        coverImageUrl,
        category: "RESEARCH",
        isPublished: true,
        isPinned: false,
        publishedAt: new Date(article.publishedDate),
        authorId: adminId,
        sourceUrl: article.sourceUrl,
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
  console.log("IMPORT NGHIÊN CỨU KHOA HỌC — Step 1 (metadata + thumbnails)")
  console.log("═".repeat(70))

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    throw new Error("Không tìm thấy admin user. Chạy 'npx prisma db seed' trước.")
  }
  console.log(`Admin authorId: ${admin.email}`)
  console.log(`Total articles: ${ARTICLES.length}`)

  let imported = 0
  let skipped = 0
  let failed = 0

  for (const article of ARTICLES) {
    const result = await importOne(article, admin.id)
    if (result === "imported") imported++
    else if (result === "skipped") skipped++
    else failed++
  }

  console.log("\n" + "═".repeat(70))
  console.log("KẾT QUẢ")
  console.log("═".repeat(70))
  console.log(`✅ Imported: ${imported}`)
  console.log(`⏭️  Skipped:  ${skipped}`)
  console.log(`❌ Failed:   ${failed}`)
  console.log("")
  console.log("⚠️  Step 2 sẽ crawl full content + migrate images → Cloudinary.")
  console.log("   Xem kế hoạch step 2 trong scripts/crawl-research-content.ts (sắp tạo)")
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
