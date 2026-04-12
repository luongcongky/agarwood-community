"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import DOMPurify from "isomorphic-dompurify"
import Image from "next/image"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

type PostAuthor = {
  id: string
  name: string
  avatarUrl: string | null
  role: string
  accountType: string
  contributionTotal: number
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
  _count: { reactions: number; comments: number }
}

type TopContributor = {
  id: string
  name: string
  avatarUrl: string | null
  contributionTotal: number
  accountType: string
  company: { name: string } | null
}

type MembershipInfo = { expires: string | null; contributionTotal: number; displayPriority: number }

type FeedClientProps = {
  initialPosts: Post[]
  currentUserId: string | null
  currentUserRole: string | null
  currentUserName: string | null
  membershipInfo: MembershipInfo | null
  tierSilver?: number
  tierGold?: number
  tierIndSilver?: number
  tierIndGold?: number
  topContributors: TopContributor[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string, now: number): string {
  if (now === 0) return "" // Return empty during SSR/hydration to avoid mismatch
  const diffMs = now - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Vừa xong"
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return new Date(dateStr).toLocaleDateString("vi-VN")
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
}

function getTierBadge(
  contribution: number,
  accountType: string,
  bizSilver: number = 10_000_000,
  bizGold: number = 20_000_000,
  indSilver: number = 3_000_000,
  indGold: number = 5_000_000,
) {
  const silverT = accountType === "INDIVIDUAL" ? indSilver : bizSilver
  const goldT = accountType === "INDIVIDUAL" ? indGold : bizGold
  if (contribution >= goldT) return { label: "★★★", cls: "bg-yellow-400 text-yellow-900" }
  if (contribution >= silverT) return { label: "★★", cls: "bg-brand-300 text-brand-900" }
  return { label: "★", cls: "bg-brand-200 text-brand-800" }
}

const GUEST_VISIBLE_COUNT = 3

// ── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUserId,
  currentUserRole,
  index,
  isMounted,
  now,
  onReact,
  onLock,
  onDelete,
  tierSilver,
  tierGold,
  tierIndSilver,
  tierIndGold,
}: {
  post: Post
  currentUserId: string | null
  currentUserRole: string | null
  index: number
  onReact: (id: string) => void
  onLock: (id: string) => void
  onDelete: (id: string) => void
  tierSilver?: number
  tierGold?: number
  tierIndSilver?: number
  tierIndGold?: number
  isMounted: boolean
  now: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isLocked = post.status === "LOCKED"
  const userHasReacted = post.reactions.some((r) => r.type === "LIKE")
  const isAuthor = currentUserId === post.authorId
  const isAdmin = currentUserRole === "ADMIN"
  const isGuest = !currentUserRole || currentUserRole === "GUEST"
  // On server, always assume blurred for safety and to match initial client render
  const isGuestBlurred = (!isMounted || isGuest) && index >= GUEST_VISIBLE_COUNT

  const tier = getTierBadge(post.author.contributionTotal, post.author.accountType, tierSilver, tierGold, tierIndSilver, tierIndGold)

  // Strip HTML for truncation
  const plainText = post.content.replace(/<[^>]*>/g, "")
  const needsTruncation = plainText.length > 300

  // Menu options based on role
  const menuItems: { label: string; action: () => void; destructive?: boolean }[] = []
  if (isAuthor) {
    menuItems.push({ label: "Chỉnh sửa", action: () => { window.location.href = `/feed/tao-bai?edit=${post.id}` } })
    menuItems.push({ label: "Xoá bài", action: () => onDelete(post.id), destructive: true })
  }
  if (isAdmin) {
    menuItems.push({ label: isLocked ? "Mở khoá" : "Khoá bài", action: () => onLock(post.id) })
    if (!isAuthor) menuItems.push({ label: "Xoá bài", action: () => onDelete(post.id), destructive: true })
  }
  if (currentUserRole && currentUserRole !== "GUEST" && !isAuthor) {
    menuItems.push({ label: "Báo cáo bài viết", action: () => handleReport(post.id) })
  }

  async function handleReport(postId: string) {
    const reason = window.prompt("Lý do báo cáo:")
    if (!reason) return
    try {
      await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      alert("Đã gửi báo cáo. Admin sẽ xem xét.")
    } catch {
      alert("Có lỗi xảy ra.")
    }
    setMenuOpen(false)
  }

  return (
    <article className={cn("bg-white rounded-xl border border-brand-200 p-5 transition-opacity", isLocked && "opacity-60")}>
      {/* Locked banner */}
      {isLocked && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          Bài viết đã bị tạm khoá
          {post.lockReason && <span className="text-xs text-amber-600">— {post.lockReason}</span>}
        </div>
      )}

      {/* Author row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center shrink-0 overflow-hidden">
            {post.author.avatarUrl ? (
              <Image src={post.author.avatarUrl} alt="" fill className="object-cover" sizes="40px" />
            ) : (
              <span className="text-sm font-bold text-brand-700">{getInitials(post.author.name)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand-900 text-sm">{post.author.name}</span>
              {post.author.company ? (
                <span className="text-sm text-brand-500">· {post.author.company.name}</span>
              ) : post.author.accountType === "INDIVIDUAL" ? (
                <span className="text-sm text-brand-500">· Chuyên gia</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none", tier.cls)}>
                {tier.label}
              </span>
              <span className="text-xs text-brand-400" suppressHydrationWarning>
                {timeAgo(post.createdAt, now)}
              </span>
            </div>
          </div>
        </div>

        {/* 3-dot menu */}
        {menuItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-brand-400 hover:text-brand-700 p-2.5 -m-1.5 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              ···
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white rounded-lg border border-brand-200 shadow-lg py-1 min-w-[160px]">
                  {menuItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { item.action(); setMenuOpen(false) }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-brand-50 transition-colors",
                        item.destructive ? "text-red-600" : "text-brand-700",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Promoted badge */}
      {post.isPromoted && (
        <span className="inline-flex text-xs font-medium bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full mb-2">Ghim bởi admin</span>
      )}

      {/* Title — clickable to detail */}
      {post.title && (
        <h2 className="font-semibold text-brand-900 text-base mb-2 leading-snug">
          <Link href={`/bai-viet/${post.id}`} className="hover:text-brand-700 transition-colors">
            {post.title}
          </Link>
        </h2>
      )}

      {/* Content — blurred for guests after GUEST_VISIBLE_COUNT */}
      {isGuestBlurred ? (
        <div className="relative mb-3" suppressHydrationWarning>
          <div className="line-clamp-3 text-sm text-brand-800 blur-sm select-none">{plainText}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              href="/login"
              className="bg-brand-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-brand-800 transition-colors shadow"
            >
              Đăng nhập để đọc
            </Link>
          </div>
        </div>
      ) : isLocked && !isAdmin ? (
        <p className="text-sm text-brand-400 italic mb-3">Nội dung đã bị ẩn do vi phạm quy định.</p>
      ) : (
        <div className="mb-3" suppressHydrationWarning>
          <div
            className={cn(
              "text-sm text-brand-800 prose prose-sm max-w-none",
              !expanded && needsTruncation && "line-clamp-4",
            )}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />
          {needsTruncation && !expanded && (
            <button onClick={() => setExpanded(true)} className="text-sm font-medium text-brand-600 hover:text-brand-800 mt-1">
              Xem thêm
            </button>
          )}
        </div>
      )}

      {/* Images — up to 4 in grid */}
      {!isGuestBlurred && post.imageUrls.length > 0 && (
        <div className={cn(
          "mb-3 gap-1 rounded-lg overflow-hidden",
          post.imageUrls.length === 1 ? "" : "grid grid-cols-2",
        )}>
          {(post.imageUrls as string[]).slice(0, 4).map((url, i) => (
            <Image key={i} src={url} alt="" width={600} height={400} className="w-full object-cover max-h-64 rounded-lg" sizes="(max-width: 768px) 100vw, 600px" />
          ))}
        </div>
      )}

      {/* Stats + reaction bar */}
      {!isLocked && !isGuestBlurred && (
        <div className="flex items-center justify-between pt-3 border-t border-brand-200">
          <div className="flex items-center gap-4">
            {currentUserRole && currentUserRole !== "GUEST" ? (
              <button
                onClick={() => onReact(post.id)}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors",
                  userHasReacted ? "bg-brand-100 text-brand-700" : "text-brand-400 hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {userHasReacted ? "✓" : "○"} Hữu ích ({post._count.reactions})
              </button>
            ) : (
              <span className="text-sm text-brand-400">Hữu ích ({post._count.reactions})</span>
            )}
            <Link
              href={`/bai-viet/${post.id}`}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-700 rounded-lg px-3 py-1.5 hover:bg-brand-50 transition-colors"
            >
              💬 {post._count.comments > 0 ? post._count.comments : ""} Bình luận
            </Link>
          </div>
          <span className="text-sm text-brand-500">{post.viewCount} lượt xem</span>
        </div>
      )}
    </article>
  )
}

