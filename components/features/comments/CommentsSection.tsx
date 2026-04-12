"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

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

/**
 * Reusable comments section for both Post and Product detail pages.
 * Pass either `postId` or `productId` to load/create comments.
 */
export function CommentsSection({
  postId,
  productId,
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
}: {
  postId?: string
  productId?: string
  currentUserId: string | null
  currentUserRole?: string | null
  currentUserName?: string | null
  currentUserAvatar?: string | null
}) {
  const [isMounted, setIsMounted] = useState(false)
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => setIsMounted(true), [])

  const queryKey = postId ? `postId=${postId}` : `productId=${productId}`

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?${queryKey}`)
      const data = await res.json()
      setComments(data.comments ?? [])
    } finally {
      setLoading(false)
    }
  }, [queryKey])

  useEffect(() => { loadComments() }, [loadComments])

  async function handleSubmit() {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
          postId: postId || null,
          productId: productId || null,
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

  async function handleLike(commentId: string) {
    if (!currentUserId) return
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

  async function handleDelete(commentId: string) {
    if (!confirm("Xóa bình luận này?")) return
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" })
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch { /* */ }
  }

  const isLoggedIn = !!currentUserId
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
    <section className="bg-white rounded-xl border border-brand-200 p-6 space-y-5">
      <h2 className="font-semibold text-brand-900">
        Thảo luận ({comments.length})
      </h2>

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
                onClick={handleSubmit}
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
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-brand-400 text-center py-4">Chưa có bình luận nào.</p>
      ) : (
        <div className="space-y-4">
          {rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesMap.get(comment.id) ?? []}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole ?? null}
              onReply={(id, name) => setReplyTo({ id, name })}
              onLike={handleLike}
              onDelete={handleDelete}
              isMounted={isMounted}
            />
          ))}
        </div>
      )}
    </section>
  )
}

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
