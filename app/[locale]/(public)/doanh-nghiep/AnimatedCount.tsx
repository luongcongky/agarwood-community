"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Stats counter — tween từ 0 → value trong `duration`ms với ease-out cubic.
 * Dùng requestAnimationFrame, no deps. Format số kèm separator vi-VN khi
 * value ≥ 1000 để khớp typography của trang.
 */
export function AnimatedCount({
  value,
  suffix = "",
  duration = 1500,
}: {
  value: number
  suffix?: string
  duration?: number
}) {
  const [n, setN] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    function tick(t: number) {
      if (startRef.current === null) startRef.current = t
      const elapsed = t - startRef.current
      const p = Math.min(1, elapsed / duration)
      // ease-out cubic — fast start, gentle settle
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  const formatted = value >= 1000 ? n.toLocaleString("vi-VN") : String(n)
  return (
    <>
      {formatted}
      {suffix}
    </>
  )
}
