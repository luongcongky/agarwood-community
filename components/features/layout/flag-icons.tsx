import type { Locale } from "@/i18n/config"

// Inline SVG flag icons — no external deps. All use 30×20 viewBox (3:2 aspect)
// so they scale uniformly inside the locale switcher.

interface FlagProps {
  className?: string
}

export function FlagVN({ className }: FlagProps) {
  return (
    <svg
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Vietnam"
    >
      <rect width="30" height="20" fill="#DA251D" />
      <polygon
        points="15,5.5 16.47,10.03 21.22,10.03 17.38,12.83 18.85,17.36 15,14.56 11.15,17.36 12.62,12.83 8.78,10.03 13.53,10.03"
        fill="#FFFF00"
      />
    </svg>
  )
}

export function FlagCN({ className }: FlagProps) {
  return (
    <svg
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="China"
    >
      <rect width="30" height="20" fill="#DE2910" />
      {/* Big star */}
      <polygon
        points="6,3 6.96,5.94 10,5.94 7.52,7.76 8.48,10.7 6,8.88 3.52,10.7 4.48,7.76 2,5.94 5.04,5.94"
        fill="#FFDE00"
      />
      {/* 4 small stars */}
      <polygon
        points="11,1.2 11.27,2.04 12.15,2.04 11.44,2.56 11.71,3.4 11,2.88 10.29,3.4 10.56,2.56 9.85,2.04 10.73,2.04"
        fill="#FFDE00"
      />
      <polygon
        points="13,3.5 13.27,4.34 14.15,4.34 13.44,4.86 13.71,5.7 13,5.18 12.29,5.7 12.56,4.86 11.85,4.34 12.73,4.34"
        fill="#FFDE00"
      />
      <polygon
        points="13,6.5 13.27,7.34 14.15,7.34 13.44,7.86 13.71,8.7 13,8.18 12.29,8.7 12.56,7.86 11.85,7.34 12.73,7.34"
        fill="#FFDE00"
      />
      <polygon
        points="11,8.8 11.27,9.64 12.15,9.64 11.44,10.16 11.71,11 11,10.48 10.29,11 10.56,10.16 9.85,9.64 10.73,9.64"
        fill="#FFDE00"
      />
    </svg>
  )
}

export function FlagEN({ className }: FlagProps) {
  // St. George's Cross (England). Using 3:2 aspect to match siblings even
  // though the real flag is 5:3 — keeps the switcher visually uniform.
  return (
    <svg
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="England"
    >
      <rect width="30" height="20" fill="#FFFFFF" />
      <rect x="13" width="4" height="20" fill="#CE1124" />
      <rect y="8" width="30" height="4" fill="#CE1124" />
    </svg>
  )
}

const FLAGS: Record<Locale, (props: FlagProps) => React.ReactElement> = {
  vi: FlagVN,
  en: FlagEN,
  zh: FlagCN,
}

export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  const Component = FLAGS[locale]
  return <Component className={className} />
}