// ── Membership Card ──────────────────────────────────────────────────────────

function MembershipCard({ info, now }: { info: MembershipInfo; now: number }) {
  const expires = info.expires ? new Date(info.expires) : null
  const daysLeft = expires && now ? Math.max(0, Math.ceil((expires.getTime() - now) / 86400000)) : 0
  const isActive = expires && now ? expires.getTime() > now : false

  return (
    <div className="bg-linear-to-br from-brand-800 to-brand-700 text-white rounded-xl p-4 space-y-3" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-200">Hội viên VIP</span>
        <span className={cn("text-xs font-semibold rounded-full px-2 py-0.5", isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}>
          {isActive ? "Đang hoạt động" : "Hết hạn"}
        </span>
      </div>
      {expires && (
        <div>
          <p className="text-xs text-brand-300">Hết hạn</p>
          <p className="text-sm font-medium">
            {expires.toLocaleDateString("vi-VN")}
            {isActive && <span className="ml-2 text-brand-300 text-xs">({daysLeft} ngày)</span>}
          </p>
        </div>
      )}
      <div className="flex gap-4 pt-2 border-t border-brand-600">
        <div>
          <p className="text-xs text-brand-300">Đóng góp</p>
          <p className="text-sm font-semibold">{info.contributionTotal.toLocaleString("vi-VN")} ₫</p>
        </div>
        <div>
          <p className="text-xs text-brand-300">Ưu tiên</p>
          <p className="text-sm font-semibold">{info.displayPriority}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function FeedClient({
  initialPosts,
  currentUserId,
  currentUserRole,
  currentUserName,
  membershipInfo,
  topContributors,
  tierSilver,
  tierGold,
  tierIndSilver,
  tierIndGold,
}: FeedClientProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [now, setNow] = useState(0)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [hasMore, setHasMore] = useState(initialPosts.length >= 20)

  useEffect(() => {
    setNow(Date.now())
    setIsMounted(true)
  }, [])
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<string | null>(initialPosts.at(-1)?.id ?? null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursorRef.current) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts?cursor=${cursorRef.current}`)
      const data = await res.json()
      if (data.posts.length < 20) setHasMore(false)
      setPosts((prev) => [...prev, ...data.posts])
      cursorRef.current = data.posts.at(-1)?.id ?? null
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loading) loadMore() },
      { threshold: 0.1 },
    )
    const el = observerRef.current
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  // Optimistic react
  async function handleReact(postId: string) {
    if (!currentUserId) return
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const liked = p.reactions.some((r) => r.type === "LIKE")
        return {
          ...p,
          reactions: liked ? [] : [{ type: "LIKE" }],
          _count: { ...p._count, reactions: liked ? p._count.reactions - 1 : p._count.reactions + 1 },
        }
      }),
    )
    try {
      await fetch(`/api/posts/${postId}/react`, { method: "POST" })
    } catch {
      // Revert
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p
          const wasLiked = !p.reactions.some((r) => r.type === "LIKE")
          return {
            ...p,
            reactions: wasLiked ? [{ type: "LIKE" }] : [],
            _count: { ...p._count, reactions: wasLiked ? p._count.reactions + 1 : p._count.reactions - 1 },
          }
        }),
      )
    }
  }

  async function handleLock(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/lock`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: data.status } : p)))
      }
    } catch { /* */ }
  }

  async function handleDelete(postId: string) {
    if (!window.confirm("Xoá bài viết này?")) return
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
      }
    } catch { /* */ }
  }

  const isLoggedIn = !!currentUserId
  const isMember = currentUserRole === "VIP" || currentUserRole === "ADMIN"
  const canPost = isMember

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Feed column ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Quick post box */}
        {canPost && (
          <Link
            href="/feed/tao-bai"
            className="flex items-center gap-3 bg-white rounded-xl border border-brand-200 p-4 hover:bg-brand-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-brand-700">{currentUserName?.[0]?.toUpperCase() ?? "?"}</span>
            </div>
            <span className="text-sm text-brand-500 flex-1">
              Chia sẻ kiến thức, kinh nghiệm hoặc thông tin thị trường trầm hương...
            </span>
          </Link>
        )}

        {/* Posts */}
        {posts.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-brand-200 p-12 text-center space-y-2">
            <p className="text-brand-500">Chưa có bài viết nào.</p>
            {canPost && (
              <Link href="/feed/tao-bai" className="text-sm text-brand-600 hover:text-brand-800 underline">
                Hãy là người đầu tiên đăng bài!
              </Link>
            )}
          </div>
        )}

        {posts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            index={i}
            onReact={handleReact}
            onLock={handleLock}
            onDelete={handleDelete}
            tierSilver={tierSilver}
            tierGold={tierGold}
            tierIndSilver={tierIndSilver}
            tierIndGold={tierIndGold}
            isMounted={isMounted}
            now={now}
          />
        ))}

        <div ref={observerRef} className="h-4" />
        {loading && posts.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-sm text-brand-400 py-4">Đã hiển thị tất cả bài viết</p>
        )}
      </div>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-80 shrink-0 space-y-4 hidden lg:block">
        {!isMember ? (
          <div className="bg-white rounded-xl border border-brand-200 p-5 space-y-3">
            <h3 className="font-semibold text-brand-900 text-sm">Tham gia Hội Trầm Hương</h3>
            <p className="text-xs text-brand-400">
              {isLoggedIn
                ? "Tài khoản đang chờ duyệt. Bạn sẽ nhận email khi được phê duyệt."
                : "Đăng nhập để tương tác, đăng bài và nhận quyền lợi VIP."}
            </p>
            {!isLoggedIn && (
              <Link href="/login" className="flex w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors">
                Đăng nhập
              </Link>
            )}
          </div>
        ) : (
          <>
            {membershipInfo && <MembershipCard info={membershipInfo} now={now} />}
            {canPost && (
              <Link
                href="/feed/tao-bai"
                className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-4 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
              >
                + Tạo bài viết
              </Link>
            )}
          </>
        )}

        {topContributors.length > 0 && (
          <div className="bg-white rounded-xl border border-brand-200 p-5">
            <h3 className="font-semibold text-brand-900 text-sm mb-4">Hội viên tiêu biểu</h3>
            <ul className="space-y-3">
              {topContributors.map((c, i) => {
                const t = getTierBadge(c.contributionTotal, c.accountType, tierSilver, tierGold, tierIndSilver, tierIndGold)
                return (
                  <li key={c.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-brand-400 w-4 text-center">{i + 1}</span>
                    <div className="relative w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {c.avatarUrl ? (
                        <Image src={c.avatarUrl} alt="" fill className="object-cover" sizes="32px" />
                      ) : (
                        <span className="text-xs font-bold text-brand-700">{getInitials(c.name)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-900 truncate">{c.name}</p>
                      {c.company && <p className="text-xs text-brand-400 truncate">{c.company.name}</p>}
                    </div>
                    <span className={cn("text-[10px] font-bold rounded-full px-1.5 py-0.5", t.cls)}>{t.label}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}
