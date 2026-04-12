"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────────

type Author = {
  id: string
  name: string
  avatarUrl: string | null
  role: string
  accountType: string
  contributionTotal: number
  company: { name: string; slug: string } | null
}

type PostData = {
  id: string
  authorId: string
  title: string | null
  content: string
  imageUrls: string[]
  status: string
  isPremium: boolean
  isPromoted: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  author: Author
  reactions: { type: string }[]
  _count: { reactions: number; comments: number }
}

type CommentData = {
  id: string
  content: string
  parentId: string | null
  createdAt: string
  updatedAt: string
  author: { id: string; name: string; avatarUrl: string | null; role: string }
  likeCount: number
  replyCount: number
  isLiked: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
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
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
}

// ── Component ────────────────────────────────────────────────────────────────

export function PostDetailClient({
  post,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
}: {
  post: PostData
  currentUserId: string | null
  currentUserRole: string | null
  currentUserName: string | null
  currentUserAvatar: string | null
}) {
  const [isMounted, setIsMounted] = useState(false)
  const [reactionCount, setReactionCount] = useState(post._count.reactions)
  const [hasReacted, setHasReacted] = useState(post.reactions.some((r) => r.type === "LIKE"))
  const [comments, setComments] = useState<CommentData[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => setIsMounted(true), [])

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${post.id}`)
      const data = await res.json()
      setComments(data.comments ?? [])
    } finally {
      setLoadingComments(false)
    }
  }, [post.id])

  useEffect(() => { loadComments() }, [loadComments])

  async function handleReact() {
    if (!currentUserId) return
    setHasReacted((v) => !v)
    setReactionCount((v) => (hasReacted ? v - 1 : v + 1))
    try {
      await fetch(`/api/posts/${post.id}/react`, { method: "POST" })
    } catch {
      setHasReacted((v) => !v)
      setReactionCount((v) => (hasReacted ? v + 1 : v - 1))
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
          postId: post.id,
          parentId: replyTo?.id || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments((prev) => [...prev, data.comment])
        setNewComment("")
        setReplyTo(null)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLikeComment(commentId: string) {
    if (!currentUserId) return
    // Optimistic
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 }
          : c,
      ),
    )
    try {
      await fetch(`/api/comments/${commentId}/like`, { method: "POST" })
    } catch {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 }
            : c,
        ),
      )
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Xóa bình luận này?")) return
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" })
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      }
    } catch { /* */ }
  }

  const isLoggedIn = !!currentUserId
  const isLocked = post.status === "LOCKED"

  // Separate root comments and replies
  const rootComments = comments.filter((c) => !c.parentId)
  const repliesMap = new Map<string, CommentData[]>()
  for (const c of comments) {
    if (c.parentId) {
      const arr = repliesMap.get(c.parentId) ?? []
      arr.push(c)
      repliesMap.set(c.parentId, arr)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      {/* Back link */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 transition-colors"
      >
        ← Quay lại cộng đồng
      </Link>

      {/* Post */}
      <article className="bg-white rounded-xl border border-brand-200 p-6 space-y-4">
        {/* Locked banner */}
        {isLocked && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            Bài viết đã bị tạm khoá
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full bg-brand-200 flex items-center justify-center shrink-0 overflow-hidden">
            {post.author.avatarUrl ? (
              <Image src={post.author.avatarUrl} alt="" fill className="object-cover" sizes="48px" />
            ) : (
              <span className="text-sm font-bold text-brand-700">{getInitials(post.author.name)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand-900">{post.author.name}</span>
              {post.author.company && (
                <Link
                  href={`/doanh-nghiep/${post.author.company.slug}`}
                  className="text-sm text-brand-500 hover:text-brand-700"
                >
                  · {post.author.company.name}
                </Link>
              )}
            </div>
            <span className="text-xs text-brand-400" suppressHydrationWarning>
              {isMounted ? timeAgo(post.createdAt) : ""}
            </span>
          </div>
        </div>

        {/* Promoted */}
        {post.isPromoted && (
          <span className="inline-flex text-xs font-medium bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
            Ghim bởi admin
          </span>
        )}

        {/* Title */}
        {post.title && (
          <h1 className="text-xl font-bold text-brand-900 leading-snug">{post.title}</h1>
        )}

        {/* Content */}
        {isLocked && currentUserRole !== "ADMIN" ? (
          <p className="text-sm text-brand-400 italic">Nội dung đã bị ẩn do vi phạm quy định.</p>
        ) : (
          <div
            className="prose prose-sm max-w-none text-brand-800"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />
        )}

        {/* Images */}
        {post.imageUrls.length > 0 && (
          <div className={cn("gap-2 rounded-lg overflow-hidden", post.imageUrls.length === 1 ? "" : "grid grid-cols-2")}>
            {post.imageUrls.slice(0, 4).map((url, i) => (
              <Image key={i} src={url} alt="" width={700} height={500} className="w-full object-cover rounded-lg max-h-80" sizes="700px" />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-brand-200">
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={handleReact}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors",
                  hasReacted ? "bg-brand-100 text-brand-700" : "text-brand-400 hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {hasReacted ? "✓" : "○"} Hữu ích ({reactionCount})
              </button>
            ) : (
              <span className="text-sm text-brand-400">Hữu ích ({reactionCount})</span>
            )}
            <span className="text-sm text-brand-400">💬 {comments.length} bình luận</span>
          </div>
          <span className="text-sm text-brand-500">{post.viewCount + 1} lượt xem</span>
        </div>
      </article>

      {/* Comments section */}
      <section className="bg-white rounded-xl border border-brand-200 p-6 space-y-5">
        <h2 className="font-semibold text-brand-900">Bình luận ({comments.length})</h2>

        {/* Comment input */}
        {isLoggedIn ? (
          <div className="flex gap-3">
            <div className="relative w-9 h-9 rounded-full bg-brand-200 flex items-center justify-center shrink-0 overflow-hidden">
              {currentUserAvatar ? (
                <Image src={currentUserAvatar} alt="" fill className="object-cover" sizes="36px" />
              ) : (
                <span className="text-xs font-bold text-brand-700">
                  {currentUserName?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              {replyTo && (
                <div className="flex items-center gap-2 text-xs text-brand-500">
                  <span>Trả lời <strong>{replyTo.name}</strong></span>
                  <button onClick={() => setReplyTo(null)} className="text-brand-400 hover:text-red-500">✕</button>
                </div>
              )}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? `Trả lời ${replyTo.name}...` : "Viết bình luận..."}
                rows={2}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="rounded-lg bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Đang gửi..." : "Gửi"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Link href="/login" className="text-sm text-brand-600 hover:text-brand-800 font-medium">
              Đăng nhập để bình luận
            </Link>
          </div>
        )}

        {/* Comments list */}
        {loadingComments ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-brand-400 text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        ) : (
          <div className="space-y-4">
            {rootComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={repliesMap.get(comment.id) ?? []}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onReply={(id, name) => setReplyTo({ id, name })}
                onLike={handleLikeComment}
                onDelete={handleDeleteComment}
                isMounted={isMounted}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  replies,
  currentUserId,
  currentUserRole,
  onReply,
  onLike,
  onDelete,
  isMounted,
  isReply = false,
}: {
  comment: CommentData
  replies: CommentData[]
  currentUserId: string | null
  currentUserRole: string | null
  onReply: (id: string, name: string) => void
  onLike: (id: string) => void
  onDelete: (id: string) => void
  isMounted: boolean
  isReply?: boolean
}) {
  const isOwn = currentUserId === comment.author.id
  const isAdmin = currentUserRole === "ADMIN"
  const canDelete = isOwn || isAdmin
  const isLoggedIn = !!currentUserId

  return (
    <div className={cn("flex gap-3", isReply && "ml-12")}>
      <div className="relative w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center shrink-0 overflow-hidden">
        {comment.author.avatarUrl ? (
          <Image src={comment.author.avatarUrl} alt="" fill className="object-cover" sizes="32px" />
        ) : (
          <span className="text-xs font-bold text-brand-700">{getInitials(comment.author.name)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-brand-50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-brand-900">{comment.author.name}</span>
            {comment.author.role === "ADMIN" && (
              <span className="text-[10px] font-bold bg-brand-700 text-white rounded-full px-1.5 py-0.5">Admin</span>
            )}
          </div>
          <p className="text-sm text-brand-800 whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-xs text-brand-400" suppressHydrationWarning>
            {isMounted ? timeAgo(comment.createdAt) : ""}
          </span>
          {isLoggedIn && (
            <button
              onClick={() => onLike(comment.id)}
              className={cn(
                "text-xs font-medium transition-colors",
                comment.isLiked ? "text-brand-700" : "text-brand-400 hover:text-brand-600",
              )}
            >
              {comment.isLiked ? "Đã thích" : "Thích"}{comment.likeCount > 0 ? ` (${comment.likeCount})` : ""}
            </button>
          )}
          {isLoggedIn && (
            <button
              onClick={() => onReply(comment.id, comment.author.name)}
              className="text-xs font-medium text-brand-400 hover:text-brand-600 transition-colors"
            >
              Trả lời
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Nested replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                replies={[]}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onReply={onReply}
                onLike={onLike}
                onDelete={onDelete}
                isMounted={isMounted}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
