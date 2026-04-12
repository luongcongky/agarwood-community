import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hoitramhuong.vn"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/gioi-thieu`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/ban-lanh-dao`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/tin-tuc`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/hoi-vien`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/doanh-nghiep`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/san-pham-chung-nhan`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/dich-vu`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/lien-he`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/dieu-le`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/feed`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
  ]

  // Dynamic news articles
  const newsItems = await prisma.news.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  })
  const newsRoutes: MetadataRoute.Sitemap = newsItems.map((n) => ({
    url: `${BASE_URL}/tin-tuc/${n.slug}`,
    lastModified: n.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  // Certified products
  const products = await prisma.product.findMany({
    where: { certStatus: "APPROVED", isPublished: true },
    select: { slug: true, updatedAt: true },
  })
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/san-pham/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  // Published companies
  const companies = await prisma.company.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  })
  const companyRoutes: MetadataRoute.Sitemap = companies.map((c) => ({
    url: `${BASE_URL}/doanh-nghiep/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticRoutes, ...newsRoutes, ...productRoutes, ...companyRoutes]
}
