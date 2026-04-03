"use client"

import { useSyncExternalStore } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface MonthlyRevenueData {
  month: string
  revenue: number
}

interface MonthlyMembersData {
  month: string
  members: number
}

interface FeeDistributionData {
  name: string
  value: number
}

interface DashboardChartsProps {
  revenueData: MonthlyRevenueData[]
  membersData: MonthlyMembersData[]
  feeDistribution: FeeDistributionData[]
}

const PIE_COLORS = ["#92400e", "#d97706"]

export function DashboardCharts({
  revenueData,
  membersData,
  feeDistribution,
}: DashboardChartsProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-[350px] rounded-xl border bg-brand-50/50 animate-pulse lg:col-span-2" />
        <div className="h-[350px] rounded-xl border bg-brand-50/50 animate-pulse" />
        <div className="h-[350px] rounded-xl border bg-brand-50/50 animate-pulse" />
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Bar Chart — Doanh thu theo tháng */}
      <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold text-brand-900">
          Doanh thu theo tháng (triệu VND)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f0e8" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value} triệu`, "Doanh thu"]}
            />
            <Bar dataKey="revenue" fill="#b45309" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart — Hội viên mới theo tháng */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-brand-900">
          Hội viên mới theo tháng
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={membersData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f0e8" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [value, "Hội viên mới"]}
            />
            <Line
              type="monotone"
              dataKey="members"
              stroke="#b45309"
              strokeWidth={2}
              dot={{ fill: "#b45309", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart — Phân bố mức đóng phí */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-brand-900">
          Phân bố mức đóng phí
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={feeDistribution}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${((percent || 0) * 100).toFixed(0)}%`
              }
            >
              {feeDistribution.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [value, "Hội viên"]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
