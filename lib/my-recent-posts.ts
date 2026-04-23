/**
 * Client-side "sticky zone" cho bài vừa đăng của chính viewer.
 *
 * Vấn đề: feed rank by `authorPriority DESC` — user mới (priority=0) đăng xong
 * bị đẩy xuống dưới VIP. Giải pháp "option nhẹ": lưu bài vừa đăng vào
 * localStorage với TTL, prepend vào feed khi viewer === author. Không động
 * tới server — chỉ cải thiện UX cho chính owner, viewer khác vẫn thấy rank
 * thật.
 *
 * Persistence: localStorage (survive reload, navigation). TTL 2h — sau đó
 * bài hoặc đã lên bằng rank thật, hoặc user không quan tâm nữa.
 */

const KEY = "myRecentPosts"
const TTL_MS = 2 * 60 * 60 * 1000 // 2h

type Entry<P> = { savedAt: number; userId: string; post: P }

function read<P>(): Entry<P>[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Entry<P>[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write<P>(entries: Entry<P>[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries))
  } catch {
    /* quota/serialization errors ignored — sticky zone is best-effort */
  }
}

/** Append bài mới. Nếu đã tồn tại (cùng id) thì thay thế. */
export function saveMyRecentPost<P extends { id: string }>(
  userId: string,
  post: P,
): void {
  const now = Date.now()
  const existing = read<P>().filter(
    (e) => now - e.savedAt < TTL_MS && e.post.id !== post.id,
  )
  existing.unshift({ savedAt: now, userId, post })
  // Cap 10 entries/user — tránh phình localStorage nếu ai spam liên tục.
  write(existing.slice(0, 20))
}

/** Lấy bài của `userId` chưa expire và id không nằm trong `excludeIds`
 *  (để dedupe với server feed). Trả về theo savedAt mới → cũ. */
export function loadMyRecentPosts<P extends { id: string }>(
  userId: string,
  excludeIds: Set<string>,
): P[] {
  const now = Date.now()
  return read<P>()
    .filter(
      (e) =>
        e.userId === userId &&
        now - e.savedAt < TTL_MS &&
        !excludeIds.has(e.post.id),
    )
    .map((e) => e.post)
}

/** Xóa entries đã expire hoặc đã xuất hiện trong server feed. Gọi định kỳ
 *  (mount feed, sau khi load more) để tránh phình. */
export function pruneMyRecentPosts(serverIds: Set<string>): void {
  const now = Date.now()
  const kept = read().filter(
    (e) => now - e.savedAt < TTL_MS && !serverIds.has((e.post as { id: string }).id),
  )
  write(kept)
}

/** Xóa 1 bài (dùng khi user xóa bài trong FeedClient). */
export function removeMyRecentPost(id: string): void {
  write(read().filter((e) => (e.post as { id: string }).id !== id))
}
