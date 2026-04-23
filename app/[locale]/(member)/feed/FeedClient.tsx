"use client"

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { ThumbsUp, MessageSquare, Link2, Check } from "lucide-react"
import { PRODUCT_CATEGORIES } from "@/lib/constants/agarwood"
import { cn } from "@/lib/utils"
import { hasMemberAccess } from "@/lib/roles"
import { cloudinaryResize, rewriteCloudinaryInHtml } from "@/lib/cloudinary"
import { BLUR_DATA_URL } from "@/lib/seo/blur-placeholder"
import {
  saveMyRecentPost,
  loadMyRecentPosts,
  pruneMyRecentPosts,
  removeMyRecentPost,
} from "@/lib/my-recent-posts"
import { useLocale, useTranslations } from "next-intl"

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

type ProductSidecar = {
  id: string
  name: string
  slug: string
  priceRange: string | null
  category: string | null
  badgeUrl: string | null
  certStatus: string
}

type Post = {
  id: string
  authorId: string
  title: string | null
  content: string
  imageUrls: string[]
  status: string
  category?: string
  isPremium: boolean
  isPromoted: boolean
  authorPriority: number
  viewCount: number
  reportCount: number
  lockedAt: string | null
  lockedBy: string | null
  lockReason: string | null
  /** Moderation reject reason — set bởi admin khi reject. Khác với lockReason
   *  của auto-lock từ report. Hiển thị cho owner biết cần sửa gì. */
  moderationNote?: string | null
  createdAt: string
  updatedAt: string
  author: PostAuthor
  product?: ProductSidecar | null
  reactions: { type: string }[]
  _count: { reactions: number; comments: number }
  // ── Optimistic posting state (client-only, not persisted) ──
  /** True while upload + POST are in flight. Card is dimmed + reactions
   *  disabled until the real post ID comes back from the server. */
  isPending?: boolean
  /** Non-null when the optimistic upload/POST failed. Card shows a red
   *  banner with the message + a dismiss button. */
  pendingError?: string | null
}

type FilterKey = "NEWS" | "PRODUCT"

// FILTERS moved inside component to access translations

function buildFeedUrl(filter: FilterKey, cursor?: string | null) {
  const params = new URLSearchParams()
  params.set("category", filter)
  if (cursor) params.set("cursor", cursor)
  return `/api/posts?${params.toString()}`
}

type TopContributor = {
  id: string
  name: string
  avatarUrl: string | null
  contributionTotal: number
  accountType: string
  company: { name: string } | null
}

type MembershipInfo = {
  expires: string | null
  contributionTotal: number
  displayPriority: number
  accountType: string
  company: { name: string; slug: string } | null
}

type FeedClientProps = {
  initialPosts: Post[]
  currentUserId: string | null
  currentUserRole: string | null
  currentUserName: string | null
  currentUserAvatarUrl: string | null
  membershipInfo: MembershipInfo | null
  tierSilver?: number
  tierGold?: number
  tierIndSilver?: number
  tierIndGold?: number
  topContributors: TopContributor[]
  sidebarBannersSlot: ReactNode
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function timeAgo(dateStr: string, now: number, t: any): string {
  if (now === 0) return ""
  const diffMs = now - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return t("timeJustNow")
  if (mins < 60) return t("timeMinutes", { count: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t("timeHours", { count: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t("timeDays", { count: days })
  return new Date(dateStr).toLocaleDateString()
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
}

/**
 * Pull image URLs out of sanitized HTML. Used for posts created via the
 * inline composer, which embeds <img> tags directly in `content` rather
 * than populating the `imageUrls` column. Falling back to this keeps the
 * thumbnail grid + lightbox working for older posts too.
 */
function extractImageUrlsFromHtml(html: string): string[] {
  const matches = html.match(/<img[^>]+src=["']([^"']+)["']/g) ?? []
  return matches
    .map((tag) => {
      const m = tag.match(/src=["']([^"']+)["']/)
      return m ? m[1] : null
    })
    .filter((u): u is string => !!u)
}

/** Remove <img> tags from HTML so images aren't rendered twice when we
 *  display them separately as thumbnails. */
function stripImgTagsFromHtml(html: string): string {
  return html.replace(/<img[^>]*>/g, "")
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

/**
 * Full-viewport image viewer with prev/next navigation. Used when the
 * user clicks a post's thumbnail — keyboard arrows + buttons cycle
 * through that post's image set. Closes on Esc, backdrop click, or the
 * ✕ button.
 */
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    document.addEventListener("keydown", onKey)
    // Prevent body scroll while lightbox is open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, prev, next])

  // Preload adjacent images so pressing ← / → feels instant. Browser
  // starts downloading next/prev as soon as the current one is shown;
  // switching index hits the cache.
  useEffect(() => {
    if (images.length < 2) return
    const nextIdx = (index + 1) % images.length
    const prevIdx = (index - 1 + images.length) % images.length
    const uniqueIdx = [...new Set([nextIdx, prevIdx])].filter((i) => i !== index)
    const links = uniqueIdx.map((i) => {
      const link = document.createElement("link")
      link.rel = "preload"
      link.as = "image"
      link.href = cloudinaryResize(images[i], 1920)
      document.head.appendChild(link)
      return link
    })
    return () => { links.forEach((l) => l.remove()) }
  }, [index, images])

  const multi = images.length > 1

  return (
    <div
      className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition-colors"
        aria-label="Đóng"
      >
        ✕
      </button>

      {/* Counter */}
      {multi && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium tabular-nums bg-black/40 rounded-full px-3 py-1">
          {index + 1} / {images.length}
        </div>
      )}

      {/* Prev */}
      {multi && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); prev() }}
          className="absolute left-4 sm:left-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center transition-colors"
          aria-label="Ảnh trước"
        >
          ‹
        </button>
      )}

      {/* Image */}
      <div
        className="relative w-full h-full max-w-[92vw] max-h-[88vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cloudinaryResize(images[index], 1920)}
          alt=""
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Next */}
      {multi && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); next() }}
          className="absolute right-4 sm:right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center transition-colors"
          aria-label="Ảnh sau"
        >
          ›
        </button>
      )}
    </div>
  )
}

