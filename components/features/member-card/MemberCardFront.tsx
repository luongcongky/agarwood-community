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

function formatDate(d: Date | null): string {
  if (!d) return ""
  return d.toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })
}

export function MemberCardFront({
  data,
  className = "",
}: {
  data: MemberCardData
  className?: string
}) {
  const theme = TIER_THEMES[data.tier]

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
            <div className="min-w-0">
              <p
                className="font-bold uppercase leading-tight whitespace-nowrap"
                style={{
                  color: theme.textPrimary,
                  fontSize: "clamp(7px, 2cqw, 12px)",
                }}
              >
                Hội Trầm Hương Việt Nam
              </p>
              <p
                className="uppercase tracking-widest whitespace-nowrap"
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
            {"★".repeat(theme.stars)} {theme.label.replace("Hội viên", "").trim() || "Basic"}
          </div>
        </div>

        {/* Body: Avatar + name */}
        <div className="flex-1 flex items-center gap-3 mt-[3%]">
          {/* Avatar vuông */}
          <div
            className="relative aspect-[4/5] w-[20%] shrink-0 rounded-md overflow-hidden"
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
                className="mt-0.5 truncate"
                style={{
                  color: theme.textSecondary,
                  fontSize: "clamp(7px, 1.7cqw, 10px)",
                }}
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
              Mã thẻ
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
                Hiệu lực
              </p>
              <p
                className="font-semibold"
                style={{
                  color: theme.textPrimary,
                  fontSize: "clamp(8px, 1.8cqw, 11px)",
                }}
              >
                {formatDate(data.validFrom)} — {formatDate(data.validTo) || "∞"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
