import { prisma } from "./prisma"

export type TierInfo = {
  label: string
  stars: number
  next: string | null
  needMore: number
}

export type AccountType = "BUSINESS" | "INDIVIDUAL"

// Cache tier config for 60 seconds to avoid DB query on every render
let cachedConfig: {
  business: { silver: number; gold: number }
  individual: { silver: number; gold: number }
  ts: number
} | null = null
const CACHE_TTL = 60_000

const TIER_KEYS = [
  "tier_silver_threshold",
  "tier_gold_threshold",
  "individual_tier_silver",
  "individual_tier_gold",
]

/**
 * Get tier thresholds from SiteConfig (cached 60s).
 * Returns thresholds for both account types.
 */
export async function getTierThresholds(accountType?: AccountType): Promise<{ silver: number; gold: number }> {
  if (!cachedConfig || Date.now() - cachedConfig.ts >= CACHE_TTL) {
    const configs = await prisma.siteConfig.findMany({
      where: { key: { in: TIER_KEYS } },
    })
    const map = Object.fromEntries(configs.map((c) => [c.key, c.value]))

    cachedConfig = {
      business: {
        silver: Number(map.tier_silver_threshold) || 10_000_000,
        gold: Number(map.tier_gold_threshold) || 20_000_000,
      },
      individual: {
        silver: Number(map.individual_tier_silver) || 3_000_000,
        gold: Number(map.individual_tier_gold) || 5_000_000,
      },
      ts: Date.now(),
    }
  }

  if (accountType === "INDIVIDUAL") return cachedConfig.individual
  return cachedConfig.business
}

/**
 * Calculate tier from contribution total (async — reads SiteConfig).
 */
export async function getMemberTier(contributionTotal: number, accountType?: AccountType): Promise<TierInfo> {
  const { silver, gold } = await getTierThresholds(accountType)
  return calcTier(contributionTotal, silver, gold)
}

/**
 * Calculate tier from contribution total (sync — needs thresholds passed in).
 * Use this in client components where you can't call async.
 */
export function calcTier(
  contributionTotal: number,
  silverThreshold: number = 10_000_000,
  goldThreshold: number = 20_000_000,
): TierInfo {
  if (contributionTotal >= goldThreshold) {
    return { label: "Hội viên Vàng", stars: 3, next: null, needMore: 0 }
  }
  if (contributionTotal >= silverThreshold) {
    return { label: "Hội viên Bạc", stars: 2, next: "Vàng", needMore: goldThreshold - contributionTotal }
  }
  return { label: "Hội viên", stars: 1, next: "Bạc", needMore: silverThreshold - contributionTotal }
}
