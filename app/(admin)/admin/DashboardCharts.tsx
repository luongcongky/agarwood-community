"use client"

import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"

type RevenueData = { month: string; membership: number; cert: number }
type TierData = { name: string; value: number }

const TIER_COLORS = ["#92400e", "#b45309", "#d97706"]

export function DashboardCharts({
  revenueData,
  tierData,
}: {
  revenueData: RevenueData[]
  tierData: TierData[]
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* BarChart — Doanh thu theo tháng (stacked: membership + cert) */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-brand-900">Doanh thu theo tháng (triệu VND)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f0e8" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [
                `${value}tr`,
                name === "membership" ? "Phí hội viên" : "Phí chứng nhận",
              ]}
            />
            <Legend formatter={(v) => v === "membership" ? "Phí hội viên" : "Phí chứng nhận"} />
            <Bar dataKey="membership" stackId="a" fill="#b45309" radius={[0, 0, 0, 0]} />
            <Bar dataKey="cert" stackId="a" fill="#92400e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PieChart — Phân bố hạng hội viên */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-brand-900">Phân bố hạng hội viên</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={tierData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {tierData.map((_, i) => (
                <Cell key={i} fill={TIER_COLORS[i % TIER_COLORS.length]} />
              ))}
            </Pie>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip formatter={(value: any) => [value, "Hội viên"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
