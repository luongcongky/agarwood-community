"use server"

import { prisma } from "@/lib/prisma"

export type ResearchListItem = {
  id: string
  title: string
  title_en: string | null
  title_zh: string | null
  title_ar: string | null
  slug: string
  excerpt: string | null
  excerpt_en: string | null
  excerpt_zh: string | null
  excerpt_ar: string | null
  coverImageUrl: string | null
  isPinned: boolean
  publishedAt: Date | null
}

export type LoadMoreResult = {
  items: ResearchListItem[]
  hasMore: boolean
}

const RESEARCH_SELECT = {
  id: true,
  title: true, title_en: true, title_zh: true, title_ar: true,
  slug: true,
  excerpt: true, excerpt_en: true, excerpt_zh: true, excerpt_ar: true,
  coverImageUrl: true,
  isPinned: true,
  publishedAt: true,
} as const

/**
 * Server action: lazy-load thêm danh sách bài nghiên cứu cho section "Mới nhất"
 * trên trang list. Cùng pattern với tin-tuc — skip/take + probe n+1 để check
 * hasMore (rẻ hơn COUNT riêng).
 */
export async function loadMoreResearch(params: {
  skip: number
  take: number
  q?: string
}): Promise<LoadMoreResult> {
  const where = {
    isPublished: true,
    category: "RESEARCH" as const,
    ...(params.q && {
      OR: [
        { title: { contains: params.q, mode: "insensitive" as const } },
        { excerpt: { contains: params.q, mode: "insensitive" as const } },
      ],
    }),
  }
  const items = await prisma.news.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    skip: params.skip,
    take: params.take + 1,
    select: RESEARCH_SELECT,
  })
  const hasMore = items.length > params.take
  return {
    items: hasMore ? items.slice(0, params.take) : items,
    hasMore,
  }
}
