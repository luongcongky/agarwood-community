"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

type PostAuthor = {
  id: string
  name: string
  avatarUrl: string | null
  role: string
  company: { name: string; slug: string } | null
}

type Post = {
  id: string
  authorId: string
  title: string | null
  content: string
  imageUrls: string[]
  status: string
  isPremium: boolean
  isPromoted: boolean
  authorPriority: number
  viewCount: number
  reportCount: number
  lockedAt: string | null
  lockedBy: string | null
  lockReason: string | null
  createdAt: string
  updatedAt: string
  author: PostAuthor
  reactions: { type: string }[]
  _count: { reactions: number }
}

type TopContributor = {
  id: string
  name: string
  avatarUrl: string | null
  contributionTotal: number
  company: { name: string } | null
}

type MembershipInfo = {
  expires: string | null
  contributionTotal: number
  displayPriority: number
}

type FeedClientProps = {
  initialPosts: Post[]
  currentUserId: string | null
  currentUserRole: string | null
  membershipInfo: MembershipInfo | null
  topContributors: TopContributor[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Vừa xong"
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString("vi-VN")
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatContribution(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`
  return String(amount)
}

// ─── Skeleton Card ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-brand-200 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-full bg-brand-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-brand-100 rounded w-32" />
          <div className="h-2.5 bg-brand-100 rounded w-20" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-brand-100 rounded w-full" />
        <div className="h-3 bg-brand-100 rounded w-5/6" />
        <div className="h-3 bg-brand-100 rounded w-4/6" />
      </div>
      <div className="flex gap-4 pt-3 border-t border-brand-100">
        <div className="h-7 bg-brand-100 rounded w-20" />
      </div>
    </div>
  )
}

// ─── Post Card ───────────────────────────────────────────────────────────────

type PostCardProps = {
  post: Post
  currentUserId: string | null
  currentUserRole: string | null
  onLike: (postId: string) => void
  onLock: (postId: string) => void
}

function PostCard({ post, currentUserId, currentUserRole, onLike, onLock }: PostCardProps) {
  const isLocked = post.status === "LOCKED"
  const userHasLiked = post.reactions.some((r) => r.type === "LIKE")
  const isAdmin = currentUserRole === "ADMIN"

  return (
    <article
      className={cn(
        "bg-white rounded-xl border border-brand-200 p-5 transition-opacity",
        isLocked && "opacity-60"
      )}
    >
      {/* Locked banner */}
      {isLocked && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          <svg
            className="size-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Bài viết đã bị tạm khoá
        </div>
      )}

      {/* Author row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar size="default">
            {post.author.avatarUrl ? (
              <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
            ) : null}
            <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand-900 text-sm leading-tight">
                {post.author.name}
              </span>
              {post.author.role === "VIP" && (
                <span className="text-[10px] font-semibold bg-brand-400 text-brand-900 rounded-full px-1.5 py-0.5 leading-none">
                  VIP
                </span>
              )}
            </div>
            {post.author.company && (
              <p className="text-xs text-brand-600 mt-0.5">{post.author.company.name}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLock(post.id)}
            className="text-xs"
          >
            {isLocked ? "Mở khoá" : "Khoá bài"}
          </Button>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h2 className="font-semibold text-brand-900 text-base mb-2 leading-snug">
          {post.title}
        </h2>
      )}

      {/* Content */}
      {!currentUserRole ? (
        <div className="relative mb-3">
          <div className="line-clamp-3 text-sm text-brand-800 whitespace-pre-wrap">
            {post.content.replace(/<[^>]*>/g, "")}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white flex items-end justify-center pb-2">
            <Link
              href="/login"
              className="bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-brand-800 transition-colors"
            >
              Đăng nhập để đọc đầy đủ
            </Link>
          </div>
        </div>
      ) : (
        <div
          className="text-sm text-brand-800 whitespace-pre-wrap mb-3 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}

      {/* First image */}
      {post.imageUrls.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrls[0]}
          alt="Post image"
          className="rounded-lg w-full object-cover max-h-80 mb-3"
        />
      )}

      {/* Reaction bar — disabled for locked posts */}
      {!isLocked && (
        <div className="flex items-center gap-4 pt-3 border-t border-brand-100">
          {currentUserRole && currentUserRole !== "GUEST" ? (
            <button
              onClick={() => onLike(post.id)}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors",
                userHasLiked
                  ? "bg-brand-100 text-brand-700"
                  : "text-muted-foreground hover:bg-brand-50 hover:text-brand-700"
              )}
              aria-label={userHasLiked ? "Bỏ thích" : "Thích"}
            >
              <svg
                className={cn("size-4", userHasLiked && "fill-brand-500")}
                fill={userHasLiked ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{post._count.reactions}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{post._count.reactions}</span>
            </span>
          )}
        </div>
      )}
    </article>
  )
}

// ─── Membership Card ─────────────────────────────────────────────────────────

function MembershipCard({ info }: { info: MembershipInfo }) {
  const expires = info.expires ? new Date(info.expires) : null
  const now = new Date()
  const daysLeft = expires
    ? Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / 86400000))
    : 0
  const isActive = expires ? expires > now : false

  return (
    <div className="bg-gradient-to-br from-brand-800 to-brand-700 text-white rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-200">Hội viên VIP</span>
        <span
          className={cn(
            "text-xs font-semibold rounded-full px-2 py-0.5",
            isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
          )}
        >
          {isActive ? "Đang hoạt động" : "Hết hạn"}
        </span>
      </div>
      {expires && (
        <div>
          <p className="text-xs text-brand-300">Hết hạn</p>
          <p className="text-sm font-medium">
            {expires.toLocaleDateString("vi-VN")}
            {isActive && (
              <span className="ml-2 text-brand-300 text-xs">({daysLeft} ngày còn lại)</span>
            )}
          </p>
        </div>
      )}
      <div className="flex gap-4 pt-2 border-t border-brand-600">
        <div>
          <p className="text-xs text-brand-300">Đóng góp tích lũy</p>
          <p className="text-sm font-semibold">
            {info.contributionTotal.toLocaleString("vi-VN")} ₫
          </p>
        </div>
        <div>
          <p className="text-xs text-brand-300">Mức ưu tiên</p>
          <p className="text-sm font-semibold">{info.displayPriority}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Client Component ───────────────────────────────────────────────────

export function FeedClient({
  initialPosts,
  currentUserId,
  currentUserRole,
  membershipInfo,
  topContributors,
}: FeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialPosts.length >= 20)
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts?page=${page}&skip=${posts.length}`)
      const data = await res.json()
      if (data.posts.length < 20) setHasMore(false)
      setPosts((prev) => [...prev, ...data.posts])
      setPage((prev) => prev + 1)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, posts.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    const el = observerRef.current
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  // Optimistic like handler
  async function handleLike(postId: string) {
    if (!currentUserId) return

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const alreadyLiked = p.reactions.some((r) => r.type === "LIKE")
        return {
          ...p,
          reactions: alreadyLiked ? [] : [{ type: "LIKE" }],
          _count: {
            ...p._count,
            reactions: alreadyLiked ? p._count.reactions - 1 : p._count.reactions + 1,
          },
        }
      })
    )

    try {
      await fetch(`/api/posts/${postId}/react`, { method: "POST" })
    } catch {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p
          const wasLiked = !p.reactions.some((r) => r.type === "LIKE")
          return {
            ...p,
            reactions: wasLiked ? [{ type: "LIKE" }] : [],
            _count: {
              ...p._count,
              reactions: wasLiked ? p._count.reactions + 1 : p._count.reactions - 1,
            },
          }
        })
      )
    }
  }

  // Lock handler
  async function handleLock(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/lock`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, status: data.status } : p
          )
        )
      }
    } catch {
      // silently fail
    }
  }

  const isLoggedIn = !!currentUserId
  const canPost = currentUserRole === "VIP" || currentUserRole === "ADMIN"

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Left: Post list ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Skeleton when loading initial */}
        {loading && posts.length === 0 && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {posts.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-brand-200 p-12 text-center">
            <p className="text-muted-foreground">Chưa có bài viết nào.</p>
          </div>
        )}

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onLike={handleLike}
            onLock={handleLock}
          />
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={observerRef} className="h-4" />

        {/* Loading more indicator */}
        {loading && posts.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="size-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Đã hiển thị tất cả bài viết
          </p>
        )}
      </div>

      {/* ── Right: Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-full lg:w-80 shrink-0 space-y-4">
        {/* Auth actions or membership card */}
        {!isLoggedIn ? (
          <div className="bg-white rounded-xl border border-brand-200 p-5 space-y-3">
            <h3 className="font-semibold text-brand-900 text-sm">Tham gia Hội Trầm Hương</h3>
            <p className="text-xs text-muted-foreground">
              Đăng nhập để đọc bài viết đầy đủ, tương tác với hội viên và nhận quyền lợi VIP.
            </p>
            <div className="space-y-2">
              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="flex w-full items-center justify-center rounded-lg border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
              >
                Đăng ký hội viên
              </Link>
            </div>
          </div>
        ) : (
          <>
            {membershipInfo && <MembershipCard info={membershipInfo} />}

            {canPost && (
              <Link
                href="/feed/tao-bai"
                className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-4 text-sm font-semibold text-brand-700 hover:bg-brand-100 hover:border-brand-400 transition-colors"
              >
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Tạo bài viết
              </Link>
            )}
          </>
        )}

        {/* Top contributors */}
        {topContributors.length > 0 && (
          <div className="bg-white rounded-xl border border-brand-200 p-5">
            <h3 className="font-semibold text-brand-900 text-sm mb-4">
              Hội viên tiêu biểu
            </h3>
            <ul className="space-y-3">
              {topContributors.map((contributor, idx) => (
                <li key={contributor.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-brand-400 w-4 text-center">
                    {idx + 1}
                  </span>
                  <Avatar size="sm">
                    {contributor.avatarUrl ? (
                      <AvatarImage src={contributor.avatarUrl} alt={contributor.name} />
                    ) : null}
                    <AvatarFallback>{getInitials(contributor.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-900 truncate">
                      {contributor.name}
                    </p>
                    {contributor.company && (
                      <p className="text-xs text-muted-foreground truncate">
                        {contributor.company.name}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-brand-600 shrink-0">
                    {formatContribution(contributor.contributionTotal)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}
