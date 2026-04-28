import "server-only"
import { prisma } from "./prisma"

/**
 * Phase 3.7 round 4 (2026-04): admin content/activity stats.
 * Hỗ trợ /admin/thong-ke. Không cache (admin xem real-time).
 */

export type StatPair = {
  current: number
  previous: number
  /** Δ% so với period trước (null nếu previous=0 → undefined). */
  deltaPct: number | null
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? null : 0 // null → "mới có", không show %
  return Math.round(((curr - prev) / prev) * 100)
}

/** Range tuần hiện tại + tuần trước (dạng tuần lăn 7 ngày, không phải mốc thứ 2). */
export function rollingWindow(days: number) {
  const now = new Date()
  const currentStart = new Date(now.getTime() - days * 86400000)
  const previousStart = new Date(now.getTime() - days * 2 * 86400000)
  return { now, currentStart, previousStart }
}

/** Đếm News có `publishedAt` rơi vào khoảng N ngày qua. Phase 3.7 round 4
 *  (2026-04 — round B): đổi từ `createdAt` sang `publishedAt` để stats
 *  ngữ nghĩa "đăng mới" chính xác và khớp với /admin/tin-tuc filter
 *  "Ngày đăng". Bài draft (publishedAt=null) tự động bị loại. Bài import
 *  cũ (publishedAt < 30d) cũng không tính vào "đăng mới" — đúng intent. */
export async function countNewsCreated(days: number): Promise<StatPair> {
  const { currentStart, previousStart } = rollingWindow(days)
  const [current, previous] = await Promise.all([
    prisma.news.count({ where: { publishedAt: { gte: currentStart } } }),
    prisma.news.count({
      where: { publishedAt: { gte: previousStart, lt: currentStart } },
    }),
  ])
  return { current, previous, deltaPct: pctChange(current, previous) }
}

/** Đếm feed Post — chỉ PUBLISHED (draft/pending không tính là "hoạt động"). */
export async function countPostsCreated(days: number): Promise<StatPair> {
  const { currentStart, previousStart } = rollingWindow(days)
  const [current, previous] = await Promise.all([
    prisma.post.count({
      where: { createdAt: { gte: currentStart }, status: "PUBLISHED" },
    }),
    prisma.post.count({
      where: {
        createdAt: { gte: previousStart, lt: currentStart },
        status: "PUBLISHED",
      },
    }),
  ])
  return { current, previous, deltaPct: pctChange(current, previous) }
}

export type TopContributor = {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  role: string
  /** Số bài (post hoặc news, tùy nguồn). */
  count: number
}

/** Internal: groupBy authorId → join User → mảng TopContributor. */
async function aggregateAuthors(
  groups: Array<{ authorId: string; _count: { _all: number } }>,
): Promise<TopContributor[]> {
  if (groups.length === 0) return []
  const users = await prisma.user.findMany({
    where: { id: { in: groups.map((g) => g.authorId) } },
    select: { id: true, name: true, email: true, avatarUrl: true, role: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))
  return groups.flatMap((g) => {
    const u = userMap.get(g.authorId)
    if (!u) return []
    return [
      {
        userId: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        role: u.role,
        count: g._count._all,
      },
    ]
  })
}

/** Top hội viên đóng góp bài feed Post mới trong N ngày. Chỉ tính PUBLISHED. */
export async function topPostContributors(
  days: number,
  take = 10,
): Promise<TopContributor[]> {
  const { currentStart } = rollingWindow(days)
  const groups = await prisma.post.groupBy({
    by: ["authorId"],
    where: { createdAt: { gte: currentStart }, status: "PUBLISHED" },
    _count: { _all: true },
    orderBy: { _count: { authorId: "desc" } },
    take,
  })
  return aggregateAuthors(groups)
}

/** Top admin/staff đóng góp tin tức News mới trong N ngày. Phase 3.7
 *  round 4 (2026-04 — round B): đếm theo `publishedAt` (đã đăng), khớp
 *  ngữ nghĩa "đăng mới" + đồng bộ với stat cards. Bài draft / bài import
 *  publishedAt cũ không tính. */
export async function topNewsContributors(
  days: number,
  take = 10,
): Promise<TopContributor[]> {
  const { currentStart } = rollingWindow(days)
  const groups = await prisma.news.groupBy({
    by: ["authorId"],
    where: { publishedAt: { gte: currentStart } },
    _count: { _all: true },
    orderBy: { _count: { authorId: "desc" } },
    take,
  })
  return aggregateAuthors(groups)
}

export type DailyPoint = { date: string; count: number }

/** Daily count series cho sparkline. Trả mảng N điểm (sớm nhất → gần nhất),
 *  fill 0 cho ngày không có activity. Date key dạng "YYYY-MM-DD".
 *
 *  Phase 3.7 round 4 (2026-04 — round B): news dùng `publishedAt` (loại
 *  draft + import cũ), post dùng `createdAt` (Post không có publishedAt).
 *  Mỗi nguồn có ngữ nghĩa riêng nhưng cùng phản ánh "hoạt động đăng mới". */
export async function dailySeries(
  model: "news" | "post",
  days: number,
): Promise<DailyPoint[]> {
  const { currentStart, now } = rollingWindow(days)
  // SQL fast path. Prisma không có DATE() native nên dùng raw query qua
  // $queryRawUnsafe (an toàn — không có user input, table + field constants).
  const table = model === "news" ? "news" : "posts"
  const dateField = model === "news" ? "publishedAt" : "createdAt"
  const filter = model === "post" ? `AND status = 'PUBLISHED'` : ""
  const rows = await prisma.$queryRawUnsafe<Array<{ d: string; n: bigint }>>(
    `SELECT to_char(date_trunc('day', "${dateField}"), 'YYYY-MM-DD') as d,
            COUNT(*)::bigint as n
     FROM "${table}"
     WHERE "${dateField}" >= $1 ${filter}
     GROUP BY 1
     ORDER BY 1 ASC`,
    currentStart,
  )
  const map = new Map<string, number>()
  for (const r of rows) map.set(r.d, Number(r.n))

  // Fill missing days with 0 — sparkline cần liên tục để render mượt.
  const points: DailyPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() - (days - 1 - i) * 86400000)
    const key = d.toISOString().slice(0, 10)
    points.push({ date: key, count: map.get(key) ?? 0 })
  }
  return points
}
