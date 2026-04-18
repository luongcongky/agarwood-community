import Image from "next/image"
import { TIER_THEMES, type TierKey, CARD_ASPECT_RATIO } from "@/lib/memberCard"

export type MemberCardData = {
  name: string
  avatarUrl: string | null
  title: string | null // chức vụ ("Chủ tịch Hội")
  companyName: string | null
  memberCategory: "OFFICIAL" | "AFFILIATE" | "HONORARY"
  memberCardId: string // VAWA-YYYY-XXXX
  validFrom: Date | null // joined / membership start
  validTo: Date | null // membershipExpires
  tier: TierKey
}

/** Format as MM.YYYY (e.g. 04.2026). Locale-agnostic so it reads the same
 *  in VI / EN / ZH. */
function formatMonthYear(d: Date | null): string {
  if (!d) return ""
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${m}.${d.getFullYear()}`
}

/** Default membership span in years when admin hasn't set an explicit expiry
 *  date. Member cards are issued for 5 years (matches the association's
 *  "Nhiệm kỳ 5 năm" term cycle). */
const DEFAULT_MEMBERSHIP_YEARS = 5

function addYears(d: Date, years: number): Date {
  const next = new Date(d)
  next.setFullYear(next.getFullYear() + years)
  return next
}

export function MemberCardFront({
  data,
  className = "",
  labels,
}: {
  data: MemberCardData
  className?: string
  /** Optional i18n labels. When omitted, falls back to Vietnamese defaults so
   *  callers that don't yet localize still render correctly. */
  labels?: {
    cardId?: string
    validity?: string
  }
}) {
  const theme = TIER_THEMES[data.tier]
  const cardIdLabel = labels?.cardId ?? "Mã thẻ"
  const validityLabel = labels?.validity ?? "Hiệu lực"
  // Compact tier badge suffix. Default replaces the "Hội viên" prefix so VI
  // themes render as "Bạc" / "Vàng" / "Infinite"; for the infinite tier we
  // collapse to a compact ∞ so the wide "★★★★ Infinite" pill doesn't push
  // into the brand name text on narrow CR80 cards.
  const tierBadgeSuffix =
    data.tier === "infinite"
      ? "∞"
      : theme.label.replace("Hội viên", "").trim() || "Basic"
  const tierBadgeStars = data.tier === "infinite" ? "" : "★".repeat(theme.stars)

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl shadow-xl ${className}`}
      style={{
        aspectRatio: CARD_ASPECT_RATIO,
        background: theme.background,
        border: `1.5px solid ${theme.borderColor}`,
        color: theme.textPrimary,
      }}
    >
      {/* Pattern watermark — cho tier gold */}
      {theme.pattern && (
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `url(${theme.pattern})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "overlay",
          }}
        />
      )}

      {/* Sheen / gloss effect cho bạc + vàng */}
      {(data.tier === "silver" || data.tier === "gold") && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)",
          }}
        />
      )}

      <div className="relative h-full p-[4%] flex flex-col">
        {/* Header: Logo + Tier badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="relative w-[18%] aspect-square shrink-0 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.85)" }}
            >
              <Image src="/logo.png" alt="VAWA" fill className="object-contain p-[8%]" sizes="60px" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="font-bold uppercase leading-tight truncate"
                style={{
                  color: theme.textPrimary,
                  fontSize: "clamp(7px, 2cqw, 12px)",
                }}
              >
                Hội Trầm Hương Việt Nam
              </p>
              <p
                className="uppercase tracking-widest truncate"
                style={{
                  color: theme.textSecondary,
                  fontSize: "clamp(4px, 1.1cqw, 7px)",
                  letterSpacing: "0.12em",
                }}
              >
                Vietnam Agarwood Association
              </p>
            </div>
          </div>

          {/* Tier badge */}
          <div
            className="shrink-0 rounded-md px-2 py-0.5 font-bold whitespace-nowrap"
            style={{
              background: theme.badgeBg,
              color: theme.badgeText,
              border: `1px solid ${theme.accent}`,
              fontSize: "clamp(7px, 1.6cqw, 10px)",
            }}
          >
            {tierBadgeStars ? `${tierBadgeStars} ` : ""}
            {tierBadgeSuffix}
          </div>
        </div>

        {/* Body: Avatar + name */}
        <div className="flex-1 flex items-center gap-3 mt-[3%]">
          {/* Avatar vuông */}
          <div
            className="relative aspect-4/5 w-[20%] shrink-0 rounded-md overflow-hidden"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            {data.avatarUrl ? (
              <Image
                src={data.avatarUrl}
                alt={data.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-bold"
                style={{ color: theme.textPrimary, fontSize: "clamp(14px, 4cqw, 28px)" }}
              >
                {data.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + title + company */}
          <div className="min-w-0 flex-1">
            <p
              className="font-bold uppercase leading-tight truncate"
              style={{
                color: theme.textPrimary,
                fontSize: "clamp(11px, 3cqw, 18px)",
              }}
              title={data.name}
            >
              {data.name}
            </p>
            {data.title && (
              <p
                className="mt-1 truncate"
                style={{
                  color: theme.textSecondary,
                  fontSize: "clamp(7px, 1.8cqw, 11px)",
                }}
              >
                {data.title}
              </p>
            )}
            {data.companyName && (
              <p
                className="mt-0.5 line-clamp-2"
                style={{
                  color: theme.textSecondary,
                  fontSize: "clamp(7px, 1.7cqw, 10px)",
                  lineHeight: 1.2,
                }}
                title={data.companyName}
              >
                {data.companyName}
              </p>
            )}
          </div>
        </div>

        {/* Footer: Card ID + validity */}
        <div
          className="flex items-end justify-between gap-2"
          style={{ color: theme.textSecondary }}
        >
          <div>
            <p
              className="uppercase tracking-wider"
              style={{
                fontSize: "clamp(5px, 1.2cqw, 7px)",
                color: theme.textSecondary,
                opacity: 0.8,
              }}
            >
              {cardIdLabel}
            </p>
            <p
              className="font-mono font-bold"
              style={{
                color: theme.textPrimary,
                fontSize: "clamp(8px, 2cqw, 12px)",
              }}
            >
              {data.memberCardId}
            </p>
          </div>
          {(data.validFrom || data.validTo) && (
            <div className="text-right">
              <p
                className="uppercase tracking-wider"
                style={{
                  fontSize: "clamp(5px, 1.2cqw, 7px)",
                  opacity: 0.8,
                }}
              >
                {validityLabel}
              </p>
              <p
                className="font-semibold"
                style={{
                  color: theme.textPrimary,
                  fontSize: "clamp(8px, 1.8cqw, 11px)",
                }}
              >
                {formatMonthYear(data.validFrom)} —{" "}
                {formatMonthYear(
                  data.validTo ??
                    (data.validFrom ? addYears(data.validFrom, DEFAULT_MEMBERSHIP_YEARS) : null),
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
