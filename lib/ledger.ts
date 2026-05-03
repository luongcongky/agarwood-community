import "server-only"
import { prisma } from "@/lib/prisma"
import type { LedgerType, PaymentType } from "@prisma/client"
export { formatLedgerDate, parseDateInput, formatAmountInput, parseAmountInput } from "@/lib/ledger-utils"

/**
 * Sổ quỹ — single-account, ghi nhận thực tế. Số dư = SUM(income) - SUM(expense)
 * tính trên TOÀN BỘ transaction (kể cả "Số dư đầu kỳ").
 *
 * amount lưu BigInt VND nguyên đồng. Convert sang Number ở biên Server→Client
 * (VND không vượt 2^53). UI helper formatVnd ở `lib/certification-fee.ts` đã
 * accept `number | bigint` — tái sử dụng.
 */

export const OPENING_BALANCE_CATEGORY_ID = "lcat_opening_balance"

/** Map PaymentType → categoryId khi auto-tạo ledger entry từ /admin/thanh-toan. */
export const PAYMENT_TYPE_TO_CATEGORY: Record<PaymentType, string> = {
  MEMBERSHIP_FEE: "lcat_membership_fee",
  CERTIFICATION_FEE: "lcat_certification",
  BANNER_FEE: "lcat_banner",
  MEDIA_SERVICE: "lcat_media_service",
}

/** Số dư hiện tại (gồm cả opening balance) tính theo nguyên đồng. */
export async function getCurrentBalance(): Promise<number> {
  const [income, expense] = await Promise.all([
    prisma.ledgerTransaction.aggregate({
      where: { type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.ledgerTransaction.aggregate({
      where: { type: "EXPENSE" },
      _sum: { amount: true },
    }),
  ])
  const inc = income._sum.amount ?? BigInt(0)
  const exp = expense._sum.amount ?? BigInt(0)
  return Number(inc - exp)
}

/** Tổng thu/chi trong khoảng [from, to). Dùng cho dashboard + báo cáo. */
export async function getRangeTotals(from: Date, toExclusive: Date) {
  const [income, expense] = await Promise.all([
    prisma.ledgerTransaction.aggregate({
      where: { type: "INCOME", transactionDate: { gte: from, lt: toExclusive } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.ledgerTransaction.aggregate({
      where: { type: "EXPENSE", transactionDate: { gte: from, lt: toExclusive } },
      _sum: { amount: true },
      _count: true,
    }),
  ])
  return {
    income: Number(income._sum.amount ?? BigInt(0)),
    expense: Number(expense._sum.amount ?? BigInt(0)),
    incomeCount: income._count,
    expenseCount: expense._count,
  }
}

/** Có giao dịch số dư đầu kỳ chưa? Dashboard show wizard nếu chưa. */
export async function hasOpeningBalance(): Promise<boolean> {
  const c = await prisma.ledgerTransaction.count({
    where: { categoryId: OPENING_BALANCE_CATEGORY_ID },
  })
  return c > 0
}

/** Lấy categories để render dropdown. Ẩn isActive=false. */
export async function getActiveCategories(type?: LedgerType) {
  return prisma.ledgerCategory.findMany({
    where: { isActive: true, ...(type ? { type } : {}) },
    orderBy: [{ type: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      displayOrder: true,
      isSystem: true,
    },
  })
}

