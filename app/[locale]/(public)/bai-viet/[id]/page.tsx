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
      moderationNote: true,
      category: true,
      newsCategories: true,
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
      // Phase 4 (2026-04-29): cần product cho menu admin "Đưa vào Sản phẩm
      // tiêu biểu" trên trang detail (đồng bộ với feed list).
      product: { select: { id: true, isFeatured: true } },
      // Latest promotion request — author dùng menu "Xin đẩy lên trang chủ"
      // / "Rút yêu cầu". Chỉ cần status để compute canRequest/hasPending.
      promotionRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, reviewNote: true },
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

  // Moderation guard: PENDING (cho duyet) + LOCKED co moderationNote (admin
  // reject) chi owner/admin truy cap duoc. LOCKED no-note (auto-lock tu
  // report) van public — hien banner "bai bi tam khoa" cho nguoi doc biet.
  const isAdminViewer = session?.user?.role === "ADMIN"
  const isOwner = post.authorId === userId
  const isOwnerOrAdmin = isOwner || isAdminViewer
  const isModerationHidden =
    post.status === "PENDING" ||
    (post.status === "LOCKED" && !!post.moderationNote)
  if (isModerationHidden && !isOwnerOrAdmin) {
    notFound()
  }

  // Phase 3.6 (2026-04): khi owner xem bài của mình, hiện banner nếu admin
  // đã sửa SAU bản cuối owner (latestAdmin.editedAt > latestOwner.editedAt
  // hoặc latestOwner null + latestAdmin tồn tại).
  let adminEditedAfterOwner = false
  if (isOwner) {
    const [lastAdmin, lastOwner] = await Promise.all([
      prisma.postRevision.findFirst({
        where: { postId: id, editedRole: "ADMIN" },
        orderBy: { version: "desc" },
        select: { editedAt: true },
      }),
      prisma.postRevision.findFirst({
        where: { postId: id, editedRole: "OWNER" },
        orderBy: { version: "desc" },
        select: { editedAt: true },
      }),
    ])
    adminEditedAfterOwner = !!(
      lastAdmin && (!lastOwner || lastAdmin.editedAt > lastOwner.editedAt)
    )
  }

  // Increment view count (fire-and-forget)
  prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  return (
    <PostDetailClient
      post={{
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        reactions: Array.isArray(post.reactions) ? post.reactions : [],
        latestPromotionRequest: post.promotionRequests[0] ?? null,
      }}
      currentUserId={userId ?? null}
      currentUserRole={session?.user?.role ?? null}
      currentUserName={session?.user?.name ?? null}
      currentUserAvatar={session?.user?.image ?? null}
      adminEditedAfterOwner={adminEditedAfterOwner}
    />
  )
}