// ── PostImageGrid — Facebook-style image layout ─────────────────────────────
// 1 ảnh: full width, aspect-video.
// 2 ảnh: grid 2 cột, aspect-video total.
// 3 ảnh: 1 big left (row-span-2) + 2 nhỏ stacked right, aspect-square total.
// 4+ ảnh: 2×2 grid, ảnh thứ 4 có overlay "+N" nếu total > 4.
//
// Click thumbnail → onImageClick(index) → caller mở Lightbox tại index đó.

function FeedThumb({
  url,
  index,
  onClick,
  overlay,
  sizes = "(max-width: 768px) 50vw, 400px",
}: {
  url: string
  index: number
  onClick: (i: number) => void
  overlay?: ReactNode
  sizes?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      className="relative h-full w-full overflow-hidden bg-brand-100 transition-opacity hover:opacity-95"
      aria-label={`Xem ảnh ${index + 1}`}
    >
      <Image
        src={cloudinaryResize(url, 1000)}
        alt=""
        fill
        className="object-cover"
        sizes={sizes}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
      />
      {overlay}
    </button>
  )
}

function PostImageGrid({
  images,
  onImageClick,
}: {
  images: string[]
  onImageClick: (index: number) => void
}) {
  const count = images.length
  if (count === 0) return null

  if (count === 1) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-brand-100">
        <FeedThumb
          url={images[0]}
          index={0}
          onClick={onImageClick}
          sizes="(max-width: 768px) 100vw, 600px"
        />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="grid aspect-video w-full grid-cols-2 gap-1 overflow-hidden rounded-lg">
        <FeedThumb url={images[0]} index={0} onClick={onImageClick} />
        <FeedThumb url={images[1]} index={1} onClick={onImageClick} />
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="grid aspect-square w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg">
        <div className="row-span-2">
          <FeedThumb
            url={images[0]}
            index={0}
            onClick={onImageClick}
            sizes="(max-width: 768px) 50vw, 400px"
          />
        </div>
        <FeedThumb url={images[1]} index={1} onClick={onImageClick} />
        <FeedThumb url={images[2]} index={2} onClick={onImageClick} />
      </div>
    )
  }

  // count >= 4 — show 4 tiles trong 2×2 grid, ảnh thứ 4 overlay "+N" nếu còn
  const extra = count - 4
  return (
    <div className="grid aspect-square w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg">
      <FeedThumb url={images[0]} index={0} onClick={onImageClick} />
      <FeedThumb url={images[1]} index={1} onClick={onImageClick} />
      <FeedThumb url={images[2]} index={2} onClick={onImageClick} />
      <FeedThumb
        url={images[3]}
        index={3}
        onClick={onImageClick}
        overlay={
          extra > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-2xl font-bold text-white">+{extra}</span>
            </div>
          ) : undefined
        }
      />
    </div>
  )
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
  onDismiss,
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
  /** Used for optimistic-post error dismissal only (removes the failed card
   *  from the feed). No-op for normal posts. */
  onDismiss: (id: string) => void
  tierSilver?: number
  tierGold?: number
  tierIndSilver?: number
  tierIndGold?: number
  isMounted: boolean
  now: number
}) {
  const t = useTranslations("feed")
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const isLocked = post.status === "LOCKED"
  const isPendingModeration = post.status === "PENDING"
  const isRejected = isLocked && !!post.moderationNote

  // Unify image sources: use the DB column when populated, otherwise pull
  // from embedded <img> tags in the sanitized HTML content. Posts from
  // the inline composer fall into the latter bucket.
  const displayImages = post.imageUrls.length > 0
    ? (post.imageUrls as string[])
    : extractImageUrlsFromHtml(post.content)
  // When images are displayed as separate thumbnails, strip them from
  // the prose block so they don't render twice.
  const contentForProse = displayImages.length > 0
    ? stripImgTagsFromHtml(post.content)
    : post.content
  const userHasReacted = post.reactions.some((r) => r.type === "LIKE")
  const isAuthor = currentUserId === post.authorId
  const isAdmin = currentUserRole === "ADMIN"
  const isGuest = !currentUserRole || currentUserRole === "GUEST"
  // On server, always assume blurred for safety and to match initial client render
  const isGuestBlurred = (!isMounted || isGuest) && index >= GUEST_VISIBLE_COUNT

  const tier = getTierBadge(post.author.contributionTotal, post.author.accountType, tierSilver, tierGold, tierIndSilver, tierIndGold)

  // Strip HTML for truncation. Use the image-stripped content so <img>
  // tags don't inflate the character count for text-only truncation.
  // Threshold ~140 chars ≈ 2 dòng text-sm ở width ~600px — match với
  // line-clamp-2 CSS dưới. Vượt threshold → hiển thị "... Xem thêm".
  const plainText = contentForProse.replace(/<[^>]*>/g, "")
  const needsTruncation = plainText.length > 140

  // Menu options based on role
  const menuItems: { label: string; action: () => void; destructive?: boolean }[] = []
  if (isAuthor) {
    menuItems.push({ label: t("menuEdit"), action: () => { window.location.href = `/feed/tao-bai?edit=${post.id}` } })
    menuItems.push({ label: t("menuDelete"), action: () => onDelete(post.id), destructive: true })
  }
  if (isAdmin) {
    menuItems.push({ label: isLocked ? t("menuUnlock") : t("menuLock"), action: () => onLock(post.id) })
    if (!isAuthor) menuItems.push({ label: t("menuDelete"), action: () => onDelete(post.id), destructive: true })
  }
  if (currentUserRole && currentUserRole !== "GUEST" && !isAuthor) {
    menuItems.push({ label: t("menuReport"), action: () => handleReport(post.id) })
  }

  async function handleReport(postId: string) {
    const reason = window.prompt(t("reportPrompt"))
    if (!reason) return
    try {
      await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      alert(t("reportSent"))
    } catch {
      alert(t("genericError"))
    }
    setMenuOpen(false)
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/bai-viet/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // clipboard API unavailable (http, older browsers) — fallback
      const ta = document.createElement("textarea")
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand("copy") } catch { /* ignore */ }
      document.body.removeChild(ta)
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <article className={cn(
      "bg-white rounded-xl border border-brand-200 p-5 transition-opacity",
      isLocked && "opacity-60",
      post.isPending && "opacity-70",
      post.pendingError && "border-red-300 bg-red-50/30",
    )}>
      {/* Optimistic-post state banners */}
      {post.isPending && (
        <div className="mb-3 flex items-center gap-2 text-xs text-brand-600 bg-brand-50 rounded-md px-3 py-1.5">
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>{t("pendingLabel")}</span>
        </div>
      )}
      {post.pendingError && (
        <div className="mb-3 flex items-start justify-between gap-2 text-xs text-red-700 bg-red-100 rounded-md px-3 py-2 border border-red-200">
          <span className="flex-1">
            <strong className="font-semibold">{t("pendingErrorPrefix")}</strong> {post.pendingError}
          </span>
          <button
            type="button"
            onClick={() => onDismiss(post.id)}
            className="text-red-600 font-semibold hover:text-red-800 whitespace-nowrap"
          >
            {t("pendingDismiss")}
          </button>
        </div>
      )}
      {/* Moderation PENDING — chỉ owner thấy (query đã filter PENDING + authorId).
          Thông báo cho user biết bài chưa công khai tới khi admin duyệt. */}
      {isPendingModeration && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" />
          </svg>
          <span className="font-semibold">Chờ duyệt</span>
          <span className="text-xs text-amber-700">
            — Bài đang chờ admin kiểm duyệt. Chỉ bạn thấy được bài này cho đến khi được duyệt.
          </span>
        </div>
      )}

      {/* Moderation REJECTED (= LOCKED + moderationNote) — admin đã từ chối.
          Hiển thị lý do để owner biết cần sửa gì. Người khác không thấy. */}
      {isRejected ? (
        <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          <p className="font-semibold">❌ Bị từ chối</p>
          <p className="mt-1 text-xs text-red-700">
            Lý do: {post.moderationNote}
          </p>
          <p className="mt-1 text-xs text-red-600">
            Bạn có thể chỉnh sửa bài và gửi lại để admin duyệt.
          </p>
        </div>
      ) : (
        /* Locked từ auto-report (không có moderationNote) → banner cũ */
        isLocked && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            Bài viết đã bị tạm khoá
            {post.lockReason && <span className="text-xs text-amber-600">— {post.lockReason}</span>}
          </div>
        )
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
                {timeAgo(post.createdAt, now, t)}
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

      {/* Product sidecar strip — hiện khi bài post là sản phẩm */}
      {post.category === "PRODUCT" && post.product && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-white border border-brand-200 px-2 py-0.5 font-semibold text-brand-700">
            🛍️ {t("productBadge")}
          </span>
          {post.product.certStatus === "APPROVED" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-semibold text-emerald-700">
              ✓ {t("certifiedBadge")}
            </span>
          )}
          {post.product.category && (
            <span className="text-brand-600">{post.product.category}</span>
          )}
          {post.product.priceRange && (
            <span className="font-semibold text-brand-900">{post.product.priceRange}</span>
          )}
          <Link
            href={`/san-pham/${post.product.slug}`}
            className="ml-auto font-semibold text-brand-700 hover:text-brand-900 underline underline-offset-2"
          >
            {t("viewDetail")}
          </Link>
        </div>
      )}

      {/* Title — clickable to detail */}
      {post.title && (
        <h2 className="font-semibold text-brand-900 text-base mb-2 leading-snug">
          <Link href={`/bai-viet/${post.id}`} className="hover:text-brand-700 transition-colors">
            {post.title}
          </Link>
        </h2>
      )}

      {/* TEXT TRƯỚC — line-clamp-2, "... Xem thêm" nếu vượt threshold.
          Facebook-style: text intro → hình ảnh phía dưới. */}
      {isGuestBlurred ? (
        <div className="relative mb-3" suppressHydrationWarning>
          <div className="line-clamp-2 text-sm text-brand-800 blur-sm select-none">
            {plainText}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              href="/login"
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-brand-800"
            >
              Đăng nhập để đọc
            </Link>
          </div>
        </div>
      ) : isLocked && !isAdmin ? (
        <p className="mb-3 text-sm italic text-brand-400">
          Nội dung đã bị ẩn do vi phạm quy định.
        </p>
      ) : (
        <div className="mb-3" suppressHydrationWarning>
          <div
            className={cn(
              "prose prose-sm max-w-none text-sm text-brand-800",
              !expanded && needsTruncation && "line-clamp-2",
            )}
            /* Content từ DB đã được sanitize tại save-time (xem
               /api/posts POST/PATCH dùng DOMPurify.sanitize). Trust content
               trên client để tránh ship isomorphic-dompurify (~40KB gzip) +
               CPU sanitize per-post render. */
            dangerouslySetInnerHTML={{
              __html: rewriteCloudinaryInHtml(contentForProse, 800),
            }}
          />
          {needsTruncation && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-1 text-sm font-semibold text-brand-700 hover:text-brand-900"
            >
              {t("readMore")}
            </button>
          )}
        </div>
      )}

      {/* IMAGES SAU — Facebook-style layout 1/2/3/4+ ảnh full container width */}
      {!isGuestBlurred && displayImages.length > 0 && (
        <div className="mb-3">
          <PostImageGrid
            images={displayImages}
            onImageClick={setLightboxIndex}
          />
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={displayImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Stats + reaction bar — 3 nút action: Like (có label), Bình luận +
          Sao chép link (icon-only với tooltip). */}
      {!isLocked && !isGuestBlurred && (
        <div className="flex items-center justify-between pt-3 border-t border-brand-200">
          <div className="flex items-center gap-2">
            {currentUserRole && currentUserRole !== "GUEST" ? (
              <button
                onClick={() => onReact(post.id)}
                disabled={post.isPending}
                aria-label="Like"
                title="Like"
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                  userHasReacted ? "bg-brand-100 text-brand-700" : "text-brand-400 hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                <ThumbsUp size={16} fill={userHasReacted ? "currentColor" : "none"} />
                {post._count.reactions > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex min-w-[16px] h-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white tabular-nums">
                    {post._count.reactions}
                  </span>
                )}
              </button>
            ) : (
              <span
                aria-label="Like"
                title="Like"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-brand-400"
              >
                <ThumbsUp size={16} />
                {post._count.reactions > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex min-w-[16px] h-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white tabular-nums">
                    {post._count.reactions}
                  </span>
                )}
              </span>
            )}
            {post.isPending ? (
              <span
                aria-label={t("comments")}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-400 opacity-40"
              >
                <MessageSquare size={16} />
              </span>
            ) : (
              <Link
                href={`/bai-viet/${post.id}`}
                aria-label={t("comments")}
                title={t("comments")}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-brand-400 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                <MessageSquare size={16} />
                {post._count.comments > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex min-w-[16px] h-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white tabular-nums">
                    {post._count.comments}
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label={linkCopied ? t("linkCopied") : t("copyLink")}
              title={linkCopied ? t("linkCopied") : t("copyLink")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                linkCopied
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-brand-400 hover:bg-brand-50 hover:text-brand-700",
              )}
            >
              {linkCopied ? <Check size={16} /> : <Link2 size={16} />}
            </button>
          </div>
          <span className="text-sm text-brand-500">{post.viewCount} {t("views")}</span>
        </div>
      )}
    </article>
  )
}

