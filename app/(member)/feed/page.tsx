import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTierThresholds } from "@/lib/tier"
import { FeedClient } from "./FeedClient"

export const revalidate = 60 // 1 min — feed updates are not real-time critical

export default async function FeedPage() {
  const session = await auth()
  const userId = session?.user?.id

  // Initial 20 posts — promoted first, then by authorPriority + createdAt
  const initialPosts = await prisma.post.findMany({
    where: { status: { in: ["PUBLISHED", "LOCKED"] } },
    orderBy: [
      { isPromoted: "desc" },
      { authorPriority: "desc" },
      { createdAt: "desc" },
    ],
    take: 20,
    select: {
      id: true,
      authorId: true,
      title: true,
      content: true,
      imageUrls: true,
      status: true,
      isPremium: true,
      isPromoted: true,
      authorPriority: true,
      viewCount: true,
      reportCount: true,
      lockedBy: true,
      lockReason: true,
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
      reactions: {
        where: { userId: userId ?? "none" },
        select: { type: true },
      },
      _count: { select: { reactions: true, comments: { where: { deletedAt: null } } } },
    },
  })

  const posts = initialPosts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    lockedAt: p.lockedAt?.toISOString() ?? null,
  }))

  // Sidebar data
  const [membershipInfo, topContributors] = await Promise.all([
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { membershipExpires: true, contributionTotal: true, displayPriority: true },
        })
      : null,
    prisma.user.findMany({
      where: { role: "VIP", isActive: true },
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
  ])

  const [bizTier, indTier] = await Promise.all([
    getTierThresholds("BUSINESS"),
    getTierThresholds("INDIVIDUAL"),
  ])

  return (
    <FeedClient
      initialPosts={posts}
      currentUserId={userId ?? null}
      currentUserRole={session?.user?.role ?? null}
      currentUserName={session?.user?.name ?? null}
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
            }
          : null
      }
      topContributors={topContributors}
    />
  )
}
