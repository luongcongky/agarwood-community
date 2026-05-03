/**
 * ledger-utils.ts — Pure, client-safe utility functions for the ledger module.
 * No server-only imports. Safe to use in both Server and Client Components.
 */

/** Format ngày DD/MM/YYYY (Vietnamese). */
export function formatLedgerDate(d: Date): string {
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/** Parse "YYYY-MM-DD" thành Date UTC midnight — match Postgres DATE column. */
export function parseDateInput(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const [, y, mo, d] = m
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)))
  if (Number.isNaN(date.getTime())) return null
  return date
}

/** Format BigInt amount cho input value display. Không thêm "đ" suffix. */
export function formatAmountInput(v: number | bigint): string {
  return Number(v).toLocaleString("vi-VN")
}

/** Parse user input (vd "1.500.000" hoặc "1500000") → number nguyên đồng. */
export function parseAmountInput(s: string): number | null {
  const cleaned = s.replace(/[.,\s]/g, "")
  if (!/^\d+$/.test(cleaned)) return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) return null
  return n
}
