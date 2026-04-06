"use client"

import dynamic from "next/dynamic"

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

export function DashboardChartsLoader(props: {
  revenueData: { month: string; membership: number; cert: number }[]
  tierData: { name: string; value: number }[]
}) {
  return <DashboardCharts {...props} />
}
