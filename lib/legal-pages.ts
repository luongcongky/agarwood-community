import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

/** Slug cố định cho 2 trang pháp lý — admin sửa qua /admin/tin-tuc/[id]
 *  với category=LEGAL, không được đổi slug. */
export const LEGAL_SLUGS = {
  privacy: "chinh-sach-bao-mat",
  terms: "dieu-khoan-su-dung",
} as const

export type LegalKey = keyof typeof LEGAL_SLUGS

export type LegalPage = {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  updatedAt: Date
}

export const getLegalPage = (key: LegalKey) =>
  unstable_cache(
    async (): Promise<LegalPage | null> => {
      const slug = LEGAL_SLUGS[key]
      const row = await prisma.news.findFirst({
        where: { slug, category: "LEGAL", isPublished: true },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          excerpt: true,
          updatedAt: true,
        },
      })
      return row
    },
    [`legal_page_${key}`],
    { revalidate: 600, tags: ["legal-pages", `legal:${key}`] },
  )()
