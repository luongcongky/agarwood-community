import "server-only"
import type { Post, Prisma, PrismaClient } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"

/**
 * Phase 3.6 (2026-04): audit history cho Post — pattern song song với
 * lib/product-revision.ts. Snapshot mỗi lần admin/owner save; owner xem
 * được diff giữa bản cuối admin vs bản cuối mình.
 *
 * Schema gọn hơn ProductRevision vì Post chỉ có 3 field editable:
 * title, content, imageUrls. Không có i18n, không có category/slug change.
 */

/** Cap N revision/post — đủ cho 1 bài bị admin edit qua lại nhiều lần. */
export const POST_REVISION_CAP = 50

/** Field Post có thể edit — mirror PostRevision snapshot columns. Thêm
 *  field editable mới vào Post → nhớ thêm đây + migration + UI diff. */
export const POST_REVISION_FIELDS = [
  "title",
  "content",
  "imageUrls",
] as const satisfies readonly (keyof Post)[]

export type PostRevisionField = (typeof POST_REVISION_FIELDS)[number]

/** "OWNER" = author tự sửa; "ADMIN" = admin/INFINITE moderation edit. */
export type PostEditorRole = "OWNER" | "ADMIN"

type PostRevisionSnapshot = Pick<Post, PostRevisionField>

function pickPostSnapshot(post: Post): PostRevisionSnapshot {
  const snap: Partial<PostRevisionSnapshot> = {}
  for (const f of POST_REVISION_FIELDS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(snap as any)[f] = (post as any)[f]
  }
  return snap as PostRevisionSnapshot
}

/** So sánh 2 snapshot, trả về tên field đã đổi. imageUrls so sánh element-wise
 *  để bắt cả re-order lẫn add/remove. */
export function diffPostRevisionFields(
  prev: PostRevisionSnapshot | null,
  next: PostRevisionSnapshot,
): PostRevisionField[] {
  if (!prev) return [...POST_REVISION_FIELDS]
  const changed: PostRevisionField[] = []
  for (const f of POST_REVISION_FIELDS) {
    const a = prev[f]
    const b = next[f]
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length || !a.every((v, i) => v === b[i])) changed.push(f)
    } else if (a !== b) {
      changed.push(f)
    }
  }
  return changed
}

type WritePostRevisionArgs = {
  post: Post
  editedBy: string
  editedRole: PostEditorRole
  reason?: string | null
  /** Truyền `tx` khi ghi trong cùng transaction với Post.update để đảm bảo
   *  atomic — nếu revision write fail, post update rollback. */
  tx?: Prisma.TransactionClient | PrismaClient
}

/** Ghi revision — version = max(version)+1, prune giữ POST_REVISION_CAP row.
 *  v0 = baseline (gọi sau khi tạo Post lần đầu, optional — nếu không có v0
 *  thì v1 sẽ có changedFields=[ALL]).
 *  vN = sau mỗi PATCH. */
export async function writePostRevision({
  post,
  editedBy,
  editedRole,
  reason,
  tx,
}: WritePostRevisionArgs): Promise<void> {
  const db = tx ?? defaultPrisma

  const latest = await db.postRevision.findFirst({
    where: { postId: post.id },
    orderBy: { version: "desc" },
    select: {
      version: true,
      title: true,
      content: true,
      imageUrls: true,
    },
  })

  const nextSnapshot = pickPostSnapshot(post)
  const prevSnapshot = latest
    ? (Object.fromEntries(
        POST_REVISION_FIELDS.map((f) => [f, latest[f as keyof typeof latest]]),
      ) as PostRevisionSnapshot)
    : null
  const changed = latest ? diffPostRevisionFields(prevSnapshot, nextSnapshot) : []

  const nextVersion = latest ? latest.version + 1 : 0

  await db.postRevision.create({
    data: {
      postId: post.id,
      version: nextVersion,
      ...nextSnapshot,
      editedBy,
      editedRole,
      reason: reason ?? null,
      changedFields: changed,
    },
  })

  // Prune oldest excess
  const total = await db.postRevision.count({ where: { postId: post.id } })
  if (total > POST_REVISION_CAP) {
    const deleteCount = total - POST_REVISION_CAP
    const toDelete = await db.postRevision.findMany({
      where: { postId: post.id },
      orderBy: { version: "asc" },
      take: deleteCount,
      select: { id: true },
    })
    await db.postRevision.deleteMany({
      where: { id: { in: toDelete.map((r) => r.id) } },
    })
  }
}

/** Tìm bản cuối cùng của ADMIN edit + bản cuối cùng của OWNER edit, dùng
 *  cho diff "admin edited my post" trên owner-facing surface. Trả null nếu
 *  chưa có revision tương ứng. */
export async function findLatestByRole(
  postId: string,
): Promise<{
  latestAdmin: Awaited<ReturnType<typeof defaultPrisma.postRevision.findFirst>> | null
  latestOwner: Awaited<ReturnType<typeof defaultPrisma.postRevision.findFirst>> | null
}> {
  const [latestAdmin, latestOwner] = await Promise.all([
    defaultPrisma.postRevision.findFirst({
      where: { postId, editedRole: "ADMIN" },
      orderBy: { version: "desc" },
    }),
    defaultPrisma.postRevision.findFirst({
      where: { postId, editedRole: "OWNER" },
      orderBy: { version: "desc" },
    }),
  ])
  return { latestAdmin, latestOwner }
}
