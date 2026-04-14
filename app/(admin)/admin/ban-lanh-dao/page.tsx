import { prisma } from "@/lib/prisma"
import { LeaderManager } from "./LeaderManager"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Ban lãnh đạo — Quản trị" }
export const revalidate = 0

export default async function LeadersAdminPage() {
  const leaders = await prisma.leader.findMany({
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
    },
  })

  // Get distinct terms for the term selector
  const terms = [...new Set(leaders.map((l) => l.term))]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Ban lãnh đạo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý thành viên ban lãnh đạo theo từng nhiệm kỳ. Thay đổi sẽ hiển
          thị trên trang Giới thiệu.
        </p>
      </div>
      <LeaderManager initialLeaders={leaders} initialTerms={terms} />
    </div>
  )
}
