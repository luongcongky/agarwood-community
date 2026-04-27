import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getCommitteesWithMembers } from "@/lib/committee-leader-bridge"
import { LeaderManager } from "./LeaderManager"
import { CommitteesView } from "./CommitteesView"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Ban lãnh đạo — Quản trị" }
export const revalidate = 0

type Tab = "by-committee" | "profiles"

/**
 * Trang admin Ban lãnh đạo — 2 tab:
 *
 *  - "Theo ban" (default): list hội viên grouped by Committee — nguồn sự
 *    thật thật sự. Link sang `/admin/hoi-vien/[id]` để gán ban; hiển thị
 *    trạng thái Leader profile (đã có / chưa có) cho mỗi thành viên có
 *    committee mapping với LeaderCategory.
 *
 *  - "Profile công khai": LeaderManager cũ — CRUD Leader rows (ảnh chân
 *    dung, honorific, bio, term). Dùng cho:
 *      a) Tạo/sửa profile cho hội viên đã có committee
 *      b) Quản lý external leaders (userId=null) — cố vấn, khách danh dự
 *
 * Legacy: trước khi có Committee, chỉ có LeaderManager. Admin cần dual
 * maintain (gán category Leader + phải tạo User/Role thủ công). Giờ:
 *   gán committee ở /admin/hoi-vien → tự xuất hiện ở tab "Theo ban" +
 *   admin quyết định có tạo Leader profile cho public display hay không.
 */
export default async function LeadersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: rawTab } = await searchParams
  const tab: Tab = rawTab === "profiles" ? "profiles" : "by-committee"

  const [committeesData, leaders] = await Promise.all([
    getCommitteesWithMembers(),
    prisma.leader.findMany({
      orderBy: [{ term: "desc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        honorific: true,
        title: true,
        category: true,
        workTitle: true,
        bio: true,
        photoUrl: true,
        term: true,
        sortOrder: true,
        isActive: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            accountType: true,
            isActive: true,
            company: { select: { name: true } },
          },
        },
      },
    }),
  ])
  const terms = [...new Set(leaders.map((l) => l.term))]

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Ban lãnh đạo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý hội viên theo từng ban + profile công khai của thành viên lãnh đạo.
        </p>
      </div>

      {/* Tab nav — server-side (searchParams) để tránh hydration mismatch */}
      <div className="flex items-end gap-1 border-b border-brand-200 mb-5">
        <TabLink
          href="/admin/ban-lanh-dao"
          label="Theo ban"
          active={tab === "by-committee"}
        />
        <TabLink
          href="/admin/ban-lanh-dao?tab=profiles"
          label="Profile công khai"
          active={tab === "profiles"}
        />
      </div>

      {tab === "by-committee" && <CommitteesView data={committeesData} />}
      {tab === "profiles" && (
        <LeaderManager initialLeaders={leaders} initialTerms={terms} />
      )}
    </div>
  )
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-brand-700 text-brand-900 bg-white"
          : "border-transparent text-brand-500 hover:text-brand-700"
      }`}
    >
      {label}
    </Link>
  )
}