// ── Inline Post Creator ─────────────────────────────────────────────────────

function InlinePostCreator({
  mode,
  currentUserName,
  currentUserAvatarUrl,
  currentUserId,
  currentUserRole,
  membershipInfo,
  onPostCreated,
  onPostUpdated,
}: {
  /** Filter đang active — quyết định layout form (NEWS: textarea đơn; PRODUCT:
   *  form có tên/danh mục/giá/tiêu đề + mô tả). Post được tạo với category
   *  trùng mode này. */
  mode: FilterKey
  currentUserName: string | null
  currentUserAvatarUrl: string | null
  currentUserId: string
  currentUserRole: string
  membershipInfo: MembershipInfo | null
  onPostCreated: (post: Post) => void
  onPostUpdated: (tempId: string, patch: Partial<Post>) => void
}) {
  const t = useTranslations("feed")
  const locale = useLocale()
  const [content, setContent] = useState("")
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Product-specific fields — chỉ dùng khi mode === "PRODUCT"
  const [productName, setProductName] = useState("")
  const [productCategory, setProductCategory] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [title, setTitle] = useState("")

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = "auto"
      ta.style.height = ta.scrollHeight + "px"
    }
  }, [content])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 4 - images.length
    const toAdd = files.slice(0, remaining)
    setImages((prev) => [
      ...prev,
      ...toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ])
    e.target.value = ""
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit() {
    const plainText = content.trim()

    // Validate theo mode. PRODUCT yêu cầu tên + tiêu đề + mô tả; NEWS giữ
    // threshold 50 ký tự của content.
    if (mode === "PRODUCT") {
      if (!productName.trim() || !title.trim() || plainText.length === 0) {
        setError("Vui lòng điền đủ: Tên sản phẩm, Tiêu đề và Nội dung mô tả.")
        return
      }
    } else if (plainText.length < 50) {
      setError(t("minContent", { count: plainText.length }))
      return
    }

    // Snapshot files + blob URLs before resetting the form. The background
    // upload runs against these snapshots, so the user can start composing
    // the next post immediately.
    const imagesSnapshot = images
    const blobUrls = imagesSnapshot.map((img) => img.preview)
    const paragraphs = plainText.split("\n").filter(Boolean).map((p) => `<p>${p}</p>`).join("")
    const blobImageHtml = blobUrls.map((url) => `<img src="${url}" />`).join("")

    // Build content HTML theo mode. PRODUCT prepend các field (tên/danh mục/
    // giá/tiêu đề) dạng structured HTML để reader thấy thông tin sản phẩm
    // ngay trong feed; NEWS giữ nguyên plain content.
    const productHeaderHtml =
      mode === "PRODUCT"
        ? [
            `<h2>${productName.trim()}</h2>`,
            productCategory.trim()
              ? `<p><strong>Danh mục:</strong> ${productCategory.trim()}</p>`
              : "",
            priceRange.trim()
              ? `<p><strong>Khoảng giá:</strong> ${priceRange.trim()}</p>`
              : "",
            title.trim() ? `<h3>${title.trim()}</h3>` : "",
          ]
            .filter(Boolean)
            .join("")
        : ""
    const postTitle = mode === "PRODUCT" ? productName.trim() : null
    const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Build optimistic Post. Blob URLs render instantly — the image files
    // are already in browser memory, so there's zero wait for the user.
    //
    // Status phải khớp logic server (/api/posts POST): ADMIN → PUBLISHED ngay,
    // mọi role khác → PENDING chờ admin duyệt. Trước đây hardcode PUBLISHED
    // khiến badge "Chờ duyệt" không hiện ở optimistic UI → user tưởng bài đã
    // công khai ngay.
    const optimisticStatus: "PUBLISHED" | "PENDING" =
      currentUserRole === "ADMIN" ? "PUBLISHED" : "PENDING"
    const optimisticPost: Post = {
      id: tempId,
      authorId: currentUserId,
      title: postTitle,
      content: blobImageHtml + productHeaderHtml + paragraphs,
      imageUrls: blobUrls,
      status: optimisticStatus,
      isPremium: currentUserRole === "VIP" || currentUserRole === "INFINITE",
      isPromoted: false,
      authorPriority: membershipInfo?.displayPriority ?? 0,
      viewCount: 0,
      reportCount: 0,
      lockedAt: null,
      lockedBy: null,
      lockReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: currentUserId,
        name: currentUserName ?? "",
        avatarUrl: currentUserAvatarUrl,
        role: currentUserRole,
        accountType: membershipInfo?.accountType ?? "BUSINESS",
        contributionTotal: membershipInfo?.contributionTotal ?? 0,
        company: membershipInfo?.company ?? null,
      },
      reactions: [],
      _count: { reactions: 0, comments: 0 },
      isPending: true,
      pendingError: null,
    }
    onPostCreated(optimisticPost)

    // Reset form immediately — user can compose next post while upload runs.
    // NOTE: blob URLs are NOT revoked here; the optimistic post is still
    // rendering them. They're revoked in the background handler below
    // after the real Cloudinary URLs are swapped in.
    setContent("")
    setImages([])
    setProductName("")
    setProductCategory("")
    setPriceRange("")
    setTitle("")
    setError(null)

    // ── Background: upload images → POST → swap URLs in the post ───────
    ;(async () => {
      try {
        const uploadedUrls = await Promise.all(
          imagesSnapshot.map(async (img) => {
            const formData = new FormData()
            formData.append("file", img.file)
            formData.append("folder", "bai-viet")
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            if (!res.ok) throw new Error(t("uploadFailed"))
            const data = await res.json()
            return data.secure_url as string
          }),
        )

        const realImageHtml = uploadedUrls.map((url) => `<img src="${url}" />`).join("")
        const realContent = realImageHtml + productHeaderHtml + paragraphs

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: realContent,
            category: mode,
            ...(postTitle ? { title: postTitle } : {}),
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || t("postFailed"))
        }
        const { post } = await res.json()

        // Swap in server data. React remounts the PostCard because the
        // ID changes, but since it was in `pending` state (no user
        // interactions), the remount is invisible to the user.
        // `status` cần sync từ server để badge moderation (Chờ duyệt /
        // Bị từ chối) hiển thị đúng nếu admin thay đổi logic.
        const patch = {
          id: post.id,
          status: post.status,
          content: realContent,
          imageUrls: uploadedUrls,
          createdAt: post.createdAt ?? optimisticPost.createdAt,
          updatedAt: post.updatedAt ?? optimisticPost.updatedAt,
          isPending: false,
          pendingError: null,
        }
        onPostUpdated(tempId, patch)

        // Sticky zone: lưu bài của viewer vào localStorage để lần sau vào
        // /feed vẫn thấy ở top (TTL 2h). Khắc phục vấn đề user priority=0
        // bị đẩy xuống dưới VIP ngay sau khi đăng.
        saveMyRecentPost(currentUserId, { ...optimisticPost, ...patch })

        // Now safe to free the blob URLs — images are served from Cloudinary.
        blobUrls.forEach((url) => URL.revokeObjectURL(url))
      } catch (err) {
        // Keep blob URLs alive so the failed post still shows its images
        // while the user decides to retry / dismiss. They'll be released
        // when the user dismisses (handlePostDismiss).
        onPostUpdated(tempId, {
          isPending: false,
          pendingError: err instanceof Error ? err.message : "Có lỗi xảy ra",
        })
      }
    })()
  }

  const charCount = content.trim().length

  const isProduct = mode === "PRODUCT"
  const inputCls =
    "w-full border border-brand-200 rounded-lg bg-white px-3 py-2 text-sm text-brand-800 placeholder:text-brand-400 focus:border-brand-600 focus:outline-none"

  return (
    <div className="bg-white rounded-xl border border-brand-200 p-4 space-y-3">
      {/* Author row */}
      <div className="flex items-start gap-3">
        <div className="relative w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
          {currentUserAvatarUrl ? (
            <Image src={currentUserAvatarUrl} alt="" fill className="object-cover" sizes="40px" />
          ) : (
            <span className="text-sm font-bold text-brand-700">
              {currentUserName?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>

        {isProduct ? (
          /* Product form — tên / danh mục / giá / tiêu đề / mô tả */
          <div className="flex-1 min-w-0 space-y-2">
            <input
              type="text"
              value={productName}
              onChange={(e) => { setProductName(e.target.value); setError(null) }}
              placeholder="Tên sản phẩm *"
              className={inputCls}
              maxLength={120}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Danh mục — combobox dùng PRODUCT_CATEGORIES chung toàn site
                  (shared với ProductForm ở /san-pham). */}
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className={cn(
                  inputCls,
                  productCategory ? "text-brand-800" : "text-brand-400",
                )}
              >
                <option value="">Chọn danh mục…</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="text-brand-800">
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder="Khoảng giá (vd: 500k - 1tr)"
                className={inputCls}
                maxLength={50}
              />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(null) }}
              placeholder="Tiêu đề bài đăng *"
              className={inputCls}
              maxLength={150}
            />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => { setContent(e.target.value); setError(null) }}
              placeholder="Mô tả chi tiết sản phẩm *"
              className="w-full resize-none border border-brand-200 rounded-lg bg-white px-3 py-2 text-sm text-brand-800 placeholder:text-brand-400 focus:border-brand-600 focus:outline-none min-h-[100px] leading-relaxed"
              rows={4}
            />
          </div>
        ) : (
          /* NEWS mode — single textarea, auto-resize */
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); setError(null) }}
            placeholder={t("placeholder")}
            className="w-full resize-none text-sm text-brand-800 placeholder:text-brand-400 focus:outline-none min-h-[60px] leading-relaxed"
            rows={2}
          />
        )}
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-brand-200">
              <Image src={img.preview} alt="" fill className="object-cover" sizes="80px" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Footer: actions + submit */}
      <div className="flex items-center justify-between pt-2 border-t border-brand-100">
        <div className="flex items-center gap-2">
          {/* Image upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4}
            className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40"
            title={t("addImages")}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Zm7.5-12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
            {t("images")}
          </button>

          {/* Full editor link */}
          <Link
            href={`/${locale}/feed/tao-bai`}
            className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg px-2.5 py-1.5 transition-colors"
            title={t("fullEditor")}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            {t("fullEditorShort")}
          </Link>

          {/* Char count hint — chỉ cho NEWS mode (PRODUCT không có 50-char
              threshold, validation check trống field thay). */}
          {!isProduct && content.length > 0 && charCount < 50 && (
            <span className="text-xs text-brand-400">
              {charCount}/50
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            isProduct
              ? !productName.trim() || !title.trim() || charCount === 0
              : charCount < 50
          }
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
            (isProduct
              ? productName.trim() && title.trim() && charCount > 0
              : charCount >= 50)
              ? "bg-brand-700 text-white hover:bg-brand-800"
              : "bg-brand-100 text-brand-400 cursor-not-allowed",
          )}
        >
          {isProduct ? "Đăng sản phẩm" : t("post")}
        </button>
      </div>
    </div>
  )
}

