/**
 * Helper sinh Member Card ID + tier theme cho thẻ hội viên.
 *
 * Format ID: VAWA-{YYYY}-{NNNN}
 * - YYYY: năm đăng ký (lấy từ user.createdAt)
 * - NNNN: 4 ký tự cuối của cuid user.id (uppercase) — ổn định, unique trong 99.99% case
 *
 * Vì cuid đã đảm bảo uniqueness, suffix 4 char từ cuid đủ cho ~65K users /
 * năm không trùng. Nếu cần strict unique 100%, thêm field `memberCardNumber`
 * vào User model (future).
 */

export function generateMemberCardId(userId: string, createdAt: Date): string {
  const year = createdAt.getFullYear()
  // Lấy 4 char cuối cuid (uppercase) — stable, readable
  const suffix = userId.slice(-4).toUpperCase()
  return `VAWA-${year}-${suffix}`
}

// ── Tier theme tokens ─────────────────────────────────────────────────────

export type TierKey = "basic" | "silver" | "gold" | "infinite"

export type TierTheme = {
  label: string
  stars: number
  /** Background của thẻ — CSS `background` hoàn chỉnh (có thể là gradient + ảnh) */
  background: string
  /** Màu border card */
  borderColor: string
  /** Màu text chính */
  textPrimary: string
  /** Màu text phụ (mô tả, hạn…) */
  textSecondary: string
  /** Màu accent (viền badge, line chia) */
  accent: string
  /** Màu badge tier (nền) */
  badgeBg: string
  /** Màu chữ badge */
  badgeText: string
  /** URL watermark pattern (optional — cho card Vàng ornament) */
  pattern?: string
}

export function tierFromStars(stars: number): TierKey {
  if (stars >= 4) return "infinite"
  if (stars >= 3) return "gold"
  if (stars >= 2) return "silver"
  return "basic"
}

/**
 * Resolve tier theo role + stars. Role INFINITE luôn thắng — card đen,
 * bất kể contributionTotal. Các role khác fallback theo stars (tier auto).
 */
export function tierFromRole(role: string | null | undefined, stars: number): TierKey {
  if (role === "INFINITE") return "infinite"
  return tierFromStars(stars)
}

export const TIER_THEMES: Record<TierKey, TierTheme> = {
  basic: {
    label: "Hội viên",
    stars: 1,
    background:
      "linear-gradient(135deg, #0b2e1f 0%, #14532d 50%, #0b2e1f 100%)",
    borderColor: "#22c55e",
    textPrimary: "#ecfdf5",
    textSecondary: "#a7f3d0",
    accent: "#34d399",
    badgeBg: "rgba(52, 211, 153, 0.18)",
    badgeText: "#bbf7d0",
  },
  silver: {
    label: "Hội viên Bạc",
    stars: 2,
    background:
      "linear-gradient(135deg, #64748b 0%, #cbd5e1 25%, #e5e7eb 50%, #cbd5e1 75%, #64748b 100%)",
    borderColor: "#94a3b8",
    textPrimary: "#1f2937",
    textSecondary: "#475569",
    accent: "#475569",
    badgeBg: "rgba(255, 255, 255, 0.6)",
    badgeText: "#1e293b",
  },
  gold: {
    label: "Hội viên Vàng",
    stars: 3,
    background:
      "linear-gradient(135deg, #7c5a1e 0%, #d4a574 20%, #faedc8 45%, #f4d77a 65%, #d4a574 85%, #7c5a1e 100%)",
    borderColor: "#b8861f",
    textPrimary: "#3d2817",
    textSecondary: "#5c3d1e",
    accent: "#7c5a1e",
    badgeBg: "rgba(124, 90, 30, 0.15)",
    badgeText: "#3d2817",
    pattern: "/partners-card-bg.webp", // reuse network pattern vàng
  },
  infinite: {
    label: "Hội viên Infinite",
    stars: 4,
    background:
      "linear-gradient(135deg, #000000 0%, #1a1a1a 35%, #2a2a2a 50%, #1a1a1a 65%, #000000 100%)",
    borderColor: "#d4af37",
    textPrimary: "#fafafa",
    textSecondary: "#d1d5db",
    accent: "#d4af37",
    badgeBg: "rgba(212, 175, 55, 0.18)",
    badgeText: "#f5e6a8",
  },
}

/** Tỉ lệ CR80 ID card: 1.586 : 1 */
export const CARD_ASPECT_RATIO = "85.6 / 54"
