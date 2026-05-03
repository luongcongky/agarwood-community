/**
 * Pure formatters/parsers cho ledger — KHÔNG có DB query, an toàn import từ
 * client component. Tách khỏi `lib/ledger.ts` (server-only) để tránh lỗi
 * "you're importing a component that needs server-only".
 */

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
