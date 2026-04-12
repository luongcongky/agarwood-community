import Link from "next/link"
import Image from "next/image"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import type { HomepagePost } from "@/lib/homepage"

interface PostCardProps {
  post: HomepagePost
  variant?: "horizontal" | "vertical" | "compact"
}

/** Strip HTML tags and truncate to ~140 chars for excerpt */
function htmlToExcerpt(html: string, maxLen = 140): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…"
}

/** Extract first image URL from imageUrls array OR from HTML content */
function getCoverImage(post: HomepagePost): string | null {
  if (post.imageUrls && post.imageUrls.length > 0) return post.imageUrls[0]
  const match = post.content.match(/https:\/\/res\.cloudinary\.com\/[^"'\s)]+/)
  return match ? match[0] : null
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" })
}

export function PostCard({ post, variant = "vertical" }: PostCardProps) {
  const cover = getCoverImage(post)
  const excerpt = htmlToExcerpt(post.content)
  const authorName = post.author.company?.name ?? post.author.name
  const href = `/feed?post=${post.id}` // TODO Phase 5: detail page riêng cho post

  if (variant === "compact") {
    // Dùng cho rotating slots ở MemberNewsRail — nhỏ gọn, 1 dòng
    return (
      <Link
        href={href}
        className="group flex gap-3 py-2.5 border-b border-brand-100 last:border-0 hover:bg-brand-50/50 -mx-2 px-2 rounded transition-colors"
      >
        {cover && (
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded">
            <Image src={cover} alt="" fill className="object-cover" sizes="64px" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm font-medium text-brand-900 group-hover:text-brand-700">
            {post.title || excerpt.slice(0, 60)}
          </h4>
          <p className="mt-0.5 text-xs text-brand-500 truncate">
            {authorName}
            {post.isPremium && <span className="ml-1 text-amber-600">★</span>}
          </p>
        </div>
      </Link>
    )
  }

  if (variant === "horizontal") {
    // Dùng cho top Hội viên slots ở MemberNewsRail — có ảnh + excerpt
    return (
      <Link
        href={href}
        className="group flex gap-3 p-3 rounded-lg border border-brand-100 bg-white hover:border-brand-300 hover:shadow-sm transition-all"
      >
        {cover ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded">
            <Image src={cover} alt="" fill className="object-cover" sizes="80px" />
          </div>
        ) : (
          <AgarwoodPlaceholder className="h-20 w-20" size="sm" shape="rounded" tone="light" />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm font-semibold text-brand-900 group-hover:text-brand-700">
            {post.title || excerpt.slice(0, 80)}
          </h4>
          <p className="mt-1 text-xs text-brand-500 truncate">
            <span className="font-medium text-amber-600">★ Hội viên</span>
            <span className="mx-1">·</span>
            {authorName}
          </p>
        </div>
      </Link>
    )
  }

  // vertical (default) — dùng cho section 5+6 grid
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm hover:shadow-md hover:border-brand-300 transition-all"
    >
      <div className="relative h-44 w-full overflow-hidden bg-brand-50">
        {cover ? (
          <Image
            src={cover}
            alt={post.title ?? authorName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="lg" shape="square" />
        )}
        {post.isPremium && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
            ★ Hội viên
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-brand-900 group-hover:text-brand-700">
          {post.title || excerpt.slice(0, 80)}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-brand-600">{excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-brand-500">
          <span className="truncate font-medium">{authorName}</span>
          <time>{formatDate(post.createdAt)}</time>
        </div>
      </div>
    </Link>
  )
}
