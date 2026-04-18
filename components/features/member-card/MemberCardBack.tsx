import { TIER_THEMES, CARD_ASPECT_RATIO, type TierKey } from "@/lib/memberCard"

export function MemberCardBack({
  tier,
  memberCardId,
  qrDataUrl,
  verifyUrl,
  associationEmail,
  associationPhone,
  associationWebsite,
  className = "",
  labels,
}: {
  tier: TierKey
  memberCardId: string
  qrDataUrl: string | null // data:image/png;base64 QR
  verifyUrl: string
  associationEmail: string
  associationPhone: string
  associationWebsite: string
  className?: string
  /** Optional i18n labels. Falls back to Vietnamese defaults when omitted. */
  labels?: {
    verifyMember?: string
    qrAlt?: string
    established?: string
  }
}) {
  const theme = TIER_THEMES[tier]
  const verifyMemberLabel = labels?.verifyMember ?? "Xác thực thành viên"
  const qrAlt = labels?.qrAlt ?? "QR xác thực hội viên"
  const establishedText =
    labels?.established ??
    "Thành lập theo Quyết định số 23/QĐ-BNV ngày 11/01/2010 của Bộ Nội Vụ."

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
      {/* Pattern watermark */}
      {theme.pattern && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(${theme.pattern})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "overlay",
          }}
        />
      )}

      {/* Sheen */}
      {(tier === "silver" || tier === "gold") && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.3) 50%, transparent 65%)",
          }}
        />
      )}

      <div className="relative h-full p-[4%] flex gap-3">
        {/* QR */}
        <div className="flex flex-col items-center shrink-0 w-[30%]">
          <div
            className="w-full aspect-square rounded-md overflow-hidden flex items-center justify-center"
            style={{ background: "#fff" }}
          >
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={qrAlt}
                className="w-full h-full object-contain p-[4%]"
              />
            ) : (
              <div
                className="text-center"
                style={{ fontSize: "clamp(6px, 1.4cqw, 9px)", color: "#888" }}
              >
                QR
              </div>
            )}
          </div>
          <p
            className="mt-1 uppercase tracking-wider text-center font-semibold"
            style={{
              color: theme.textSecondary,
              fontSize: "clamp(5px, 1.1cqw, 7px)",
            }}
          >
            {verifyMemberLabel}
          </p>
        </div>

        {/* Text content bên phải */}
        <div className="flex-1 min-w-0 flex flex-col">
          <p
            className="font-bold uppercase leading-tight whitespace-nowrap"
            style={{
              color: theme.textPrimary,
              fontSize: "clamp(8px, 2cqw, 12px)",
            }}
          >
            Hội Trầm Hương Việt Nam
          </p>
          <p
            className="uppercase tracking-widest mt-0.5 whitespace-nowrap"
            style={{
              color: theme.textSecondary,
              fontSize: "clamp(4px, 1cqw, 7px)",
              letterSpacing: "0.12em",
            }}
          >
            Vietnam Agarwood Association · VAWA
          </p>

          <div
            className="my-1.5 h-px opacity-40"
            style={{ background: theme.accent }}
          />

          <p
            className="leading-snug"
            style={{
              color: theme.textSecondary,
              fontSize: "clamp(6px, 1.5cqw, 9px)",
            }}
          >
            {establishedText}
          </p>

          <div className="mt-auto space-y-0.5">
            <div
              className="flex items-center gap-1 truncate"
              style={{
                color: theme.textSecondary,
                fontSize: "clamp(6px, 1.4cqw, 9px)",
              }}
            >
              <span>✉</span>
              <span className="truncate">{associationEmail}</span>
            </div>
            <div
              className="flex items-center gap-1"
              style={{
                color: theme.textSecondary,
                fontSize: "clamp(6px, 1.4cqw, 9px)",
              }}
            >
              <span>☎</span>
              <span>{associationPhone}</span>
            </div>
            <div
              className="flex items-center gap-1 truncate"
              style={{
                color: theme.textSecondary,
                fontSize: "clamp(6px, 1.4cqw, 9px)",
              }}
            >
              <span>🌐</span>
              <span className="truncate">
                {associationWebsite.replace(/^https?:\/\//, "")}
              </span>
            </div>
          </div>

          <p
            className="mt-1.5 font-mono font-bold text-right"
            style={{
              color: theme.textPrimary,
              fontSize: "clamp(6px, 1.5cqw, 9px)",
            }}
          >
            {memberCardId}
          </p>
        </div>
      </div>

      {/* URL verify (giấu nhỏ dưới cùng, fallback khi không scan được QR) */}
      <p
        className="absolute bottom-[2%] left-[4%] font-mono opacity-50 truncate max-w-[60%]"
        style={{
          color: theme.textSecondary,
          fontSize: "clamp(4px, 1cqw, 6px)",
        }}
        title={verifyUrl}
      >
        {verifyUrl.replace(/^https?:\/\//, "")}
      </p>
    </div>
  )
}
