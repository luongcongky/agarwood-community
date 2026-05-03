/**
 * One-shot script: gán hạng cho leaders theo yêu cầu khách hàng.
 *  - Chủ tịch / Phó Chủ tịch  → INFINITE (card đen)
 *  - Còn lại trong Ban Thường vụ (BTV) → Vàng (bump contributionTotal ≥ goldThreshold)
 *  - Ban Chấp hành (BCH) + Ban Kiểm tra (BKT) → Bạc (silver ≤ contributionTotal < gold)
 *
 * Threshold lấy từ SiteConfig theo accountType của từng user.
 * Run: npx tsx scripts/promote-leaders-tier.ts
 */
import { readFileSync, existsSync } from "fs"

function loadEnvLocal(): void {
  if (!existsSync(".env.local")) return
  const content = readFileSync(".env.local", "utf-8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvLocal()

/* eslint-disable @typescript-eslint/no-require-imports */
const { prisma } = require("../lib/prisma") as typeof import("../lib/prisma")
const { getTierThresholds } = require("../lib/tier") as typeof import("../lib/tier")
/* eslint-enable @typescript-eslint/no-require-imports */

async function main() {
  const [bizT, indT] = await Promise.all([
    getTierThresholds("BUSINESS"),
    getTierThresholds("INDIVIDUAL"),
  ])
  console.log("Thresholds — BUSINESS:", bizT, "INDIVIDUAL:", indT)

  // Lấy mọi leader active. Nếu chưa link userId, tìm user theo tên (loose match).
  const rawLeaders = await prisma.leader.findMany({
    where: { isActive: true },
    select: { id: true, name: true, title: true, category: true, userId: true },
  })

  type Leader = {
    id: string
    title: string
    category: "BTV" | "BCH" | "BKT" | "HDTD"
    user: { id: string; name: string; accountType: "BUSINESS" | "INDIVIDUAL"; role: string; contributionTotal: number } | null
  }
  const leaders: Leader[] = []
  let backfilled = 0
  for (const l of rawLeaders) {
    let userRec = l.userId
      ? await prisma.user.findUnique({
          where: { id: l.userId },
          select: { id: true, name: true, accountType: true, role: true, contributionTotal: true },
        })
      : null
    if (!userRec) {
      const searchName = l.name.replace(/^(ThS\.|PGS\. TS|TS\.) /, "").trim()
      userRec = await prisma.user.findFirst({
        where: { name: { contains: searchName, mode: "insensitive" } },
        select: { id: true, name: true, accountType: true, role: true, contributionTotal: true },
      })
      if (userRec) {
        // Backfill leader.userId để lần sau khỏi mò
        await prisma.leader.update({ where: { id: l.id }, data: { userId: userRec.id } })
        backfilled++
      }
    }
    leaders.push({ id: l.id, title: l.title, category: l.category, user: userRec })
  }
  console.log(`Leaders: ${rawLeaders.length} · matched user: ${leaders.filter((x) => x.user).length} · backfilled link: ${backfilled}`)
  const unmatched = leaders.filter((x) => !x.user).map((x) => x.title)
  if (unmatched.length) console.log("⚠ Không match được user cho:", unmatched)

  const isPresidentTitle = (t: string) => /chủ tịch/i.test(t) // covers "Chủ tịch" + "Phó Chủ tịch"

  const infiniteIds = new Set<string>()
  const goldIds = new Set<string>()
  const silverIds = new Set<string>()

  for (const l of leaders) {
    if (!l.user) continue
    if (isPresidentTitle(l.title)) infiniteIds.add(l.user.id)
    else if (l.category === "BTV") goldIds.add(l.user.id)
    else if (l.category === "BCH" || l.category === "BKT") silverIds.add(l.user.id)
  }

  // Một user có nhiều vị trí — ưu tiên cao nhất thắng
  for (const id of infiniteIds) { goldIds.delete(id); silverIds.delete(id) }
  for (const id of goldIds) { silverIds.delete(id) }

  console.log(`Infinite: ${infiniteIds.size} · Vàng: ${goldIds.size} · Bạc: ${silverIds.size}`)

  // 1) INFINITE
  if (infiniteIds.size) {
    await prisma.user.updateMany({
      where: { id: { in: [...infiniteIds] } },
      data: { role: "INFINITE", isActive: true },
    })
  }

  // 2) Vàng + Bạc — contributionTotal phụ thuộc accountType
  const userMap = new Map<string, { accountType: "BUSINESS" | "INDIVIDUAL"; contributionTotal: number }>()
  for (const l of leaders) if (l.user) userMap.set(l.user.id, { accountType: l.user.accountType, contributionTotal: l.user.contributionTotal })

  async function bumpContribution(ids: Set<string>, tier: "gold" | "silver") {
    for (const id of ids) {
      const u = userMap.get(id)
      if (!u) continue
      const t = u.accountType === "INDIVIDUAL" ? indT : bizT
      const target =
        tier === "gold"
          ? Math.max(u.contributionTotal, t.gold + 1)
          : Math.max(t.silver + 1, Math.min(u.contributionTotal, t.gold - 1))
      // Khi tier=silver mà user hiện đang dưới silver → bump lên silver+1
      // Khi user đang ≥ gold → kéo về gold-1 để không vượt thành Vàng
      await prisma.user.update({
        where: { id },
        data: { contributionTotal: target },
      })
    }
  }

  await bumpContribution(goldIds, "gold")
  await bumpContribution(silverIds, "silver")

  console.log("Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
