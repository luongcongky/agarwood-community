/**
 * Crawl bài nghiên cứu khoa học từ website cũ hoitramhuongvietnam.org
 *
 * Workflow per article:
 *   1. Đọc metadata từ research-articles.json (title, date, thumbnailUrl, url)
 *   2. Fetch HTML bài viết từ url gốc
 *   3. Parse JSDOM → extract main content (.single-post / .blog_details / article)
 *   4. Upload thumbnail → Cloudinary (research/thumbnails/)
 *   5. Upload inline images → Cloudinary (research/{slug}/)
 *   6. Upload file đính kèm (PDF/DOC) → Google Drive (folder "Nghien cuu khoa hoc - Attachments")
 *   7. Clean HTML + DOMPurify sanitize
 *   8. Insert vào DB (news table, category=RESEARCH) via Prisma
 *
 * Usage:
 *   npx tsx scripts/crawl-research.ts              # crawl tất cả
 *   npx tsx scripts/crawl-research.ts --force      # crawl lại (xóa cũ)
 *   npx tsx scripts/crawl-research.ts --slug=xxx   # crawl 1 bài
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { readFileSync, existsSync } from "fs"
import { resolve } from "path"
import { createHash } from "crypto"
// @ts-expect-error — no @types/jsdom installed
import { JSDOM } from "jsdom"
import DOMPurify from "isomorphic-dompurify"
import { google } from "googleapis"
import { Readable } from "stream"

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
    // Handle escaped newlines in private keys
    value = value.replace(/\\n/g, "\n")
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
// CLI ARGS
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2)
const FORCE = args.includes("--force")
const SLUG_ARG = args.find((a) => a.startsWith("--slug="))?.replace("--slug=", "") ?? null

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
  "Accept-Encoding": "identity",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
}

const ALLOWED_TAGS = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "iframe",
  "div", "span",
]

const ALLOWED_ATTRS_PER_TAG: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen"],
  th: ["colspan", "rowspan"],
  td: ["colspan", "rowspan"],
}

const IFRAME_WHITELIST = [
  /^https?:\/\/(www\.)?youtube\.com\//,
  /^https?:\/\/youtu\.be\//,
  /^https?:\/\/(www\.)?youtube-nocookie\.com\//,
  /^https?:\/\/(player\.)?vimeo\.com\//,
]

// File attachment patterns
const FILE_EXTENSIONS = /\.(pdf|doc|docx|xls|xlsx)$/i
const FILE_URL_PATTERN = /hoitramhuongvietnam\.org\/file\//i

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type JsonArticle = {
  title: string
  author: string
  date: string // DD-MM-YYYY
  thumbnailUrl: string
  url: string
}

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE DRIVE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getGoogleDriveAuth() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Drive OAuth chưa cấu hình")
  }
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
  oauth2.setCredentials({ refresh_token: refreshToken })
  return oauth2
}

const DRIVE_ROOT = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!
let newsFolderId: string | null = null

async function getNewsDriveFolder(): Promise<string> {
  if (newsFolderId) return newsFolderId

  const drive = google.drive({ version: "v3", auth: getGoogleDriveAuth() })
  const folderName = "Nghien cuu khoa hoc - Attachments"

  // Find existing
  const res = await drive.files.list({
    q: `name='${folderName}' and '${DRIVE_ROOT}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  })

  if (res.data.files && res.data.files.length > 0) {
    newsFolderId = res.data.files[0].id!
    return newsFolderId
  }

  // Create folder
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [DRIVE_ROOT],
    },
    fields: "id",
  })

  newsFolderId = folder.data.id!
  return newsFolderId
}

async function uploadFileToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ viewUrl: string; downloadUrl: string }> {
  const drive = google.drive({ version: "v3", auth: getGoogleDriveAuth() })
  const folderId = await getNewsDriveFolder()

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id",
  })

  const fileId = res.data.id!
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  })

  return {
    viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function parseDate(dmy: string): Date {
  const [d, m, y] = dmy.split("-").map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

function slugFromUrl(url: string): string {
  const match = url.match(/\/nghien-cuu-khoa-hoc\/([^/.]+)/)
  if (!match) {
    // Fallback: last path segment
    const decoded = decodeURIComponent(url)
    const parts = decoded.split("/").filter(Boolean)
    return parts[parts.length - 1].replace(/\.html?$/, "")
  }
  return decodeURIComponent(match[1]).replace(/\.html?$/, "")
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow" })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  return res.text()
}

function resolveUrl(relative: string, base: string): string {
  try { return new URL(relative, base).toString() } catch { return relative }
}

function resolveImageSrc(src: string, sourceUrl: string): string[] {
  const natural = resolveUrl(src, sourceUrl)
  const candidates = [natural]
  if (/\/nghien-cuu-khoa-hoc\/images\//i.test(natural)) {
    const root = natural.replace(/\/nghien-cuu-khoa-hoc\/images\//i, "/images/")
    if (root !== natural) candidates.push(root)
  }
  return candidates
}

async function downloadBuffer(url: string, expectImage = true): Promise<{ buffer: Buffer; mime: string } | null> {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow" })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? (expectImage ? "image/jpeg" : "application/octet-stream")
    if (expectImage && !contentType.startsWith("image/")) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    if (expectImage && buffer.length < 1024) return null // skip tracking pixels
    return { buffer, mime: contentType.split(";")[0].trim() }
  } catch {
    return null
  }
}

async function uploadImageToCloudinary(
  buffer: Buffer,
  mime: string,
  folder: string,
  fileName: string,
): Promise<string | null> {
  try {
    const fullId = `${folder}/${fileName}`
    try {
      const existing = await cloudinary.api.resource(fullId).catch(() => null)
      if (existing) return existing.secure_url as string
    } catch { /* continue */ }

    const base64 = buffer.toString("base64")
    const dataUri = `data:${mime};base64,${base64}`
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      public_id: fileName,
      overwrite: false,
      resource_type: "image",
      transformation: [
        { width: 1200, crop: "limit" },
        { fetch_format: "auto", quality: "auto" },
      ],
    })
    return result.secure_url
  } catch (err) {
    console.log(`      ❌ Cloudinary upload failed: ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

function hashUrl(url: string): string {
  return createHash("md5").update(url).digest("hex").slice(0, 10)
}

function getMimeFromUrl(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase()
  const map: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }
  return map[ext ?? ""] ?? "application/octet-stream"
}

function getFileNameFromUrl(url: string): string {
  try {
    const decoded = decodeURIComponent(url)
    const parts = decoded.split("/").filter(Boolean)
    return parts[parts.length - 1].split("?")[0]
  } catch {
    return "attachment"
  }
}

function isFileAttachment(href: string): boolean {
  return FILE_EXTENSIONS.test(href) || FILE_URL_PATTERN.test(href)
}

// ═══════════════════════════════════════════════════════════════════════════
// HTML CLEANING
// ═══════════════════════════════════════════════════════════════════════════

function stripAttrs(el: Element): void {
  const tagName = el.tagName.toLowerCase()
  const allowed = ALLOWED_ATTRS_PER_TAG[tagName] ?? []
  const toRemove: string[] = []
  for (const attr of Array.from(el.attributes)) {
    if (!allowed.includes(attr.name.toLowerCase())) toRemove.push(attr.name)
  }
  toRemove.forEach((name) => el.removeAttribute(name))

  if (tagName === "a") {
    const href = el.getAttribute("href") ?? ""
    if (/^https?:\/\//.test(href)) {
      el.setAttribute("target", "_blank")
      el.setAttribute("rel", "noopener noreferrer")
    }
  }
}

function cleanNode(el: Element, doc: Document): void {
  const tagName = el.tagName.toLowerCase()
  if (["script", "style", "noscript", "link", "meta"].includes(tagName)) { el.remove(); return }

  if (tagName === "iframe") {
    const src = el.getAttribute("src") ?? ""
    if (!IFRAME_WHITELIST.some((re) => re.test(src))) { el.remove(); return }
  }

  if (!ALLOWED_TAGS.includes(tagName)) {
    const parent = el.parentNode
    if (parent) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      el.remove()
    }
    return
  }

  stripAttrs(el)
  for (const child of Array.from(el.children)) cleanNode(child, doc)
}

function removeEmpties(el: Element): void {
  for (const child of Array.from(el.children)) removeEmpties(child)
  const tagName = el.tagName.toLowerCase()
  if (["p", "div", "span"].includes(tagName)) {
    const text = (el.textContent ?? "").trim()
    if (!text && !el.querySelector("img, iframe")) el.remove()
  }
}

function extractExcerpt(container: Element, maxLen = 160): string {
  const firstP = container.querySelector("p")
  if (!firstP) return ""
  const text = (firstP.textContent ?? "").trim().replace(/\s+/g, " ")
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…"
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

function monthFolder(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`
}

async function processImages(
  container: Element,
  sourceUrl: string,
  publishedAt: Date,
): Promise<{ count: number; errors: number; firstUrl: string | null }> {
  const imgs = Array.from(container.querySelectorAll("img"))
  let count = 0, errors = 0, firstUrl: string | null = null
  const folder = `nghien-cuu/${monthFolder(publishedAt)}`

  for (const img of imgs) {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || ""
    if (!src || src.trim() === "" || src === "../images/") { img.remove(); continue }

    const candidates = resolveImageSrc(src, sourceUrl)
    const primary = candidates[0]

    if (/google-analytics|facebook\.com\/tr|doubleclick/.test(primary)) { img.remove(); continue }

    console.log(`      📥 Image: ${primary.slice(0, 80)}`)
    let dl = await downloadBuffer(primary, true)
    for (let i = 1; i < candidates.length && !dl; i++) {
      console.log(`         🔄 Fallback: ${candidates[i].slice(0, 80)}`)
      dl = await downloadBuffer(candidates[i], true)
    }
    if (!dl) { console.log(`         ❌ Failed`); img.remove(); errors++; continue }

    const hash = hashUrl(primary)
    const newUrl = await uploadImageToCloudinary(dl.buffer, dl.mime, folder, hash)
    if (!newUrl) { errors++; img.remove(); continue }

    img.setAttribute("src", newUrl)
    count++
    if (!firstUrl) firstUrl = newUrl
    console.log(`         ✅ Cloudinary: ${newUrl.slice(0, 80)}`)
  }

  return { count, errors, firstUrl }
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE ATTACHMENT PROCESSING → GOOGLE DRIVE
// ═══════════════════════════════════════════════════════════════════════════

async function processFileAttachments(
  container: Element,
  sourceUrl: string,
): Promise<{ count: number; errors: number }> {
  const links = Array.from(container.querySelectorAll("a"))
  let count = 0, errors = 0

  for (const link of links) {
    const href = link.getAttribute("href") ?? ""
    if (!href || !isFileAttachment(href)) continue

    const fullUrl = resolveUrl(href, sourceUrl)
    const fileName = getFileNameFromUrl(fullUrl)
    const mimeType = getMimeFromUrl(fullUrl)

    console.log(`      📎 File: ${fileName}`)
    const encodedUrl = encodeURI(decodeURI(fullUrl))
    const dl = await downloadBuffer(encodedUrl, false)
    if (!dl) {
      console.log(`         ❌ Download failed`)
      errors++
      continue
    }

    try {
      const result = await uploadFileToDrive(dl.buffer, fileName, mimeType)
      link.setAttribute("href", result.viewUrl)
      link.setAttribute("target", "_blank")
      link.setAttribute("rel", "noopener noreferrer")
      count++
      console.log(`         ✅ Drive: ${result.viewUrl}`)
    } catch (err) {
      console.log(`         ❌ Drive upload failed: ${err instanceof Error ? err.message : String(err)}`)
      errors++
    }
  }

  return { count, errors }
}

// ═══════════════════════════════════════════════════════════════════════════
// THUMBNAIL UPLOAD
// ═══════════════════════════════════════════════════════════════════════════

async function uploadThumbnail(thumbnailUrl: string, publishedAt: Date): Promise<string | null> {
  const encodedUrl = encodeURI(decodeURI(thumbnailUrl))
  console.log(`   🖼️ Thumbnail: ${encodedUrl.slice(0, 80)}`)
  const dl = await downloadBuffer(encodedUrl, true)
  if (!dl) {
    console.log(`      ❌ Thumbnail download failed`)
    return null
  }

  const hash = hashUrl(thumbnailUrl)
  const folder = `nghien-cuu/${monthFolder(publishedAt)}`
  const url = await uploadImageToCloudinary(dl.buffer, dl.mime, folder, hash)
  if (url) console.log(`      ✅ Thumbnail → Cloudinary`)
  return url
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CRAWL PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

async function crawlAndInsert(article: JsonArticle, adminId: string): Promise<"ok" | "skip" | "error"> {
  const slug = slugFromUrl(article.url)
  console.log(`\n${"─".repeat(60)}`)
  console.log(`🔬 ${article.title}`)
  console.log(`   Slug: ${slug}`)
  console.log(`   URL:  ${article.url}`)

  // Check idempotency
  if (!FORCE) {
    const existing = await prisma.news.findUnique({ where: { slug } })
    if (existing) {
      console.log(`   ⏭️ Skip (đã tồn tại)`)
      return "skip"
    }
  } else {
    // Force: delete existing if any
    await prisma.news.deleteMany({ where: { slug } })
  }

  // 1. Upload thumbnail
  const publishedAt = parseDate(article.date)
  const coverImageUrl = await uploadThumbnail(article.thumbnailUrl, publishedAt)

  // 2. Fetch article page
  const encodedUrl = encodeURI(decodeURI(article.url))
  console.log(`   🌐 Fetching HTML...`)
  const html = await fetchHtml(encodedUrl)
  console.log(`      Size: ${(html.length / 1024).toFixed(1)} KB`)

  // 3. Parse + extract content
  const dom = new JSDOM(html)
  const doc = dom.window.document

  let mainContent: Element | null =
    doc.querySelector(".single-post") ||
    doc.querySelector(".blog_details") ||
    doc.querySelector("article") ||
    null

  if (!mainContent) {
    console.log(`   ❌ Không tìm thấy main content container`)
    // Insert with placeholder
    await prisma.news.create({
      data: {
        title: article.title,
        slug,
        content: `<p><em>Nội dung đang được cập nhật. Xem bản gốc tại: <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.url}</a></em></p>`,
        excerpt: null,
        coverImageUrl,
        category: "RESEARCH",
        isPublished: true,
        publishedAt,
        authorId: adminId,
        sourceUrl: article.url,
        originalAuthor: article.author,
      },
    })
    return "ok"
  }

  mainContent = mainContent.cloneNode(true) as Element

  // Strip title (already have from JSON)
  const titleEl = mainContent.querySelector("h4, h3")
  if (titleEl) {
    const titleText = (titleEl.textContent ?? "").trim()
    if (titleText.length > 0) titleEl.remove()
  }

  // Strip related posts
  mainContent.querySelectorAll("h3").forEach((h: Element) => {
    const text = (h.textContent ?? "").toLowerCase()
    if (text.includes("các tin khác") || text.includes("tin liên quan") || text.includes("bài viết khác")) {
      let next = h.nextElementSibling
      while (next) { const r = next; next = next.nextElementSibling; r.remove() }
      h.remove()
    }
  })
  mainContent.querySelectorAll(".media.post_item, .post_item").forEach((el: Element) => el.remove())

  // 4. Process images → Cloudinary
  const imageStats = await processImages(mainContent, article.url, publishedAt)

  // 5. Process file attachments → Google Drive
  const fileStats = await processFileAttachments(mainContent, article.url)

  // 6. Clean HTML
  cleanNode(mainContent, doc)
  removeEmpties(mainContent)

  // 7. Extract excerpt
  const excerpt = extractExcerpt(mainContent)

  // 8. Serialize + DOMPurify
  let contentHtml = mainContent.innerHTML.trim()
  contentHtml = DOMPurify.sanitize(contentHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [
      "href", "title", "target", "rel",
      "src", "alt", "width", "height",
      "frameborder", "allow", "allowfullscreen",
      "colspan", "rowspan",
    ],
    ADD_ATTR: ["target", "rel"],
  })

  // Fallback coverImageUrl from first inline image
  const finalCover = coverImageUrl || imageStats.firstUrl

  // 9. Insert to DB
  await prisma.news.create({
    data: {
      title: article.title,
      slug,
      content: contentHtml || `<p><em>Nội dung đang được cập nhật.</em></p>`,
      excerpt: excerpt || null,
      coverImageUrl: finalCover,
      category: "RESEARCH",
      isPublished: true,
      publishedAt,
      authorId: adminId,
      sourceUrl: article.url,
      originalAuthor: article.author,
    },
  })

  console.log(`   📊 Images: ${imageStats.count} ok / ${imageStats.errors} fail`)
  console.log(`   📎 Files: ${fileStats.count} ok / ${fileStats.errors} fail`)
  console.log(`   📏 Content: ${contentHtml.length} chars HTML`)
  console.log(`   ✅ Inserted!`)
  return "ok"
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("═".repeat(60))
  console.log("CRAWL NGHIÊN CỨU KHOA HỌC — hoitramhuongvietnam.org")
  console.log(`Mode: ${FORCE ? "FORCE re-crawl" : "skip đã tồn tại"}${SLUG_ARG ? ` | slug=${SLUG_ARG}` : ""}`)
  console.log("═".repeat(60))

  // Load articles JSON
  const jsonPath = resolve(__dirname, "research-articles.json")
  const articles: JsonArticle[] = JSON.parse(readFileSync(jsonPath, "utf-8").replace(/^\uFEFF/, ""))
  console.log(`📋 ${articles.length} bài nghiên cứu từ JSON\n`)

  // Get admin user
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    console.error("❌ Không tìm thấy admin user. Chạy prisma db seed trước.")
    process.exit(1)
  }

  // Filter by slug if specified
  const toProcess = SLUG_ARG
    ? articles.filter((a) => slugFromUrl(a.url) === SLUG_ARG)
    : articles

  if (SLUG_ARG && toProcess.length === 0) {
    console.error(`❌ Không tìm thấy bài với slug="${SLUG_ARG}"`)
    process.exit(1)
  }

  let ok = 0, skipped = 0, failed = 0
  const failures: { title: string; error: string }[] = []

  for (const article of toProcess) {
    try {
      const result = await crawlAndInsert(article, admin.id)
      if (result === "ok") ok++
      else if (result === "skip") skipped++
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ title: article.title, error: msg })
      console.log(`   ❌ Error: ${msg}`)
    }
  }

  // Summary
  console.log(`\n${"═".repeat(60)}`)
  console.log("🎉 KẾT QUẢ CRAWL")
  console.log("═".repeat(60))
  console.log(`Tổng:      ${toProcess.length} bài`)
  console.log(`✅ OK:      ${ok}`)
  console.log(`⏭️ Skip:    ${skipped}`)
  console.log(`❌ Lỗi:     ${failed}`)

  if (failures.length > 0) {
    console.log("\nBài bị lỗi:")
    for (const f of failures) {
      console.log(`  - ${f.title}: ${f.error}`)
    }
  }
  console.log("═".repeat(60))
}

main()
  .catch((e) => {
    console.error("❌ Fatal:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
