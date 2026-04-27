"use server"

import { prisma } from "@/lib/prisma"

/** Phase 3.5 (2026-04): /tin-bao-chi list — pattern song song với
 *  /nghien-cuu/actions.ts, lọc category=EXTERNAL_NEWS. */

export type ExternalNewsListItem = {
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
  items: ExternalNewsListItem[]
  hasMore: boolean
}

const EXTERNAL_NEWS_SELECT = {
  id: true,
  title: true, title_en: true, title_zh: true, title_ar: true,
  slug: true,
  excerpt: true, excerpt_en: true, excerpt_zh: true, excerpt_ar: true,
  coverImageUrl: true,
  isPinned: true,
  publishedAt: true,
} as const

export async function loadMoreExternalNews(params: {
  skip: number
  take: number
  q?: string
}): Promise<LoadMoreResult> {
  const where = {
    isPublished: true,
    category: "EXTERNAL_NEWS" as const,
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
    select: EXTERNAL_NEWS_SELECT,
  })
  const hasMore = items.length > params.take
  return {
    items: hasMore ? items.slice(0, params.take) : items,
    hasMore,
  }
}
