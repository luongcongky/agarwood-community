import Link from "next/link"
import Image from "next/image"
import {
  getTopVipMemberPosts,
  getMemberPostsPool,
  pickRotatingMembers,
  type HomepagePost,
} from "@/lib/homepage"
import { BRAND_BLUR_DATA_URL } from "@/lib/imageBlur"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"

const SOCIAL_KEYS = ["facebook_url", "zalo_url", "youtube_url", "tiktok_url"] as const

async function getSocialChannels() {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: [...SOCIAL_KEYS] } },
  })
  const cfg = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<
    Record<(typeof SOCIAL_KEYS)[number], string>
  >
  // Thứ tự cố định để layout không nhảy theo thứ tự DB query trả về.
  const channels: { key: string; label: string; href: string; icon: string }[] = []
  if (cfg.facebook_url)
    channels.push({ key: "facebook", label: "Facebook", href: cfg.facebook_url, icon: "f" })
  if (cfg.zalo_url) channels.push({ key: "zalo", label: "Zalo", href: cfg.zalo_url, icon: "Z" })
  if (cfg.youtube_url)
    channels.push({ key: "youtube", label: "YouTube", href: cfg.youtube_url, icon: "▶" })
  if (cfg.tiktok_url)
    channels.push({ key: "tiktok", label: "TikTok", href: cfg.tiktok_url, icon: "♪" })
  return channels
}

function getCover(post: HomepagePost): string | null {
  if (post.imageUrls && post.imageUrls.length > 0) return post.imageUrls[0]
  const m = post.content.match(/https:\/\/res\.cloudinary\.com\/[^"'\s)]+/)
  return m ? m[0] : null
}

function plainTitle(post: HomepagePost, n = 80): string {
  if (post.title) return post.title
  return post.content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n)
}

export async function MemberRail() {
  // Fetch top posts + pool + socials + translations song song.
  const [top, pool, socials, t, tNav] = await Promise.all([
    getTopVipMemberPosts(),
    getMemberPostsPool(),
    getSocialChannels(),
    getTranslations("homepage"),
    getTranslations("navbar"),
  ])
  const rotating = pickRotatingMembers(
    pool,
    top.map((p) => p.id),
  )

  if (top.length === 0 && rotating.length === 0 && socials.length === 0) {
    return (
      <aside
        aria-label={t("memberNewsTitle")}
        className="border border-brand-200 bg-white p-5"
      >
        <p className="py-6 text-center text-sm italic text-brand-500">
          {t("memberNewsEmpty")}
        </p>
      </aside>
    )
  }

  return (
    <aside aria-label={t("memberNewsTitle")}>
      {socials.length > 0 && (
        <SocialChannels channels={socials} label={tNav("followUs")} />
      )}
      {top.length > 0 && (
        <ul className="divide-y divide-brand-200 border-t border-b border-brand-200">
          {top.map((post) => (
            <li key={post.id}>
              <TopItem post={post} />
            </li>
          ))}
        </ul>
      )}

      {rotating.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {rotating.map((post) => (
            <li key={post.id}>
              <CompactItem post={post} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

function TopItem({ post }: { post: HomepagePost }) {
  const cover = getCover(post)
  const name = post.author.company?.name ?? post.author.name
  const title = plainTitle(post)
  return (
    <Link
      href={`/bai-viet/${post.id}`}
      className="group flex items-start gap-3 py-3"
    >
      {cover ? (
        <div className="relative h-14 w-20 shrink-0 overflow-hidden bg-brand-100">
          <Image
            src={cover}
            alt=""
            fill
            placeholder="blur"
            blurDataURL={BRAND_BLUR_DATA_URL}
            sizes="80px"
            className="object-cover"
          />
        </div>
      ) : (
        <AgarwoodPlaceholder
          className="h-14 w-20 shrink-0"
          size="sm"
          shape="square"
          tone="light"
        />
      )}
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-bold leading-snug text-brand-900 underline-offset-2 decoration-brand-700 group-hover:text-brand-700 group-hover:underline">
          {title}
        </h4>
        <p className="mt-0.5 truncate text-[11px] uppercase tracking-wide text-brand-500">
          {name}
        </p>
      </div>
    </Link>
  )
}

function SocialChannels({
  channels,
  label,
}: {
  channels: { key: string; label: string; href: string; icon: string }[]
  label: string
}) {
  return (
    <div className="mb-4 border-t border-b border-brand-200 bg-brand-50/50 px-3 py-2.5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {channels.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={c.label}
            title={c.label}
            className={cls(c.key)}
          >
            <span aria-hidden className="text-sm font-bold leading-none">
              {c.icon}
            </span>
            <span className="text-[11px] font-semibold">{c.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Brand-tinted button per channel — nền trắng + border thương hiệu, hover
// đậm hơn. Giữ contrast cao với background brand-50/50 của container.
function cls(key: string): string {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors"
  switch (key) {
    case "facebook":
      return `${base} border-blue-300 bg-white text-blue-700 hover:bg-blue-50`
    case "zalo":
      return `${base} border-sky-300 bg-white text-sky-700 hover:bg-sky-50`
    case "youtube":
      return `${base} border-red-300 bg-white text-red-700 hover:bg-red-50`
    case "tiktok":
      return `${base} border-neutral-400 bg-white text-neutral-900 hover:bg-neutral-100`
    default:
      return `${base} border-brand-300 bg-white text-brand-700 hover:bg-brand-50`
  }
}

function CompactItem({ post }: { post: HomepagePost }) {
  const title = plainTitle(post)
  return (
    <Link
      href={`/bai-viet/${post.id}`}
      className="group flex gap-2 text-sm"
    >
      <span className="shrink-0 font-bold text-brand-700">▸</span>
      <span className="line-clamp-2 font-bold leading-snug text-brand-900 group-hover:text-brand-700 group-hover:underline">
        {title}
      </span>
    </Link>
  )
}
