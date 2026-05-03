import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { getRangeTotals } from "@/lib/ledger"
import { formatVnd } from "@/lib/certification-fee"
import { cn } from "@/lib/utils"
import { ChevronLeft, Download } from "lucide-react"
import {
  MonthlyBarChart,
  CategoryPie,
  type MonthlyPoint,
  type CategoryBreakdown,
} from "../_components/ReportCharts"

export const revalidate = 0

const MILLION = 1_000_000

export default async function BaoCaoPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) notFound()
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "ledger:read")) notFound()

  const params = await searchParams
  const now = new Date()
  const selectedYear = Number(params.year) || now.getUTCFullYear()

  const yearStart = new Date(Date.UTC(selectedYear, 0, 1))
  const nextYearStart = new Date(Date.UTC(selectedYear + 1, 0, 1))

  // Lấy danh sách năm có dữ liệu — render dropdown
  const yearAggMin = await prisma.ledgerTransaction.aggregate({
    _min: { transactionDate: true },
    _max: { transactionDate: true },
  })
  const minYear = yearAggMin._min.transactionDate
    ? yearAggMin._min.transactionDate.getUTCFullYear()
    : now.getUTCFullYear()
  const maxYear = yearAggMin._max.transactionDate
    ? yearAggMin._max.transactionDate.getUTCFullYear()
    : now.getUTCFullYear()
  const yearOptions: number[] = []
  for (let y = maxYear; y >= minYear; y--) yearOptions.push(y)
  if (!yearOptions.includes(selectedYear)) yearOptions.unshift(selectedYear)

  // Tổng năm
  const yearTotals = await getRangeTotals(yearStart, nextYearStart)

  // Phân bổ theo danh mục cho năm đã chọn (groupBy)
  const byCategory = await prisma.ledgerTransaction.groupBy({
    by: ["categoryId", "type"],
    where: { transactionDate: { gte: yearStart, lt: nextYearStart } },
    _sum: { amount: true },
  })

  const categoryIds = [...new Set(byCategory.map((g) => g.categoryId))]
  const categories = await prisma.ledgerCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, type: true },
  })
  const catMap = new Map(categories.map((c) => [c.id, c]))

  const incomeBreakdown: CategoryBreakdown[] = []
  const expenseBreakdown: CategoryBreakdown[] = []
  for (const g of byCategory) {
    const cat = catMap.get(g.categoryId)
    if (!cat) continue
    const valueMillion = Number(g._sum.amount ?? BigInt(0)) / MILLION
    const point = { name: cat.name, value: Number(valueMillion.toFixed(2)), type: g.type }
    if (g.type === "INCOME") incomeBreakdown.push(point)
    else expenseBreakdown.push(point)
  }
  incomeBreakdown.sort((a, b) => b.value - a.value)
  expenseBreakdown.sort((a, b) => b.value - a.value)

  // Theo tháng — 12 buckets
  const monthly: MonthlyPoint[] = []
  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(Date.UTC(selectedYear, m, 1))
    const monthEnd = new Date(Date.UTC(selectedYear, m + 1, 1))
    // Skip future months in current year — show vẫn 0 vẫn OK, giữ trục đầy đủ
    const t = await getRangeTotals(monthStart, monthEnd)
    monthly.push({
      month: String(m + 1).padStart(2, "0"),
      income: Number((t.income / MILLION).toFixed(2)),
      expense: Number((t.expense / MILLION).toFixed(2)),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <Link
            href="/admin/thu-chi"
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Tổng quan
          </Link>
          <h1 className="text-2xl font-bold text-brand-900 mt-1">
            Báo cáo tài chính {selectedYear}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <form method="get" className="flex items-center gap-2">
            <label className="text-xs text-brand-500">Năm:</label>
            <select
              name="year"
              defaultValue={selectedYear}
              className="rounded-md border border-brand-300 bg-white px-2 py-1.5 text-sm"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
            >
              Xem
            </button>
          </form>
          <a
            href={`/admin/thu-chi/so-quy/export?from=${selectedYear}-01-01&to=${selectedYear}-12-31`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            <Download className="h-3.5 w-3.5" /> Xuất Excel năm {selectedYear}
          </a>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Tổng thu" amount={yearTotals.income} positive />
        <SummaryCard label="Tổng chi" amount={yearTotals.expense} positive={false} />
        <SummaryCard
          label="Chênh lệch"
          amount={yearTotals.income - yearTotals.expense}
          positive={yearTotals.income - yearTotals.expense >= 0}
        />
      </div>

      {/* Monthly chart */}
      <MonthlyBarChart data={monthly} />

      {/* Pie charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryPie
          title={`Cơ cấu THU năm ${selectedYear}`}
          data={incomeBreakdown}
          type="INCOME"
        />
        <CategoryPie
          title={`Cơ cấu CHI năm ${selectedYear}`}
          data={expenseBreakdown}
          type="EXPENSE"
        />
      </div>

      {/* Detail tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownTable title="Chi tiết THU theo danh mục" rows={incomeBreakdown} />
        <BreakdownTable title="Chi tiết CHI theo danh mục" rows={expenseBreakdown} />
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  amount,
  positive,
}: {
  label: string
  amount: number
  positive: boolean
}) {
  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-5">
      <p className="text-xs text-brand-500 uppercase tracking-wide font-medium">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums mt-2",
          positive ? "text-emerald-700" : "text-red-700",
        )}
      >
        {positive && amount >= 0 ? "+" : amount < 0 ? "−" : ""}
        {formatVnd(Math.abs(amount))}
      </p>
    </div>
  )
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string
  rows: CategoryBreakdown[]
}) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  return (
    <div className="bg-white border border-brand-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-brand-200">
        <h3 className="text-sm font-semibold text-brand-900">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-center text-sm text-brand-500 py-8">Chưa có dữ liệu</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-xs text-brand-500 font-medium">
              <th className="text-left px-4 py-2">Danh mục</th>
              <th className="text-right px-4 py-2">Số tiền (tr)</th>
              <th className="text-right px-4 py-2 w-16">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="px-4 py-2 text-brand-800">{r.name}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">
                  {r.value.toLocaleString("vi-VN")}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-brand-500">
                  {total > 0 ? ((r.value / total) * 100).toFixed(1) : "0.0"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-brand-200 font-semibold bg-brand-50/50">
              <td className="px-4 py-2 text-brand-900">Tổng</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {total.toLocaleString("vi-VN")}
              </td>
              <td className="px-4 py-2 text-right text-brand-500 tabular-nums">100</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )
}
