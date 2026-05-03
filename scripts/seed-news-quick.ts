/**
 * Quick seed: tao 5 bai News (category=GENERAL, isPublished=true) tu
 * scripts/bang-tin-hoi-articles.json — KHONG upload Cloudinary.
 * Dung de demo / e2e test khi DB news con trong.
 *
 * Chay: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-news-quick.ts
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { prisma } from "../lib/prisma"

type JsonArticle = { title: string; author: string; date: string; thumbnail: string; link: string }

function slugFromUrl(url: string): string | null {
  const m = url.match(/\/([a-z0-9-]+)\.html?$/i)
  return m ? m[1].toLowerCase() : null
}
function parseDate(s: string): Date | null {
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!m) return null
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) throw new Error("Khong tim thay ADMIN user")

  const raw = readFileSync(resolve("scripts/bang-tin-hoi-articles.json"), "utf8").replace(/^\uFEFF/, "")
  const data: JsonArticle[] = JSON.parse(raw)
  const top = data.slice(0, 5)
  let created = 0
  let skipped = 0

  for (const a of top) {
    const slug = slugFromUrl(a.link)
    if (!slug) continue
    const existing = await prisma.news.findUnique({ where: { slug } })
    if (existing) { skipped++; continue }
    await prisma.news.create({
      data: {
        title: a.title,
        slug,
        excerpt: null,
        content: `<p>Noi dung dang duoc cap nhat tu nguon goc: <a href="${a.link}">${a.link}</a></p>`,
        coverImageUrl: a.thumbnail || null,
        category: "GENERAL",
        isPublished: true,
        isPinned: false,
        publishedAt: parseDate(a.date),
        authorId: admin.id,
        sourceUrl: a.link,
        originalAuthor: a.author,
      },
    })
    console.log(`✅ ${a.title} (${slug})`)
    created++
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
