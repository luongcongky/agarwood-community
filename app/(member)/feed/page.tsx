import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FeedClient } from "./FeedClient"

export const revalidate = 0 // always fresh for feed

export default async function FeedPage() {
  const session = await auth()

  // Initial 20 posts
  const initialPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [
      { authorPriority: "desc" },
      { createdAt: "desc" },
    ],
    take: 20,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
          company: { select: { name: true, slug: true } },
        },
      },
      reactions: {
        where: { userId: session?.user?.id ?? "none" },
        select: { type: true },
      },
      _count: { select: { reactions: true } },
    },
  })

  // Serialize dates
  const posts = initialPosts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    lockedAt: p.lockedAt?.toISOString() ?? null,
  }))

  // Membership info for sidebar
  const membershipInfo = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { membershipExpires: true, contributionTotal: true, displayPriority: true },
      })
    : null

  // Top contributors for sidebar
  const topContributors = await prisma.user.findMany({
    where: { role: "VIP", isActive: true },
    orderBy: { contributionTotal: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      contributionTotal: true,
      company: { select: { name: true } },
    },
  })

  return (
    <FeedClient
      initialPosts={posts}
      currentUserId={session?.user?.id ?? null}
      currentUserRole={session?.user?.role ?? null}
      membershipInfo={
        membershipInfo
          ? {
              expires: membershipInfo.membershipExpires?.toISOString() ?? null,
              contributionTotal: membershipInfo.contributionTotal,
              displayPriority: membershipInfo.displayPriority,
            }
          : null
      }
      topContributors={topContributors.map((u) => ({
        ...u,
        contributionTotal: u.contributionTotal,
      }))}
    />
  )
}
