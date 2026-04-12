import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PostDetailClient } from "./PostDetailClient"

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      title: true,
      content: true,
      imageUrls: true,
      status: true,
      isPremium: true,
      isPromoted: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
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
      reactions: userId
        ? { where: { userId }, select: { type: true } }
        : false,
      _count: {
        select: {
          reactions: true,
          comments: { where: { deletedAt: null } },
        },
      },
    },
  })

  if (!post || post.status === "DELETED") notFound()

  // Increment view count (fire-and-forget)
  prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  return (
    <PostDetailClient
      post={{
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        reactions: Array.isArray(post.reactions) ? post.reactions : [],
      }}
      currentUserId={userId ?? null}
      currentUserRole={session?.user?.role ?? null}
      currentUserName={session?.user?.name ?? null}
      currentUserAvatar={session?.user?.image ?? null}
    />
  )
}
