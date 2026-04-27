import dynamic from "next/dynamic"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PostEditor = dynamic(() => import("./PostEditor"), {
  loading: () => (
    <div className="py-12 text-center text-brand-400">
      Đang tải trình soạn thảo...
    </div>
  ),
})

/**
 * Server wrapper — fetch session role + DN của user (nếu có) server-side
 * để truyền xuống PostEditor. Phase 3.5: isAdmin cho CompanyPicker. Phase
 * 3.6 follow-up: ownCompany cho non-admin member để hiển thị DN sẽ gắn vào
 * SP (read-only — server tự lookup, UI chỉ show cho user biết).
 */
export default async function TaoBaiPage() {
  const session = await auth()
  const role = session?.user?.role
  const isAdmin = role === "ADMIN" || role === "INFINITE"

  const ownCompany = session?.user?.id
    ? await prisma.company.findUnique({
        where: { ownerId: session.user.id },
        select: { id: true, name: true, slug: true, logoUrl: true },
      })
    : null

  return <PostEditor isAdmin={isAdmin} ownCompany={ownCompany} />
}
