import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import {
  getAssociationNews,
  getTopVipMemberPosts,
  getRotatingMemberPosts,
  getFeaturedProductsForHomepage,
  getLatestPostsByCategory,
} from "@/lib/homepage"

/**
 * Cron — pre-warm the homepage `unstable_cache` so the first real visitor
 * after cache expiry never pays the cold ~350ms TTFB.
 *
 * The homepage data fetchers in `lib/homepage.ts` are wrapped in
 * `unstable_cache` with `revalidate: 300-600` and tagged `"homepage"`.
 * After expiry the next visitor triggers a stale-while-revalidate cycle:
 * the cached value is returned but a background DB roundtrip refills the
 * cache. By running this cron just under the TTL, we make sure the refill
 * has already happened before any human hits the page.
 *
 * Auth: Bearer token = CRON_SECRET (Vercel Cron sends it automatically when
 * the env var is configured).
 *
 * Schedule: daily at 23:00 UTC (06:00 Vietnam) — warms the cache right
 * before the morning traffic peak. See vercel.json.
 *
 * Why daily and not every 5 min? Vercel Hobby (free) tier caps cron jobs
 * to daily-only. To get the original 5-minute target on Hobby, point an
 * external scheduler (cron-job.org, GitHub Actions, Upstash QStash, etc.)
 * at this endpoint — pass the CRON_SECRET as `Authorization: Bearer …`.
 * Upgrade to Pro to switch the schedule back to "*\/5 * * * *".
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 },
    )
  }
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const start = Date.now()

  // Mark all homepage-tagged cache entries as stale so the calls below
  // bypass the existing cache and re-populate it from fresh DB reads.
  revalidateTag("homepage", "max")

  // Re-populate every section's cache in parallel. Each fetcher is wrapped
  // in unstable_cache, so calling it after revalidateTag rewrites the entry.
  // (Banners + partners load below-the-fold via Suspense; we leave them to
  // lazy-warm on first visit since they don't gate LCP.)
  const results = await Promise.allSettled([
    getAssociationNews(),
    getTopVipMemberPosts().then((top) =>
      getRotatingMemberPosts(top.map((p) => p.id)),
    ),
    getFeaturedProductsForHomepage(),
    getLatestPostsByCategory("NEWS"),
    getLatestPostsByCategory("PRODUCT"),
  ])

  const elapsedMs = Date.now() - start
  const failed = results
    .map((r, i) => (r.status === "rejected" ? i : null))
    .filter((i): i is number => i !== null)

  return NextResponse.json({
    warmed: failed.length === 0,
    sections: results.length,
    failedIndices: failed,
    elapsedMs,
    timestamp: new Date(start).toISOString(),
  })
}
