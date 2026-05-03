"use client"

import {
  BarChart,
  Bar,
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

export type MonthlyPoint = {
  month: string // "01", "02", ...
  income: number // triệu VND
  expense: number
}

export type CategoryBreakdown = {
  name: string
  value: number // triệu VND
  type: "INCOME" | "EXPENSE"
}

const INCOME_PALETTE = ["#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"]
const EXPENSE_PALETTE = ["#b91c1c", "#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2"]

export function MonthlyBarChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-brand-900">
        Thu chi theo tháng (triệu VND)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f0e8" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [
              `${Number(value).toLocaleString("vi-VN")} tr`,
              name === "income" ? "Thu" : "Chi",
            ]}
          />
          <Legend formatter={(v) => (v === "income" ? "Thu" : "Chi")} />
          <Bar dataKey="income" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryPie({
  title,
  data,
  type,
}: {
  title: string
  data: CategoryBreakdown[]
  type: "INCOME" | "EXPENSE"
}) {
  const palette = type === "INCOME" ? INCOME_PALETTE : EXPENSE_PALETTE
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-brand-900">{title}</h3>
        <p className="text-center text-sm text-brand-500 py-12">Chưa có dữ liệu</p>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-brand-900">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={100}
            dataKey="value"
            label={({ name, percent }) =>
              `${name}: ${((percent || 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")} tr`, "Số tiền"]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
