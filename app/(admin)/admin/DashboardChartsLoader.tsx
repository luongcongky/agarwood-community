"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"

const DashboardCharts = dynamic(
  () => import("./DashboardCharts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[350px] rounded-xl border bg-brand-50/50 animate-pulse" />
        <div className="h-[350px] rounded-xl border bg-brand-50/50 animate-pulse" />
      </div>
    ),
  },
)

type Props = {
  revenueData: { month: string; membership: number; cert: number }[]
  tierData: { name: string; value: number }[]
}

/**
 * Chỉ load + hydrate recharts khi chart area thật sự scroll vào viewport.
 * Recharts ~130 kB minified + hydrate cost ~400-600 ms trên mobile chậm.
 * Admin dashboard thường cuộn qua ActionQueueBadges + Alert Panel trước → lãng
 * phí nếu eager-load charts khi user chưa nhìn tới.
 *
 * rootMargin "200px" để bắt đầu fetch chunk ngay khi user gần tới, giảm
 * spinner time khi scroll.
 */
export function DashboardChartsLoader(props: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            io.disconnect()
            return
          }
        }
      },
      { rootMargin: "200px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible])

  return (
    <div ref={ref} className="min-h-[350px]">
      {visible ? (
        <DashboardCharts {...props} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[350px] rounded-xl border border-brand-200 bg-brand-50/30 flex items-center justify-center text-xs text-brand-400">
            Biểu đồ sẽ tải khi cuộn tới…
          </div>
          <div className="h-[350px] rounded-xl border border-brand-200 bg-brand-50/30 flex items-center justify-center text-xs text-brand-400">
            Biểu đồ sẽ tải khi cuộn tới…
          </div>
        </div>
      )}
    </div>
  )
}
