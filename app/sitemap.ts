import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { locales, defaultLocale, type Locale } from "@/i18n/config"
import { localizedUrl } from "@/lib/seo/site"

/** Build the per-locale alternates map for a given canonical path. */
function altLanguages(path: string): Record<string, string> {
  const langs: Record<string, string> = {}
  for (const loc of locales) {
    if (loc === defaultLocale) continue
    const tag = loc === "en" ? "en" : loc === "zh" ? "zh-CN" : "ar"
    langs[tag] = localizedUrl(path, loc as Locale)
  }
  return langs
}

function entry(
  path: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: localizedUrl(path, defaultLocale),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages: altLanguages(path) },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static routes. Legal pages (privacy, terms) live here because their
  // content is in the News table under category=LEGAL but their public
  // URLs are fixed, NOT /tin-tuc/{slug}.
  const staticRoutes: MetadataRoute.Sitemap = [
    entry("/", now, "daily", 1.0),
    entry("/gioi-thieu", now, "monthly", 0.7),
    entry("/ban-lanh-dao", now, "monthly", 0.7),
    entry("/tin-tuc", now, "daily", 0.9),
    entry("/nghien-cuu", now, "weekly", 0.7),
    entry("/hoi-vien", now, "weekly", 0.8),
    entry("/doanh-nghiep", now, "weekly", 0.8),
    entry("/san-pham-chung-nhan", now, "weekly", 0.9),
    entry("/dich-vu", now, "monthly", 0.7),
    entry("/lien-he", now, "monthly", 0.6),
    entry("/dieu-le", now, "yearly", 0.5),
    entry("/privacy", now, "yearly", 0.3),
    entry("/terms", now, "yearly", 0.3),
    entry("/feed", now, "hourly", 0.8),
  ]

  // Dynamic news articles — split by category so each row maps to the
  // correct public URL. Previously every row was emitted as /tin-tuc/{slug}
  // which 404'd for LEGAL + RESEARCH items.
  // No `take` limit: sitemap.xml caps at 50,000 URLs per file (Google spec).
  const newsItems = await prisma.news.findMany({
    where: { isPublished: true, category: { in: ["GENERAL", "RESEARCH"] } },
    select: { slug: true, updatedAt: true, category: true },
    orderBy: { publishedAt: "desc" },
  })
  const newsRoutes: MetadataRoute.Sitemap = newsItems.map((n) => {
    const path = `/${n.category === "RESEARCH" ? "nghien-cuu" : "tin-tuc"}/${n.slug}`
    return entry(path, n.updatedAt, "monthly", 0.7)
  })

  // Certified products
  const products = await prisma.product.findMany({
    where: { certStatus: "APPROVED", isPublished: true },
    select: { slug: true, updatedAt: true },
  })
  const productRoutes: MetadataRoute.Sitemap = products.map((p) =>
    entry(`/san-pham/${p.slug}`, p.updatedAt, "monthly", 0.8),
  )

  // Published companies
  const companies = await prisma.company.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  })
  const companyRoutes: MetadataRoute.Sitemap = companies.map((c) =>
    entry(`/doanh-nghiep/${c.slug}`, c.updatedAt, "weekly", 0.7),
  )

  return [...staticRoutes, ...newsRoutes, ...productRoutes, ...companyRoutes]
}
