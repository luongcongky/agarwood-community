import "server-only"
import type { Committee, LeaderCategory } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * Bridge giữa Committee (nguồn sự thật cho "ai thuộc ban nào") và Leader
 * (profile công khai: ảnh chân dung, tiểu sử, nhiệm kỳ, honorific).
 *
 * Quan hệ:
 *  - CommitteeMembership = baseline. Ai có row = member thực sự của ban,
 *    tự động có permission + appear trong admin Ban lãnh đạo view.
 *  - Leader = cosmetic overlay. Có Leader row → appear trên public page
 *    `/ban-lanh-dao` với formal photo + bio. Không có → chỉ thấy ở admin.
 *
 * Mapping 4 committee ↔ 4 LeaderCategory cũ:
 *  - THUONG_VU ↔ BTV
 *  - CHAP_HANH ↔ BCH
 *  - KIEM_TRA ↔ BKT
 *  - THAM_DINH ↔ HDTD
 *
 * THU_KY + TRUYEN_THONG không có LeaderCategory tương ứng — 2 ban này
 * thường operational, không publish trên trang Ban lãnh đạo công khai.
 * Nếu cần publish trong tương lai, thêm LeaderCategory value mới.
 */

export const COMMITTEE_TO_LEADER_CATEGORY: Partial<
  Record<Committee, LeaderCategory>
> = {
  THUONG_VU: "BTV",
  CHAP_HANH: "BCH",
  KIEM_TRA: "BKT",
  THAM_DINH: "HDTD",
  // THU_KY: intentionally unmapped — operational, không public
  // TRUYEN_THONG: intentionally unmapped — operational, không public
}

export const LEADER_CATEGORY_TO_COMMITTEE: Record<LeaderCategory, Committee> = {
  BTV: "THUONG_VU",
  BCH: "CHAP_HANH",
  BKT: "KIEM_TRA",
  HDTD: "THAM_DINH",
}

/** Thứ tự committee hiển thị trên admin Ban lãnh đạo — đi từ cao xuống thấp. */
export const COMMITTEE_DISPLAY_ORDER: Committee[] = [
  "THUONG_VU",
  "CHAP_HANH",
  "KIEM_TRA",
  "THAM_DINH",
  "THU_KY",
  "TRUYEN_THONG",
]

/**
 * Query cho admin Ban lãnh đạo view — trả về tất cả committee members + có
 * flag `leaderProfile` để admin biết ai đã có public display profile.
 *
 * Matching (Hướng C — hybrid):
 *   1. Ưu tiên tìm Leader(userId, category=mapped) — khớp chính xác ban.
 *   2. Nếu không có, fallback: bất kỳ Leader(userId=X) nào của user đó.
 *      `crossCategory=true` để admin biết profile đang share giữa các ban.
 *   3. Nếu user có nhiều Leader rows (hiếm — thường 1/user), ưu tiên
 *      Leader mới nhất (updatedAt desc). Admin có thể consolidate qua tab
 *      "Profile công khai".
 *
 * Leaders có `userId=null` (external) không ở trong kết quả này — xem qua
 * tab "Profile công khai" (LeaderManager).
 */
export async function getCommitteesWithMembers() {
  const [memberships, leaders] = await Promise.all([
    prisma.committeeMembership.findMany({
      orderBy: [{ assignedAt: "asc" }],
      select: {
        id: true,
        committee: true,
        position: true,
        assignedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            company: { select: { name: true } },
          },
        },
      },
    }),
    prisma.leader.findMany({
      where: { userId: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        userId: true,
        category: true,
        isActive: true,
        photoUrl: true,
        term: true,
      },
    }),
  ])

  // Index kép:
  //  - `byUserCat`: match chính xác (userId, category)
  //  - `byUser`:    fallback — bất kỳ Leader nào của user (đã sort desc
  //                 theo updatedAt, entry đầu tiên trong map = mới nhất)
  const byUserCat = new Map<string, (typeof leaders)[number]>()
  const byUser = new Map<string, (typeof leaders)[number]>()
  for (const l of leaders) {
    if (!l.userId) continue
    byUserCat.set(`${l.userId}:${l.category}`, l)
    if (!byUser.has(l.userId)) byUser.set(l.userId, l) // keep first = newest
  }

  // Group membership theo committee
  const byCommittee = new Map<Committee, typeof memberships>()
  for (const c of COMMITTEE_DISPLAY_ORDER) byCommittee.set(c, [])
  for (const m of memberships) {
    byCommittee.get(m.committee)?.push(m)
  }

  return COMMITTEE_DISPLAY_ORDER.map((committee) => {
    const leaderCat = COMMITTEE_TO_LEADER_CATEGORY[committee]
    const rows = byCommittee.get(committee) ?? []
    return {
      committee,
      members: rows.map((m) => {
        // Step 1: thử exact match
        let leader = leaderCat
          ? byUserCat.get(`${m.user.id}:${leaderCat}`) ?? null
          : null
        let crossCategory = false
        // Step 2: fallback bất kỳ Leader nào của user (Hướng C)
        if (!leader && leaderCat) {
          leader = byUser.get(m.user.id) ?? null
          crossCategory = !!leader
        }
        return {
          membershipId: m.id,
          user: m.user,
          position: m.position,
          assignedAt: m.assignedAt,
          leaderProfile: leader
            ? {
                id: leader.id,
                isActive: leader.isActive,
                hasPhoto: !!leader.photoUrl,
                term: leader.term,
                category: leader.category,
                /** true = Leader row có category khác với committee (fallback match).
                 *  Admin thấy đây là "dùng chung profile" — 1 profile cho nhiều ban. */
                crossCategory,
              }
            : null,
        }
      }),
    }
  })
}

export type CommitteeWithMembers = Awaited<
  ReturnType<typeof getCommitteesWithMembers>
>[number]
