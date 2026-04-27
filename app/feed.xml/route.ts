import { prisma } from "@/lib/prisma"
import { BASE_URL, SITE_NAME, localizedUrl } from "@/lib/seo/site"

export const revalidate = 3600

/** Escape XML special chars — needed outside CDATA. */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** RFC 822 format cho <pubDate> + <lastBuildDate> (yêu cầu của RSS 2.0). */
function rfc822(d: Date): string {
  return d.toUTCString()
}

/**
 * GET /feed.xml — RSS 2.0 feed tiếng Việt, 20 bài mới nhất từ category
 * GENERAL + RESEARCH (bỏ qua LEGAL vì không phải news). Google News, Bing,
 * Feedly, NewsBlur đều parse được format này.
 *
 * Mutations ở /api/admin/news tự gọi `revalidatePath("/feed.xml")` nên feed
 * refresh ngay khi admin publish/edit. Fallback: regenerate mỗi giờ.
 */
export async function GET() {
  const items = await prisma.news.findMany({
    where: {
      isPublished: true,
      // Phase 3.5 (2026-04): include AGRICULTURE in RSS. EXTERNAL_NEWS bỏ
      // qua vì link gốc đã ở source — tránh duplicate trong feed reader.
      category: { in: ["GENERAL", "RESEARCH", "AGRICULTURE"] },
    },
    orderBy: [{ publishedAt: "desc" }],
    take: 20,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      category: true,
      publishedAt: true,
      updatedAt: true,
      originalAuthor: true,
    },
  })

  const now = new Date()
  const lastBuild =
    items[0]?.publishedAt ?? items[0]?.updatedAt ?? now

  const channelTitle = xmlEscape(SITE_NAME)
  const channelDesc = xmlEscape(
    "Tin tức, nghiên cứu và hoạt động của Hội Trầm Hương Việt Nam.",
  )
  const channelLink = BASE_URL
  const selfLink = `${BASE_URL}/feed.xml`

  const itemsXml = items
    .map((n) => {
      const prefix =
        n.category === "RESEARCH"
          ? "nghien-cuu"
          : n.category === "AGRICULTURE"
            ? "khuyen-nong"
            : "tin-tuc"
      const path = `/${prefix}/${n.slug}`
      const url = localizedUrl(path, "vi")
      const pubDate = rfc822(n.publishedAt ?? n.updatedAt ?? now)
      const author = n.originalAuthor
        ? `<author>${xmlEscape(n.originalAuthor)}</author>`
        : ""
      const enclosure = n.coverImageUrl
        ? `<enclosure url="${xmlEscape(n.coverImageUrl)}" type="image/jpeg" length="0" />`
        : ""
      const category =
        n.category === "RESEARCH"
          ? "Nghiên cứu"
          : n.category === "AGRICULTURE"
            ? "Khuyến nông"
            : "Tin tức"
      return [
        "    <item>",
        `      <title><![CDATA[${n.title}]]></title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <category>${xmlEscape(category)}</category>`,
        author ? `      ${author}` : null,
        n.excerpt
          ? `      <description><![CDATA[${n.excerpt}]]></description>`
          : null,
        enclosure ? `      ${enclosure}` : null,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${channelTitle}</title>
    <link>${channelLink}</link>
    <description>${channelDesc}</description>
    <language>vi-VN</language>
    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>
    <atom:link href="${xmlEscape(selfLink)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>
`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
