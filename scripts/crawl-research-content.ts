/**
 * Step 2: Crawl full content của các bài nghiên cứu khoa học từ trang cũ
 *
 * Workflow per article:
 *   1. Fetch HTML từ News.sourceUrl
 *   2. Parse bằng JSDOM → extract .single-post (main content container)
 *   3. Semantic clean: strip .h4 title (đã có trong DB), strip related posts,
 *      strip all class/id/inline style, keep only semantic tags
 *   4. Process images: download → upload Cloudinary → rewrite src
 *   5. Whitelist iframes: chỉ YouTube/Vimeo
 *   6. DOMPurify sanitize cuối cùng
 *   7. Generate excerpt từ paragraph đầu (~160 chars)
 *   8. Nếu coverImageUrl null → dùng ảnh đầu tiên (đã Cloudinary)
 *   9. Update DB: content, excerpt, coverImageUrl, originalAuthor="Admin"
 *
 * Usage:
 *   npx tsx scripts/crawl-research-content.ts             # crawl tất cả (skip đã crawl)
 *   npx tsx scripts/crawl-research-content.ts --force     # crawl lại tất cả
 *   npx tsx scripts/crawl-research-content.ts --slug=xxx  # crawl 1 bài theo slug
 *
 * Idempotent: skip bài đã có content thật (không phải placeholder).
 */

// Disable TLS verification cho legacy site (tạm thời trong script này)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { readFileSync, existsSync } from "fs"
import { createHash } from "crypto"
// @ts-expect-error — no @types/jsdom installed, use runtime JSDOM class
import { JSDOM } from "jsdom"
import DOMPurify from "isomorphic-dompurify"

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
// CLI ARGS
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2)
const FORCE = args.includes("--force")
const SLUG_ARG = args.find((a) => a.startsWith("--slug="))?.replace("--slug=", "") ?? null
const CATEGORY_ARG = args.find((a) => a.startsWith("--category="))?.replace("--category=", "") as
  | "RESEARCH"
  | "GENERAL"
  | undefined

const VALID_CATEGORIES = ["RESEARCH", "GENERAL"] as const
if (CATEGORY_ARG && !VALID_CATEGORIES.includes(CATEGORY_ARG)) {
  console.error(`Invalid --category: ${CATEGORY_ARG}. Use one of: ${VALID_CATEGORIES.join(", ")}`)
  process.exit(1)
}

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

// Semantic tags cần giữ lại trong output HTML
const ALLOWED_TAGS = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "iframe",
  "div", "span", // sẽ được strip attrs
]

// Attrs được giữ (bỏ class/id/style từ CMS cũ)
const ALLOWED_ATTRS_PER_TAG: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen"],
  th: ["colspan", "rowspan"],
  td: ["colspan", "rowspan"],
}

// Whitelist iframe hosts
const IFRAME_WHITELIST = [
  /^https?:\/\/(www\.)?youtube\.com\//,
  /^https?:\/\/youtu\.be\//,
  /^https?:\/\/(www\.)?youtube-nocookie\.com\//,
  /^https?:\/\/(player\.)?vimeo\.com\//,
]

// Match cả 2 placeholder: "bài nghiên cứu khoa học" và "bài tin tức"
// (imported ở step 1)
const PLACEHOLDER_REGEX = /Đây là bài (nghiên cứu khoa học|tin tức) được nhập từ website cũ/

function isPlaceholder(content: string): boolean {
  return PLACEHOLDER_REGEX.test(content)
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type CrawlResult = {
  contentHtml: string
  excerpt: string
  firstImageUrl: string | null
  imageCount: number
  imageErrors: number
  isEmpty: boolean // true khi content trống — cần giữ nguyên placeholder
}

// Ngưỡng content tối thiểu (ký tự text thuần) — dưới mức này coi như rỗng
const MIN_CONTENT_TEXT_LENGTH = 100

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    redirect: "follow",
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }
  return res.text()
}

function resolveUrl(relative: string, base: string): string {
  try {
    return new URL(relative, base).toString()
  } catch {
    return relative
  }
}

/**
 * Với trang cũ hoitramhuongvietnam.org, một số img có `src="images/..."`
 * (thiếu `../`), link này cần resolve về root domain, không phải relative
 * to article path. Trả về cả URL "tự nhiên" và URL fallback để thử lần lượt.
 */
