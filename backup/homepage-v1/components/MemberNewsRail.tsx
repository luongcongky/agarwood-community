import Link from "next/link"
import { getTopVipMemberPosts, getRotatingMemberPosts } from "@/lib/homepage"
import { PostCard } from "./PostCard"
import { getTranslations } from "next-intl/server"

export async function MemberNewsRail() {
  const [topPosts, t] = await Promise.all([
    getTopVipMemberPosts(),
    getTranslations("homepage"),
  ])
  const rotatingPosts = await getRotatingMemberPosts(topPosts.map((p) => p.id))

  if (topPosts.length === 0 && rotatingPosts.length === 0) {
    return (
      <aside className="rounded-xl border border-brand-200 bg-white p-5">
        <h2 className="text-base font-bold text-brand-900 mb-3">{t("memberNewsTitle")}</h2>
        <p className="text-sm text-brand-500 italic py-6 text-center">
          {t("memberNewsEmpty")}
        </p>
      </aside>
    )
  }

  return (
    <aside className="rounded-xl border border-brand-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-100 bg-brand-50/50">
        <h2 className="text-base font-bold text-brand-900">{t("memberNewsTitle")}</h2>
        <p className="text-xs text-brand-500 mt-0.5">{t("memberNewsSubtitle")}</p>
      </div>

      {/* Top Hội viên slots — horizontal cards */}
      {topPosts.length > 0 && (
        <div className="p-3 space-y-2 bg-amber-50/30">
          {topPosts.map((post) => (
            <PostCard key={post.id} post={post} variant="horizontal" memberBadgeLabel={t("memberBadge")} />
          ))}
        </div>
      )}

      {/* Rotating slots — compact list */}
      {rotatingPosts.length > 0 && (
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-500">
              {t("memberNewsRotating")}
            </span>
            <div className="h-px flex-1 bg-brand-100" />
          </div>
          <ul>
            {rotatingPosts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} variant="compact" memberBadgeLabel={t("memberBadge")} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-5 py-3 border-t border-brand-100 bg-brand-50/30">
        <Link
          href="/feed"
          className="text-xs font-medium text-brand-600 hover:text-brand-800 underline underline-offset-2"
        >
          {t("memberNewsViewAll")}
        </Link>
      </div>
    </aside>
  )
}
