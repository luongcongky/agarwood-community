import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoitramhuong.vn"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/ho-so", "/tong-quan", "/gia-han", "/thanh-toan/", "/chung-nhan/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