function resolveImageSrc(src: string, sourceUrl: string): string[] {
  const natural = resolveUrl(src, sourceUrl)
  const candidates = [natural]
  // Nếu path chứa `/nghien-cuu-khoa-hoc/images/` (hoặc subdir khác), thử root-level
  if (/\/nghien-cuu-khoa-hoc\/images\//i.test(natural)) {
    const root = natural.replace(/\/[^/]+\/images\//i, "/images/")
    if (root !== natural) candidates.push(root)
  }
  return candidates
}

async function downloadImageBuffer(url: string): Promise<{ buffer: Buffer; mime: string } | null> {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow" })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    if (!contentType.startsWith("image/")) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    // Skip tiny images (< 1KB — likely tracking pixels)
    if (buffer.length < 1024) return null
    return { buffer, mime: contentType.split(";")[0].trim() }
  } catch {
    return null
  }
}

async function uploadImageToCloudinary(
  buffer: Buffer,
  mime: string,
  publicId: string,
): Promise<string | null> {
  try {
    // Check if already uploaded
    try {
      const existing = await cloudinary.api.resource(publicId).catch(() => null)
      if (existing) {
        return existing.secure_url as string
      }
    } catch {
      // Continue
    }

    const base64 = buffer.toString("base64")
    const dataUri = `data:${mime};base64,${base64}`
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
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

function hashImageUrl(url: string): string {
  return createHash("md5").update(url).digest("hex").slice(0, 10)
}

/**
 * Strip all attributes except those in allowlist.
 * Also remove class/id/style on any element.
 */
function stripAttrs(el: Element): void {
  const tagName = el.tagName.toLowerCase()
  const allowed = ALLOWED_ATTRS_PER_TAG[tagName] ?? []
  const toRemove: string[] = []
  for (const attr of Array.from(el.attributes)) {
    if (!allowed.includes(attr.name.toLowerCase())) {
      toRemove.push(attr.name)
    }
  }
  toRemove.forEach((name) => el.removeAttribute(name))

  // Add security attrs for external links
  if (tagName === "a") {
    const href = el.getAttribute("href") ?? ""
    if (/^https?:\/\//.test(href)) {
      el.setAttribute("target", "_blank")
      el.setAttribute("rel", "noopener noreferrer")
    }
  }
}

/**
 * Recursively walk DOM: strip disallowed tags, strip attributes.
 * Replace disallowed with their children (unwrap).
 */
function cleanNode(el: Element, doc: Document): void {
  const tagName = el.tagName.toLowerCase()

  // Remove completely: script, style, noscript, link, meta
  if (["script", "style", "noscript", "link", "meta"].includes(tagName)) {
    el.remove()
    return
  }

  // Iframe whitelist check
  if (tagName === "iframe") {
    const src = el.getAttribute("src") ?? ""
    const allowed = IFRAME_WHITELIST.some((re) => re.test(src))
    if (!allowed) {
      el.remove()
      return
    }
  }

  // If tag not in allowlist: unwrap (replace with children)
  if (!ALLOWED_TAGS.includes(tagName)) {
    const parent = el.parentNode
    if (parent) {
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el)
      }
      el.remove()
    }
    return
  }

  stripAttrs(el)

  // Recurse children (toArray to avoid mutation issues)
  const children = Array.from(el.children)
  for (const child of children) {
    cleanNode(child, doc)
  }
}

/**
 * Remove empty paragraphs and wrappers (after attribute strip some divs become useless).
 */
function removeEmpties(el: Element): void {
  const children = Array.from(el.children)
  for (const child of children) {
    removeEmpties(child)
  }
  const tagName = el.tagName.toLowerCase()
  if (["p", "div", "span"].includes(tagName)) {
    const text = (el.textContent ?? "").trim()
    const hasMedia = el.querySelector("img, iframe") !== null
    if (!text && !hasMedia) {
      el.remove()
    }
  }
}

