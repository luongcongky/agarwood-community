"use client"

import { useState, type ReactNode } from "react"
import { CARD_ASPECT_RATIO } from "@/lib/memberCard"

/**
 * Wrapper flip 3D (CSS) — nhận 2 ReactNode (front, back) và tự toggle khi click.
 * Dùng container-queries-compatible: mọi font-size trong 2 face tính theo `cqw`.
 */
export function MemberCardFlip({
  front,
  back,
  className = "",
}: {
  front: ReactNode
  back: ReactNode
  className?: string
}) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className={`relative w-full cursor-pointer ${className}`}
      style={{
        aspectRatio: CARD_ASPECT_RATIO,
        perspective: "1200px",
        containerType: "inline-size",
      }}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={flipped ? "Lật lại mặt trước" : "Lật xem mặt sau"}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setFlipped((f) => !f)
        }
      }}
    >
      <div
        className="relative w-full h-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          {front}
        </div>
        {/* Back */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {back}
        </div>
      </div>
    </div>
  )
}
