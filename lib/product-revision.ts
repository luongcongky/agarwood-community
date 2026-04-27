import "server-only"
import type { Prisma, PrismaClient, Product } from "@prisma/client"
import { prisma as defaultPrisma } from "@/lib/prisma"

/** Cap N revision/product. Insert thứ N+1 sẽ prune oldest để giữ tối đa N.
 *  Đổi giá trị nếu cần giữ nhiều history hơn; với product thông thường
 *  50 revision là đủ và tránh bloat bảng. */
export const REVISION_CAP = 50

/** Các field Product có thể sửa — mirror 1-1 với ProductRevision.
 *  Thêm field mới vào Product → nhớ thêm đây + migration + UI diff. */
export const REVISION_FIELDS = [
  "name",
  "name_en",
  "name_zh",
  "name_ar",
  "slug",
  "description",
  "description_en",
  "description_zh",
  "description_ar",
  "category",
  "category_en",
  "category_zh",
  "category_ar",
  "priceRange",
  "imageUrls",
  "isPublished",
] as const satisfies readonly (keyof Product)[]

export type RevisionField = (typeof REVISION_FIELDS)[number]

/** "OWNER" = self-edit, "ADMIN" = role=ADMIN, "TRUYEN_THONG" = committee có
 *  quyền product:write. Lưu enum dạng string để không phải join khi hiển thị
 *  "Ai sửa" trong UI. */
export type EditorRole = "OWNER" | "ADMIN" | "TRUYEN_THONG"

type RevisionSnapshot = Pick<Product, RevisionField>

function pickSnapshot(product: Product): RevisionSnapshot {
  const snap: Partial<RevisionSnapshot> = {}
  for (const f of REVISION_FIELDS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(snap as any)[f] = (product as any)[f]
  }
  return snap as RevisionSnapshot
}

/** So sánh 2 snapshot, trả về tên field đã đổi. Dùng Array.prototype.every
 *  cho imageUrls để phát hiện re-order cũng như thêm/xoá. */
export function diffRevisionFields(
  prev: RevisionSnapshot | null,
  next: RevisionSnapshot,
): RevisionField[] {
  if (!prev) return [...REVISION_FIELDS]
  const changed: RevisionField[] = []
  for (const f of REVISION_FIELDS) {
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

type WriteRevisionArgs = {
  product: Product
  editedBy: string
  editedRole: EditorRole
  reason?: string | null
  /** Truyền `tx` khi gọi trong transaction để đảm bảo revision đồng bộ
   *  với update Product. Thiếu → dùng client mặc định. */
  tx?: Prisma.TransactionClient | PrismaClient
}

/** Ghi revision mới — version tự tính = max+1, prune để giữ REVISION_CAP row.
 *  v0 = initial create (gọi sau khi tạo Product lần đầu).
 *  vN = mỗi lần update sau đó.
 *
 *  Caller chỉ việc truyền Product *đã update xong* — helper so với bản
 *  trước để tính changedFields. Nếu là v0 thì changedFields = [] (không
 *  có "trước" để so). */
export async function writeProductRevision({
  product,
  editedBy,
  editedRole,
  reason,
  tx,
}: WriteRevisionArgs): Promise<void> {
  const db = tx ?? defaultPrisma

  const latest = await db.productRevision.findFirst({
    where: { productId: product.id },
    orderBy: { version: "desc" },
    select: {
      version: true,
      name: true,
      name_en: true,
      name_zh: true,
      name_ar: true,
      slug: true,
      description: true,
      description_en: true,
      description_zh: true,
      description_ar: true,
      category: true,
      category_en: true,
      category_zh: true,
      category_ar: true,
      priceRange: true,
      imageUrls: true,
      isPublished: true,
    },
  })

  const nextSnapshot = pickSnapshot(product)
  const prevSnapshot = latest
    ? (Object.fromEntries(
        REVISION_FIELDS.map((f) => [f, latest[f as keyof typeof latest]]),
      ) as RevisionSnapshot)
    : null
  const changed = latest ? diffRevisionFields(prevSnapshot, nextSnapshot) : []

  // v0 lẫn vN đều tạo row. v0 có changedFields=[] (first snapshot).
  const nextVersion = latest ? latest.version + 1 : 0

  await db.productRevision.create({
    data: {
      productId: product.id,
      version: nextVersion,
      ...nextSnapshot,
      editedBy,
      editedRole,
      reason: reason ?? null,
      changedFields: changed,
    },
  })

  // Prune khi vượt cap — xoá những version cũ nhất còn lại mà giữ REVISION_CAP row.
  // Chạy sau insert (nên tổng row tối đa = CAP+1 tại thời điểm insert, rồi về CAP).
  const total = await db.productRevision.count({ where: { productId: product.id } })
  if (total > REVISION_CAP) {
    const deleteCount = total - REVISION_CAP
    const toDelete = await db.productRevision.findMany({
      where: { productId: product.id },
      orderBy: { version: "asc" },
      take: deleteCount,
      select: { id: true },
    })
    await db.productRevision.deleteMany({
      where: { id: { in: toDelete.map((r) => r.id) } },
    })
  }
}

/** Helper: map role + committees → EditorRole để lưu revision.
 *  Ưu tiên "ADMIN" > "TRUYEN_THONG" > "OWNER" — nếu user vừa là admin vừa
 *  là owner sản phẩm, ghi "ADMIN" để rõ ràng vai trò thao tác. */
export function resolveEditorRole(
  role: "ADMIN" | "INFINITE" | "VIP" | "GUEST",
  hasProductWriteViaCommittee: boolean,
  isOwner: boolean,
): EditorRole {
  if (role === "ADMIN") return "ADMIN"
  if (hasProductWriteViaCommittee && !isOwner) return "TRUYEN_THONG"
  return "OWNER"
}