async function processImages(
  container: Element,
  sourceUrl: string,
  articleSlug: string,
): Promise<{ count: number; errors: number; firstUrl: string | null }> {
  const imgs = Array.from(container.querySelectorAll("img"))
  let count = 0
  let errors = 0
  let firstUrl: string | null = null

  for (const img of imgs) {
    // Get src (check data-src, data-lazy-src as fallback)
    const src =
      img.getAttribute("src") ||
      img.getAttribute("data-src") ||
      img.getAttribute("data-lazy-src") ||
      img.getAttribute("data-original") ||
      ""

    if (!src || src.trim() === "" || src === "../images/") {
      // Empty placeholder — strip the img
      img.remove()
      continue
    }

    // Resolve relative URL — try primary + fallback cho legacy path quirks
    const candidates = resolveImageSrc(src, sourceUrl)
    const primary = candidates[0]

    // Skip tracking/analytics
    if (/google-analytics|facebook\.com\/tr|doubleclick/.test(primary)) {
      img.remove()
      continue
    }

    console.log(`      📥 Image: ${primary.slice(0, 80)}`)
    let dl = await downloadImageBuffer(primary)
    // Thử fallback URLs nếu primary fail
    for (let i = 1; i < candidates.length && !dl; i++) {
      console.log(`         🔄 Fallback: ${candidates[i].slice(0, 80)}`)
      dl = await downloadImageBuffer(candidates[i])
    }
    if (!dl) {
      console.log(`         ❌ All URLs failed — removing <img>`)
      img.remove()
      errors++
      continue
    }

    // Compute public_id
    const hash = hashImageUrl(primary)
    const publicId = `agarwood-community/research/${articleSlug}/${hash}`

    const newUrl = await uploadImageToCloudinary(dl.buffer, dl.mime, publicId)
    if (!newUrl) {
      errors++
      img.remove()
      continue
    }

    img.setAttribute("src", newUrl)
    count++
    if (!firstUrl) firstUrl = newUrl
    console.log(`         ✅ Cloudinary: ${newUrl.slice(0, 80)}`)
  }

  return { count, errors, firstUrl }
}

