import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MemberSidebar } from "@/components/features/layout/MemberSidebar"
import { MemberMobileNav } from "@/components/features/layout/MemberMobileNav"

/**
 * Layout cho khu vực quản lý Hội viên — hiển thị sidebar cố định bên trái, giống
 * admin layout. Auth guard được xử lý ở proxy.ts theo pathname (không phụ thuộc
 * route group), nên layout này chỉ lo render.
 */
export default async function VipLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role

  // Query thêm isCouncilMember — ADMIN/INFINITE cũng có thể tham gia hội đồng thẩm định
  const dbUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { accountType: true, isCouncilMember: true },
      })
    : null
  const accountType = (dbUser?.accountType ?? null) as
    | "BUSINESS"
    | "INDIVIDUAL"
    | null
  const isCouncilMember = dbUser?.isCouncilMember ?? false

  // Hội viên còn hiệu lực → hiện đủ sidebar; chưa kích hoạt / hết hạn → chỉ hiện "Gia hạn".
  // INFINITE/ADMIN luôn coi là active (bỏ qua hạn).
  const expires = session?.user?.membershipExpires
  const membershipActive =
    role === "INFINITE" || role === "ADMIN"
      ? true
      : role === "VIP" && !!expires && new Date(expires) > new Date()

  return (
    // h-screen (thay vì min-h-screen) để main thực sự scroll bên trong — giống
    // admin layout — giúp sticky element trong nội dung hoạt động.
    <div className="flex h-screen overflow-hidden">
      <MemberSidebar accountType={accountType} role={role} membershipActive={membershipActive} isCouncilMember={isCouncilMember} />

      <div className="flex-1 flex flex-col min-w-0">
        <MemberMobileNav accountType={accountType} role={role} membershipActive={membershipActive} isCouncilMember={isCouncilMember} />

        <main className="flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
