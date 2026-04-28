import { Suspense } from "react"
import { unstable_cache } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTierThresholds } from "@/lib/tier"
import { FeedClient } from "./FeedClient"
import { SidebarBanners, SidebarBannersSkeleton } from "./SidebarBanners"

/** Top contributors list — đồng nhất cho mọi viewer, cache 10 phút.
 *  Phase 3.7 round 4 (2026-04): mở rộng role filter sang INFINITE — trước
 *  đây strict "VIP" → hội viên cấp cao nhất bị ẩn khỏi sidebar feed dù
 *  contribution thường lớn nhất. */
const getTopContributors = unstable_cache(
  () =>
    prisma.user.findMany({
      where: { role: { in: ["VIP", "INFINITE"] }, isActive: true },
      orderBy: { contributionTotal: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        contributionTotal: true,
        accountType: true,
        company: { select: { name: true } },
      },
    }),
  ["feed_top_contributors"],
  { revalidate: 600, tags: ["feed", "users"] },
)

export const revalidate = 60 // 1 min — feed updates are not real-time critical

type FeedFilter = "NEWS" | "PRODUCT"

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const session = await auth()
  const userId = session?.user?.id
  // Homepage link qua `/feed?category=NEWS|PRODUCT` để mở đúng tab từ đầu.
  // Bất kỳ giá trị khác → fallback NEWS (khớp default filter client cũ).
  const { category: rawCategory } = await searchParams
  const initialFilter: FeedFilter = rawCategory === "PRODUCT" ? "PRODUCT" : "NEWS"

  // Initial 10 posts — promoted first, then by authorPriority + createdAt.
  // Smaller initial page = faster TTFB; cursor pagination loads 10 more on scroll.
  //
  // Moderation visibility rules:
  //  - PUBLISHED → visible to all
  //  - LOCKED + moderationNote=null → auto-lock tu 5+ reports → visible to all
  //    (show banner "Bai da bi tam khoa")
  //  - LOCKED + moderationNote!=null → admin REJECTED trong moderation → CHI
  //    owner thay (voi banner do + ly do). Hien cho public se trai tinh than
  //    moderation (bai xau khong nen lo ra cho moi nguoi).
  //  - PENDING → CHI owner thay (banner vang "Cho duyet")
  // Initial render khớp với filter = initialFilter (default NEWS, hoặc
  // PRODUCT nếu vào từ section "Sản phẩm hội viên" trên trang chủ).
  const initialPosts = await prisma.post.findMany({
    where: userId
      ? {
          category: initialFilter,
          OR: [
            { status: "PUBLISHED" },
            { status: "LOCKED", moderationNote: null },
            { status: "PENDING", authorId: userId },
            { status: "LOCKED", moderationNote: { not: null }, authorId: userId },
          ],
        }
      : {
          category: initialFilter,
          OR: [
            { status: "PUBLISHED" },
            { status: "LOCKED", moderationNote: null },
          ],
        },
    orderBy: [
      { isPromoted: "desc" },
      { authorPriority: "desc" },
      { createdAt: "desc" },
    ],
    take: 10,
    select: {
      id: true,
      authorId: true,
      title: true,
      content: true,
      imageUrls: true,
      status: true,
      category: true,
      isPremium: true,
      isPromoted: true,
      authorPriority: true,
      viewCount: true,
      reportCount: true,
      lockedBy: true,
      lockReason: true,
      moderationNote: true,
      createdAt: true,
      updatedAt: true,
      lockedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
          accountType: true,
          contributionTotal: true,
          company: { select: { name: true, slug: true } },
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          priceRange: true,
          category: true,
          badgeUrl: true,
          certStatus: true,
        },
      },
      reactions: {
        where: { userId: userId ?? "none" },
        select: { type: true },
      },
      // Latest promotion request — cùng logic như /api/posts route.
      promotionRequests: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { status: true, reviewNote: true },
      },
      _count: { select: { reactions: true, comments: { where: { deletedAt: null } } } },
    },
  })

  const posts = initialPosts.map((p) => {
    const { promotionRequests, ...rest } = p
    return {
      ...rest,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      lockedAt: p.lockedAt?.toISOString() ?? null,
      latestPromotionRequest:
        userId && p.authorId === userId
          ? (promotionRequests[0] ?? null)
          : null,
    }
  })

  // Sidebar data — membershipInfo per-user (không cache được); topContributors
  // dùng cache 10 phút chung cho mọi viewer.
  const [membershipInfo, topContributors] = await Promise.all([
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { membershipExpires: true, contributionTotal: true, displayPriority: true, accountType: true, company: { select: { name: true, slug: true } } },
        })
      : null,
    getTopContributors(),
  ])

  const [bizTier, indTier] = await Promise.all([
    getTierThresholds("BUSINESS"),
    getTierThresholds("INDIVIDUAL"),
  ])

  return (
    <FeedClient
      initialPosts={posts}
      initialFilter={initialFilter}
      currentUserId={userId ?? null}
      currentUserRole={session?.user?.role ?? null}
      currentUserName={session?.user?.name ?? null}
      currentUserAvatarUrl={session?.user?.image ?? null}
      tierSilver={bizTier.silver}
      tierGold={bizTier.gold}
      tierIndSilver={indTier.silver}
      tierIndGold={indTier.gold}
      membershipInfo={
        membershipInfo
          ? {
              expires: membershipInfo.membershipExpires?.toISOString() ?? null,
              contributionTotal: membershipInfo.contributionTotal,
              displayPriority: membershipInfo.displayPriority,
              accountType: membershipInfo.accountType,
              company: membershipInfo.company,
            }
          : null
      }
      topContributors={topContributors}
      sidebarBannersSlot={
        <Suspense key="sidebar-banners" fallback={<SidebarBannersSkeleton key="sidebar-banners-fallback" />}>
          <SidebarBanners key="sidebar-banners-content" />
        </Suspense>
      }
    />
  )
}
