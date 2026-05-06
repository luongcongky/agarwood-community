import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { locales, defaultLocale, type Locale } from "@/i18n/config"
import { localizedUrl } from "@/lib/seo/site"

/** Regenerate hourly as a safety net — news mutations also
 *  `revalidatePath("/sitemap.xml")` for instant refresh. */
export const revalidate = 3600

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
  //
  // V2 redesign bổ sung `/phap-ly` (hub văn bản pháp lý, có trong submenu
  // "Giới thiệu" của CategoryBar mới) + mở các surface `san-pham-tieu-bieu`,
  // `san-pham-doanh-nghiep`, `multimedia` (đã có từ trước nhưng chưa index).
  const staticRoutes: MetadataRoute.Sitemap = [
    entry("/", now, "daily", 1.0),
    entry("/gioi-thieu-v2", now, "monthly", 0.7),
    entry("/ban-lanh-dao", now, "monthly", 0.7),
    entry("/tin-tuc", now, "daily", 0.9),
    entry("/nghien-cuu", now, "weekly", 0.7),
    // Phase 3.5 (2026-04): 2 route mới
    entry("/tin-bao-chi", now, "daily", 0.7),
    entry("/khuyen-nong", now, "weekly", 0.7),
    entry("/hoi-vien", now, "weekly", 0.8),
    entry("/doanh-nghiep", now, "weekly", 0.8),
    entry("/san-pham-chung-nhan", now, "weekly", 0.9),
    entry("/san-pham-tieu-bieu", now, "weekly", 0.8),
    entry("/san-pham-doanh-nghiep", now, "weekly", 0.8),
    entry("/multimedia", now, "weekly", 0.7),
    entry("/phap-ly", now, "monthly", 0.6),
    entry("/dich-vu", now, "monthly", 0.7),
    entry("/lien-he", now, "monthly", 0.6),
    entry("/dieu-le", now, "yearly", 0.5),
    entry("/privacy", now, "yearly", 0.3),
    entry("/terms", now, "yearly", 0.3),
    entry("/feed", now, "hourly", 0.8),
  ]

  // Chạy song song — 4 query độc lập, tiết kiệm ~3× RTT so với await tuần tự.
  // No `take` limit: sitemap.xml caps at 50,000 URLs per file (Google spec).
  const [newsItems, products, companies, posts, multimediaItems] = await Promise.all([
    prisma.news.findMany({
      where: {
        isPublished: true,
        // Phase 3.3 + 3.5 (2026-04): include all routable categories.
        // BUSINESS + PRODUCT + GENERAL + SPONSORED_PRODUCT → /tin-tuc.
        // RESEARCH → /nghien-cuu. EXTERNAL_NEWS → /tin-bao-chi.
        // AGRICULTURE → /khuyen-nong.
        // Phase 3.7 round 4 (2026-04): chỉ NORMAL emit ở các route trên.
        // PHOTO/VIDEO sẽ emit ở /multimedia/{slug} (query riêng bên dưới).
        template: "NORMAL",
        category: {
          in: [
            "GENERAL",
            "RESEARCH",
            "SPONSORED_PRODUCT",
            "BUSINESS",
            "PRODUCT",
            "EXTERNAL_NEWS",
            "AGRICULTURE",
          ],
        },
      },
      select: { slug: true, updatedAt: true, category: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.product.findMany({
      where: { certStatus: "APPROVED", isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.company.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    // V2: homepage (PostsSection + MemberRail) link trực tiếp sang
    // `/bai-viet/{id}` thay vì `/feed?post=`. Emit PUBLISHED posts để Google
    // có tín hiệu lastmod/hreflang thay vì chỉ crawl nhờ internal link.
    // Skip PENDING (chờ duyệt), DELETED, và LOCKED-with-moderationNote
    // (admin reject — chỉ owner thấy). LOCKED no-note (auto-lock từ
    // report) vẫn public nhưng bỏ khỏi sitemap cho an toàn — admin có thể
    // unlock bất kỳ lúc nào.
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    }),
    // Multimedia (video + photo collection) — Phase 3.7 round 4 (2026-04):
    // đọc từ News template=PHOTO/VIDEO. `slug` unique + page có route
    // `/multimedia/[slug]` → index được.
    prisma.news.findMany({
      where: { isPublished: true, template: { in: ["PHOTO", "VIDEO"] } },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
  ])

  // Dynamic news articles — split by category so each row maps to the
  // correct public URL. Previously every row was emitted as /tin-tuc/{slug}
  // which 404'd for LEGAL + RESEARCH items.
  // Phase 3.5 (2026-04): EXTERNAL_NEWS → /tin-bao-chi, AGRICULTURE → /khuyen-nong.
  const newsRoutes: MetadataRoute.Sitemap = newsItems.map((n) => {
    const prefix =
      n.category === "RESEARCH"
        ? "nghien-cuu"
        : n.category === "EXTERNAL_NEWS"
          ? "tin-bao-chi"
          : n.category === "AGRICULTURE"
            ? "khuyen-nong"
            : "tin-tuc"
    return entry(`/${prefix}/${n.slug}`, n.updatedAt, "monthly", 0.7)
  })

  const productRoutes: MetadataRoute.Sitemap = products.map((p) =>
    entry(`/san-pham/${p.slug}`, p.updatedAt, "monthly", 0.8),
  )

  const companyRoutes: MetadataRoute.Sitemap = companies.map((c) =>
    entry(`/doanh-nghiep/${c.slug}`, c.updatedAt, "weekly", 0.7),
  )

  // Posts là user-generated nên priority thấp hơn news toà soạn (0.5 vs 0.7).
  const postRoutes: MetadataRoute.Sitemap = posts.map((p) =>
    entry(`/bai-viet/${p.id}`, p.updatedAt, "monthly", 0.5),
  )

  const multimediaRoutes: MetadataRoute.Sitemap = multimediaItems.map((m) =>
    entry(`/multimedia/${m.slug}`, m.updatedAt, "monthly", 0.6),
  )

  return [
    ...staticRoutes,
    ...newsRoutes,
    ...productRoutes,
    ...companyRoutes,
    ...postRoutes,
    ...multimediaRoutes,
  ]
}
