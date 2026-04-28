import { cn } from "@/lib/utils"
import {
  countNewsCreated,
  countPostsCreated,
  topPostContributors,
  topNewsContributors,
  dailySeries,
  type StatPair,
  type DailyPoint,
} from "@/lib/admin-stats"
import { Sparkline } from "./Sparkline"
import { ContributorBoard } from "./ContributorBoard"

export const metadata = {
  title: "Thống kê | Admin",
}

export const revalidate = 0 // admin xem real-time

export default async function AdminStatsPage() {
  const [
    newsWeek, newsMonth,
    postsWeek, postsMonth,
    topNewsWeek, topNewsMonth,
    topPostsWeek, topPostsMonth,
    seriesNews30, seriesPosts30,
  ] = await Promise.all([
    countNewsCreated(7),
    countNewsCreated(30),
    countPostsCreated(7),
    countPostsCreated(30),
    topNewsContributors(7, 10),
    topNewsContributors(30, 10),
    topPostContributors(7, 10),
    topPostContributors(30, 10),
    dailySeries("news", 30),
    dailySeries("post", 30),
  ])

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-brand-900">Thống kê hoạt động</h1>
        <p className="mt-1 text-sm text-brand-500">
          Theo dõi nội dung mới + hội viên đóng góp tích cực. Số liệu tính theo
          rolling window (7 / 30 ngày gần nhất, so sánh với period liền trước).
        </p>
      </header>

      {/* Stat cards — 4 ô: News tuần/tháng, Posts tuần/tháng */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tin tức mới — 7 ngày"
          stat={newsWeek}
          series={seriesNews30.slice(-7)}
          colorTone="amber"
        />
        <StatCard
          label="Tin tức mới — 30 ngày"
          stat={newsMonth}
          series={seriesNews30}
          colorTone="amber"
        />
        <StatCard
          label="Bài feed mới — 7 ngày"
          stat={postsWeek}
          series={seriesPosts30.slice(-7)}
          colorTone="emerald"
        />
        <StatCard
          label="Bài feed mới — 30 ngày"
          stat={postsMonth}
          series={seriesPosts30}
          colorTone="emerald"
        />
      </section>

      {/* Leaderboard — bên trái: tin tức (admin/staff đăng), bên phải: feed
          (hội viên đăng). Mỗi bảng có toggle 7d/30d riêng. */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ContributorBoard
          title="Top đóng góp Tin tức"
          subtitle="Admin / staff đăng nhiều News (kể cả bản nháp)"
          data7={topNewsWeek}
          data30={topNewsMonth}
          unitLabel="bài"
        />
        <ContributorBoard
          title="Top đóng góp Bài feed"
          subtitle="Hội viên đăng nhiều bài feed PUBLISHED"
          data7={topPostsWeek}
          data30={topPostsMonth}
          unitLabel="bài"
        />
      </section>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  stat,
  series,
  colorTone,
}: {
  label: string
  stat: StatPair
  series: DailyPoint[]
  colorTone: "amber" | "emerald"
}) {
  const tone =
    colorTone === "amber"
      ? { stroke: "#b45309", fill: "rgba(180, 83, 9, 0.12)" }
      : { stroke: "#047857", fill: "rgba(4, 120, 87, 0.12)" }

  const delta = stat.deltaPct
  const deltaUI =
    delta === null
      ? { text: "Mới", cls: "bg-brand-50 text-brand-600 ring-brand-200" }
      : delta > 0
        ? { text: `+${delta}%`, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" }
        : delta < 0
          ? { text: `${delta}%`, cls: "bg-red-50 text-red-700 ring-red-200" }
          : { text: "0%", cls: "bg-brand-50 text-brand-600 ring-brand-200" }

  return (
    <div className="rounded-xl border border-brand-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-brand-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-3xl font-bold text-brand-900">{stat.current}</p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 whitespace-nowrap",
            deltaUI.cls,
          )}
          title={`Period trước: ${stat.previous}`}
        >
          {deltaUI.text}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-brand-400">
        Period trước: {stat.previous}
      </p>
      <div className="mt-3">
        <Sparkline points={series} stroke={tone.stroke} fill={tone.fill} width={260} />
      </div>
    </div>
  )
}