function extractExcerpt(container: Element, maxLen = 160): string {
  // Get text from first paragraph
  const firstP = container.querySelector("p")
  if (!firstP) return ""
  const text = (firstP.textContent ?? "").trim().replace(/\s+/g, " ")
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…"
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CRAWL PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

async function crawlArticle(article: {
  id: string
  slug: string
  title: string
  sourceUrl: string
  coverImageUrl: string | null
}): Promise<CrawlResult> {
  console.log(`\n📰 ${article.title}`)
  console.log(`   URL: ${article.sourceUrl}`)

  // Phase A — Fetch HTML (encodeURI for Vietnamese chars in URL)
  const encodedUrl = encodeURI(decodeURI(article.sourceUrl))
  console.log(`   🌐 Fetching...`)
  const html = await fetchHtml(encodedUrl)
  console.log(`      Size: ${(html.length / 1024).toFixed(1)} KB`)

  // Phase B — Parse + extract main content
  const dom = new JSDOM(html)
  const doc = dom.window.document

  // Try main content selectors in priority order
  let mainContent: Element | null =
    doc.querySelector(".single-post") ||
    doc.querySelector(".blog_details") ||
    doc.querySelector("article") ||
    null

  if (!mainContent) {
    throw new Error("Không tìm thấy main content container (.single-post / .blog_details / article)")
  }

  console.log(`   📄 Main container: .${mainContent.className.split(" ")[0] || mainContent.tagName.toLowerCase()}`)

  // Clone để không thay đổi DOM gốc
  mainContent = mainContent.cloneNode(true) as Element

  // Strip title h4/h3 (đã có trong DB)
  const titleEl = mainContent.querySelector("h4, h3")
  if (titleEl) {
    const titleText = (titleEl.textContent ?? "").trim()
    if (titleText.length > 0) {
      console.log(`      Strip title h4: "${titleText.slice(0, 60)}"`)
      titleEl.remove()
    }
  }

  // Strip related posts block nếu có ("Các tin khác:")
  mainContent.querySelectorAll("h3").forEach((h) => {
    const text = (h.textContent ?? "").toLowerCase()
    if (text.includes("các tin khác") || text.includes("tin liên quan") || text.includes("bài viết khác")) {
      // Remove h3 and following sibling (list of related)
      let next = h.nextElementSibling
      while (next) {
        const toRemove = next
        next = next.nextElementSibling
        toRemove.remove()
      }
      h.remove()
    }
  })

  // Strip .media.post_item (related posts)
  mainContent.querySelectorAll(".media.post_item, .post_item").forEach((el) => el.remove())

  // Phase C — Process images
  const imageStats = await processImages(mainContent, article.sourceUrl, article.slug)

  // Phase D — Clean HTML: strip tags + attrs
  cleanNode(mainContent, doc)
  removeEmpties(mainContent)

  // Phase E — Generate excerpt
  const excerpt = extractExcerpt(mainContent)

  // Serialize
  let contentHtml = mainContent.innerHTML.trim()

  // Final DOMPurify pass (belt + suspenders)
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

  // Detect empty content — strip all tags + whitespace để đếm text thuần
  const plainText = contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  // Empty khi: text quá ngắn VÀ không có ảnh nào (nhiều bài là thư/thông báo
  // dạng image-only, không có text thuần — vẫn coi là hợp lệ)
  const isEmpty = plainText.length < MIN_CONTENT_TEXT_LENGTH && imageStats.count === 0

  console.log(`   📊 Images: ${imageStats.count} uploaded, ${imageStats.errors} failed`)
  console.log(`   📏 Content: ${contentHtml.length} chars HTML / ${plainText.length} chars text, ${excerpt.length} chars excerpt`)
  if (isEmpty) {
    console.log(`   ⚠️  Content quá ngắn (<${MIN_CONTENT_TEXT_LENGTH} ký tự text) và không có ảnh — trang cũ có thể rỗng`)
  } else if (plainText.length < MIN_CONTENT_TEXT_LENGTH) {
    console.log(`   ℹ️  Bài image-only (${imageStats.count} ảnh, ${plainText.length} ký tự text)`)
  }

  return {
    contentHtml,
    excerpt,
    firstImageUrl: imageStats.firstUrl,
    imageCount: imageStats.count,
    imageErrors: imageStats.errors,
    isEmpty,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const categoryLabel = CATEGORY_ARG ?? "ALL (RESEARCH + GENERAL)"
  console.log("═".repeat(70))
  console.log("CRAWL NEWS — Step 2 (full content + images)")
  console.log(`Category: ${categoryLabel}`)
  console.log(`Mode: ${FORCE ? "FORCE re-crawl" : "skip already crawled"}${SLUG_ARG ? ` | slug=${SLUG_ARG}` : ""}`)
  console.log("═".repeat(70))

  const whereClause: {
    category?: "RESEARCH" | "GENERAL"
    sourceUrl: { not: null }
    slug?: string
  } = {
    sourceUrl: { not: null },
  }
  if (CATEGORY_ARG) whereClause.category = CATEGORY_ARG
  if (SLUG_ARG) whereClause.slug = SLUG_ARG

  const articles = await prisma.news.findMany({
    where: whereClause,
    select: {
      id: true,
      slug: true,
      title: true,
      sourceUrl: true,
      content: true,
      coverImageUrl: true,
    },
  })

  console.log(`Found ${articles.length} article(s) với sourceUrl\n`)

  let crawled = 0
  let skipped = 0
  let failed = 0
  const failures: { slug: string; error: string }[] = []

  for (const article of articles) {
    if (!article.sourceUrl) continue

    // Skip already-crawled (content không còn là placeholder)
    if (!FORCE && !isPlaceholder(article.content)) {
      console.log(`⏭️  Skip (đã crawl): ${article.slug}`)
      skipped++
      continue
    }

    try {
      const result = await crawlArticle({
        id: article.id,
        slug: article.slug,
        title: article.title,
        sourceUrl: article.sourceUrl,
        coverImageUrl: article.coverImageUrl,
      })

      // Nếu content rỗng — chỉ update originalAuthor, giữ nguyên placeholder content
      if (result.isEmpty) {
        await prisma.news.update({
          where: { id: article.id },
          data: {
            originalAuthor: "Admin",
          },
        })
        console.log(`   ⚠️  Giữ nguyên placeholder content (trang cũ rỗng)`)
        skipped++
        failures.push({ slug: article.slug, error: "Trang cũ rỗng hoặc không có content" })
        continue
      }

      // Update DB
      const updateData: {
        content: string
        excerpt: string | null
        originalAuthor: string
        coverImageUrl?: string
      } = {
        content: result.contentHtml,
        excerpt: result.excerpt || null,
        originalAuthor: "Admin",
      }
      // Set coverImageUrl from first image only if not already set
      if (!article.coverImageUrl && result.firstImageUrl) {
        updateData.coverImageUrl = result.firstImageUrl
      }

      await prisma.news.update({
        where: { id: article.id },
        data: updateData,
      })

      console.log(`   ✅ DB updated`)
      crawled++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`   ❌ FAILED: ${msg}`)
      failures.push({ slug: article.slug, error: msg })
      failed++
    }
  }

  console.log("\n" + "═".repeat(70))
  console.log("KẾT QUẢ")
  console.log("═".repeat(70))
  console.log(`✅ Crawled: ${crawled}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed:  ${failed}`)
  if (failures.length > 0) {
    console.log("\nFailure details:")
    failures.forEach((f) => console.log(`  - ${f.slug}: ${f.error}`))
  }
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
