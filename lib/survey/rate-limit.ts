import "server-only"

/**
 * In-memory rate limiter đơn giản cho public endpoints khảo sát.
 * Phù hợp single-instance deploy. Nếu scale multi-instance cần chuyển Redis/Upstash.
 */

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

/**
 * Trả về true nếu request được phép, false nếu bị giới hạn.
 * `key` = IP + endpoint để tách quota từng loại.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; resetInMs: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetInMs: windowMs }
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetInMs: bucket.resetAt - now }
  }

  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, resetInMs: bucket.resetAt - now }
}

/** Lấy IP từ headers của request Next.js (ưu tiên Vercel, fallback headers chuẩn). */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  )
}

// Dọn buckets cũ mỗi 5 phút để tránh memory leak
if (typeof globalThis !== "undefined" && !(globalThis as Record<string, unknown>).__rlCleanup) {
  ;(globalThis as Record<string, unknown>).__rlCleanup = setInterval(() => {
    const now = Date.now()
    for (const [k, v] of buckets.entries()) {
      if (v.resetAt < now) buckets.delete(k)
    }
  }, 5 * 60 * 1000)
}
