import React from "react"

interface Props {
  size?: number
  delay?: number
  className?: string
}

/**
 * Premium "Wax Seal" badge for certified products.
 * Features: Scalloped edges, metallic gold gradient, glossy overlay, and drop shadow.
 */
export function CertifiedSeal({ size = 56, delay = 0, className }: Props) {
  return (
    <div
      className={`cp-stamp group relative flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        "--d": `${delay}ms`,
      } as React.CSSProperties}
      aria-label="Chứng nhận chính thức từ Hội Trầm Hương Việt Nam"
    >
      {/* Scalloped Seal Shape (SVG) */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
      >
        <path
          d="M50 0 L58 5 L68 2 L75 10 L85 10 L88 20 L97 25 L95 35 L100 45 L95 55 L97 65 L88 75 L85 85 L75 85 L68 95 L58 92 L50 100 L42 92 L32 95 L25 85 L15 85 L12 75 L3 65 L5 55 L0 45 L5 35 L3 25 L12 20 L15 10 L25 10 L32 2 L42 5 Z"
          fill="url(#seal-gold-gradient-shared)"
          stroke="#92400E"
          strokeWidth="1.5"
        />
        <defs>
          <linearGradient id="seal-gold-gradient-shared" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="45%" stopColor="#D97706" />
            <stop offset="55%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>
      </svg>

      {/* Glossy Overlay */}
      <div className="absolute inset-1.5 rounded-full bg-linear-to-br from-white/45 to-transparent pointer-events-none opacity-60" />

      {/* Content - Center Star only */}
      <div className="relative z-10 flex items-center justify-center pointer-events-none">
        <div 
          className="text-amber-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" 
          style={{ fontSize: size * 0.5 }}
        >
          ★
        </div>
      </div>

      {/* Professional Tooltip - Positioned to stay inside card boundary */}
      <div className="pointer-events-none absolute top-full right-0 mt-3 w-40 opacity-0 transition-all duration-200 group-hover:translate-y-[-4px] group-hover:opacity-100 z-50">
        <div className="relative rounded-lg bg-stone-900/95 px-2.5 py-2 text-center text-[10px] font-medium leading-normal text-white shadow-2xl ring-1 ring-white/20 backdrop-blur-sm">
          Sản phẩm đạt chứng nhận chính thức từ Hội Trầm Hương Việt Nam
          {/* Tooltip Arrow */}
          <div className="absolute -top-1 right-4 h-2 w-2 rotate-45 bg-stone-900 ring-t ring-l ring-white/20" />
        </div>
      </div>
    </div>
  )
}
