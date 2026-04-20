"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import DOMPurify from "isomorphic-dompurify"
import Image from "next/image"
import { cn } from "@/lib/utils"
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
  createdAt: string
  updatedAt: string
  author: PostAuthor
  product?: ProductSidecar | null
  reactions: { type: string }[]
  _count: { reactions: number; comments: number }
}

type FilterKey = "all" | "NEWS" | "PRODUCT" | "CERTIFIED"

// FILTERS moved inside component to access translations

function buildFeedUrl(filter: FilterKey, cursor?: string | null) {
  const params = new URLSearchParams()
  if (filter === "CERTIFIED") params.set("certified", "1")
  else if (filter !== "all") params.set("category", filter)
  if (cursor) params.set("cursor", cursor)
  const qs = params.toString()
  return qs ? `/api/posts?${qs}` : "/api/posts"
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

type SidebarBanner = {
  id: string
  title: string
  imageUrl: string
  targetUrl: string
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
  sidebarBanners: SidebarBanner[]
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
          src={images[index]}
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
  const t = useTranslations("feed")
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const isLocked = post.status === "LOCKED"

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
  const plainText = contentForProse.replace(/<[^>]*>/g, "")
  const needsTruncation = plainText.length > 300

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

      {/* Images first when post has them — quick-scan mode prioritizes
          visuals. Rendered as extra-large icon thumbnails; clicking any
          one opens a lightbox with prev/next navigation across the
          post's full image set. */}
      {!isGuestBlurred && displayImages.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {displayImages.slice(0, 4).map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-lg overflow-hidden border border-brand-200 hover:ring-2 hover:ring-brand-400 transition-all shrink-0"
              aria-label={`Xem ảnh ${i + 1}`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="128px" />
              {/* Show +N overlay on the 4th thumb when the post has >4 images */}
              {i === 3 && displayImages.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-lg">
                  +{displayImages.length - 4}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={displayImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
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
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentForProse) }}
          />
          {needsTruncation && !expanded && (
            <button onClick={() => setExpanded(true)} className="text-sm font-medium text-brand-600 hover:text-brand-800 mt-1">
              {t("readMore")}
            </button>
          )}
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
                {userHasReacted ? "✓" : "○"} {t("useful", { count: post._count.reactions })}
              </button>
            ) : (
              <span className="text-sm text-brand-400">{t("useful", { count: post._count.reactions })}</span>
            )}
            <Link
              href={`/bai-viet/${post.id}`}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-700 rounded-lg px-3 py-1.5 hover:bg-brand-50 transition-colors"
            >
              💬 {post._count.comments > 0 ? `${post._count.comments} ` : ""}{t("comments")}
            </Link>
            <button
              type="button"
              onClick={handleCopyLink}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors",
                linkCopied
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-brand-400 hover:bg-brand-50 hover:text-brand-700",
              )}
              aria-label={t("copyLink")}
            >
              {linkCopied ? "✓ " : "🔗 "}{linkCopied ? t("linkCopied") : t("copyLink")}
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
  currentUserName,
  currentUserAvatarUrl,
  currentUserId,
  currentUserRole,
  membershipInfo,
  onPostCreated,
}: {
  currentUserName: string | null
  currentUserAvatarUrl: string | null
  currentUserId: string
  currentUserRole: string
  membershipInfo: MembershipInfo | null
  onPostCreated: (post: Post) => void
}) {
  const t = useTranslations("feed")
  const locale = useLocale()
  const [content, setContent] = useState("")
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = "auto"
      ta.style.height = ta.scrollHeight + "px"
    }
  }, [content])

  function handleReset() {
    setContent("")
    setImages([])
    setError(null)
  }

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
    if (plainText.length < 50) {
      setError(t("minContent", { count: plainText.length }))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Upload images first
      const uploadedUrls: string[] = []
      for (const img of images) {
        const formData = new FormData()
        formData.append("file", img.file)
        formData.append("folder", "bai-viet")
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error(t("uploadFailed"))
        const data = await res.json()
        uploadedUrls.push(data.secure_url)
      }

      // Build HTML content — images first, then paragraphs. Quick-compose
      // posts are scanned visually in the feed, so leading with the
      // attached images mirrors how users expect the post to render.
      const paragraphs = plainText.split("\n").filter(Boolean).map((p) => `<p>${p}</p>`).join("")
      const imageHtml = uploadedUrls.map((url) => `<img src="${url}" />`).join("")
      const htmlContent = imageHtml + paragraphs

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: htmlContent, category: "GENERAL" }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("postFailed"))
      }

      const { post } = await res.json()

      // Build optimistic Post for immediate feed display
      const optimisticPost: Post = {
        id: post.id,
        authorId: currentUserId,
        title: null,
        content: imageHtml + paragraphs,
        imageUrls: uploadedUrls,
        status: "PUBLISHED",
        isPremium: currentUserRole === "VIP",
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
      }
      onPostCreated(optimisticPost)

      // Reset form
      images.forEach((img) => URL.revokeObjectURL(img.preview))
      handleReset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
    } finally {
      setSubmitting(false)
    }
  }

  const charCount = content.trim().length

  return (
    <div className="bg-white rounded-xl border border-brand-200 p-4 space-y-3">
      {/* Author + textarea row */}
      <div className="flex gap-3">
        <div className="relative w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
          {currentUserAvatarUrl ? (
            <Image src={currentUserAvatarUrl} alt="" fill className="object-cover" sizes="40px" />
          ) : (
            <span className="text-sm font-bold text-brand-700">
              {currentUserName?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
        <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => { setContent(e.target.value); setError(null) }}
        placeholder={t("placeholder")}
          className="w-full resize-none text-sm text-brand-800 placeholder:text-brand-400 focus:outline-none min-h-[60px] leading-relaxed"
          disabled={submitting}
          rows={2}
        />
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
            disabled={images.length >= 4 || submitting}
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

          {/* Char count hint */}
          {content.length > 0 && charCount < 50 && (
            <span className="text-xs text-brand-400">
              {charCount}/50
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || charCount < 50}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
            charCount >= 50
              ? "bg-brand-700 text-white hover:bg-brand-800"
              : "bg-brand-100 text-brand-400 cursor-not-allowed",
          )}
        >
          {submitting ? t("posting") : t("post")}
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
  sidebarBanners,
  tierSilver,
  tierGold,
  tierIndSilver,
  tierIndGold,
}: FeedClientProps) {
  const t = useTranslations("feed")

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "NEWS", label: t("filterNews") },
    { key: "PRODUCT", label: t("filterProduct") },
    { key: "CERTIFIED", label: t("filterCert") },
  ]

  const [isMounted, setIsMounted] = useState(false)
  const [now, setNow] = useState(0)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [hasMore, setHasMore] = useState(initialPosts.length >= 20)
  const [filter, setFilter] = useState<FilterKey>("all")

  useEffect(() => {
    setNow(Date.now())
    setIsMounted(true)
  }, [])
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
        setHasMore((data.posts?.length ?? 0) >= 20)
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
      if (data.posts.length < 20) setHasMore(false)
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
      }
    } catch { /* */ }
  }

  function handlePostCreated(post: Post) {
    setPosts((prev) => [post, ...prev])
    setNow(Date.now())
  }

  const isLoggedIn = !!currentUserId
  const isMember = currentUserRole === "VIP" || currentUserRole === "ADMIN"
  const canPost = isMember

  return (
    <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Feed column ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Inline post creator */}
        {canPost && currentUserId && currentUserRole && (
          <InlinePostCreator
            currentUserName={currentUserName}
            currentUserAvatarUrl={currentUserAvatarUrl}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            membershipInfo={membershipInfo}
            onPostCreated={handlePostCreated}
          />
        )}

        {/* Filter chips */}
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

        {/* Sticky vertical ad rail — placed at the bottom of the aside so
            it naturally sits below MembershipCard + Top contributors. As
            the user scrolls, `sticky top-20` pins the banner below the
            64px sticky navbar (top-16 + a 4-unit gap) so it isn't clipped
            by the header. */}
        <div className="sticky top-20 space-y-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-brand-400">
            Quảng cáo
          </p>
          {sidebarBanners.length > 0 ? (
            <div className="space-y-3">
              {sidebarBanners.map((b) => (
                <a
                  key={b.id}
                  href={b.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={b.title}
                  className="block overflow-hidden rounded-xl border border-brand-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="relative w-full" style={{ aspectRatio: "2 / 3" }}>
                    <Image src={b.imageUrl} alt={b.title} fill className="object-cover" sizes="320px" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <Link
              href="/banner/dang-ky"
              className="block rounded-xl border-2 border-dashed border-brand-300 bg-white/80 p-5 text-center hover:bg-white hover:border-brand-500 transition-colors"
              style={{ aspectRatio: "2 / 3" }}
            >
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-brand-700 text-xl font-bold">+</span>
                </div>
                <p className="text-sm font-semibold text-brand-800">Đặt banner quảng cáo</p>
                <p className="text-xs text-brand-500 leading-relaxed">
                  Hiển thị banner dọc tại vị trí này trên /feed. Đăng ký 1 tháng → hàng nghìn lượt xem.
                </p>
                <span className="text-xs font-semibold text-brand-700 underline underline-offset-2 mt-1">
                  Đăng ký ngay →
                </span>
              </div>
            </Link>
          )}
        </div>
      </aside>
    </div>
    </div>
  )
}