// ── Membership Card ──────────────────────────────────────────────────────────

function MembershipCard({ info, now }: { info: MembershipInfo; now: number }) {
  const t = useTranslations("feed")
  const expires = info.expires ? new Date(info.expires) : null
  const daysLeft = expires && now ? Math.max(0, Math.ceil((expires.getTime() - now) / 86400000)) : 0
  const isActive = expires && now ? expires.getTime() > now : false

  return (
    <div className="bg-linear-to-br from-brand-800 to-brand-700 text-white rounded-xl p-4 space-y-3" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-200">{t("memberCard")}</span>
        <span className={cn("text-xs font-semibold rounded-full px-2 py-0.5", isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}>
          {isActive ? t("statusActive") : t("statusExpired")}
        </span>
      </div>
      {expires && (
        <div>
          <p className="text-xs text-brand-300">{t("expiresLabel")}</p>
          <p className="text-sm font-medium">
            {expires.toLocaleDateString("vi-VN")}
            {isActive && <span className="ml-2 text-brand-300 text-xs">({daysLeft} ngày)</span>}
          </p>
        </div>
      )}
      <div className="flex gap-4 pt-2 border-t border-brand-600">
        <div>
          <p className="text-xs text-brand-300">{t("contributionLabel")}</p>
          <p className="text-sm font-semibold">{info.contributionTotal.toLocaleString("vi-VN")} ₫</p>
        </div>
        <div>
          <p className="text-xs text-brand-300">{t("priorityLabel")}</p>
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
  currentUserAvatarUrl,
  membershipInfo,
  topContributors,
  sidebarBannersSlot,
  tierSilver,
  tierGold,
  tierIndSilver,
  tierIndGold,
}: FeedClientProps) {
  const t = useTranslations("feed")

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "NEWS", label: t("filterNews") },
    { key: "PRODUCT", label: t("filterProduct") },
  ]

  const [isMounted, setIsMounted] = useState(false)
  const [now, setNow] = useState(0)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10)
  const [filter, setFilter] = useState<FilterKey>("NEWS")

  useEffect(() => {
    setNow(Date.now())
    setIsMounted(true)

    if (!currentUserId) return

    // Phase 1: hand-off 1 lần từ /feed/tao-bai PostEditor (sessionStorage).
    // Nếu có, chuyển vào localStorage sticky zone để từ giờ trở đi hiển thị
    // qua cơ chế chung (TTL 2h). Giữ tương thích ngược với PostEditor.
    try {
      const raw = sessionStorage.getItem("freshPost")
      if (raw) {
        sessionStorage.removeItem("freshPost")
        const fresh = JSON.parse(raw) as Partial<Post> & { id: string }
        const hydrated: Post = {
          imageUrls: [],
          status: "PUBLISHED",
          isPremium: false,
          isPromoted: false,
          authorPriority: 0,
          viewCount: 0,
          reportCount: 0,
          lockedAt: null,
          lockedBy: null,
          lockReason: null,
          reactions: [],
          _count: { reactions: 0, comments: 0 },
          ...fresh,
        } as Post
        saveMyRecentPost(currentUserId, hydrated)
      }
    } catch {
      /* ignore corrupt sessionStorage entry */
    }

    // Phase 2: prepend sticky zone của viewer (từ localStorage, TTL 2h).
    // Dedupe với initialPosts từ server — nếu bài đã xuất hiện qua rank thật,
    // prune khỏi localStorage luôn.
    setPosts((prev) => {
      const serverIds = new Set(prev.map((p) => p.id))
      pruneMyRecentPosts(serverIds)
      const sticky = loadMyRecentPosts<Post>(currentUserId, serverIds)
      return sticky.length > 0 ? [...sticky, ...prev] : prev
    })
  }, [currentUserId])
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<string | null>(initialPosts.at(-1)?.id ?? null)

  // Refetch khi đổi filter (bỏ qua lần mount đầu — đã có initialPosts)
  const didMountFilter = useRef(false)
  useEffect(() => {
    if (!didMountFilter.current) {
      didMountFilter.current = true
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(buildFeedUrl(filter))
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setPosts(data.posts ?? [])
        setHasMore((data.posts?.length ?? 0) >= 10)
        cursorRef.current = data.posts?.at(-1)?.id ?? null
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [filter])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursorRef.current) return
    setLoading(true)
    try {
      const res = await fetch(buildFeedUrl(filter, cursorRef.current))
      const data = await res.json()
      if (data.posts.length < 10) setHasMore(false)
      setPosts((prev) => [...prev, ...data.posts])
      cursorRef.current = data.posts.at(-1)?.id ?? null
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, filter])

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
    if (!window.confirm(t("deleteConfirm"))) return
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
        removeMyRecentPost(postId)
      }
    } catch { /* */ }
  }

  function handlePostCreated(post: Post) {
    setPosts((prev) => [post, ...prev])
    setNow(Date.now())
  }

  /** Merge server data into an optimistic post (tempId → realId swap on
   *  success, or set pendingError on failure). Noop if the post was
   *  dismissed by the user before the background work finished. */
  function handlePostUpdated(tempId: string, patch: Partial<Post>) {
    setPosts((prev) => prev.map((p) => (p.id === tempId ? { ...p, ...patch } : p)))
  }

  /** Remove a failed optimistic post from the feed (after user clicks
   *  "Bỏ qua" on the error banner). */
  function handlePostDismiss(tempId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== tempId))
  }

  const isLoggedIn = !!currentUserId
  // VIP/ADMIN/INFINITE LUÔN được post. GUEST được post nếu có
  // membershipExpires trong tương lai (đã đóng phí nhưng role chưa upgrade).
  // Xem lib/roles.ts → hasMemberAccess.
  const isMember = hasMemberAccess(currentUserRole, membershipInfo?.expires)
  const canPost = isMember

  return (
    <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Feed column ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Filter chips — ĐẶT TRƯỚC editor để chọn loại nội dung muốn đăng,
            editor sẽ đổi layout phù hợp (NEWS: textarea + ảnh; PRODUCT: form
            sản phẩm với tên/danh mục/giá/tiêu đề/nội dung). */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors",
                filter === f.key
                  ? "bg-brand-700 text-white border-brand-700"
                  : "bg-white text-brand-700 border-brand-200 hover:bg-brand-50",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Inline post creator — layout đổi theo filter (mode). */}
        {canPost && currentUserId && currentUserRole && (
          <InlinePostCreator
            mode={filter}
            currentUserName={currentUserName}
            currentUserAvatarUrl={currentUserAvatarUrl}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            membershipInfo={membershipInfo}
            onPostCreated={handlePostCreated}
            onPostUpdated={handlePostUpdated}
          />
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
            onDismiss={handlePostDismiss}
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
          <p className="text-center text-sm text-brand-400 py-4">{t("endOfFeed")}</p>
        )}
      </div>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="w-full lg:w-80 shrink-0 space-y-4 hidden lg:block">
        {!isMember ? (
          <div className="bg-white rounded-xl border border-brand-200 p-5 space-y-3">
            <h3 className="font-semibold text-brand-900 text-sm">{t("joinHeading")}</h3>
            <p className="text-xs text-brand-400">
              {isLoggedIn
                ? t("pendingMsg")
                : t("guestMsg")}
            </p>
            {!isLoggedIn && (
              <Link href="/login" className="flex w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors">
                {t("loginBtn")}
              </Link>
            )}
          </div>
        ) : (
          <>
            {membershipInfo && <MembershipCard info={membershipInfo} now={now} />}
          </>
        )}

        {topContributors.length > 0 && (
          <div className="bg-white rounded-xl border border-brand-200 p-5">
            <h3 className="font-semibold text-brand-900 text-sm mb-4">{t("topContributors")}</h3>
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

        {/* Sticky vertical ad rail — fetched separately as a streamed server
            component so the feed renders without waiting on the banner query. */}
        {sidebarBannersSlot}
      </aside>
    </div>
    </div>
  )
}
