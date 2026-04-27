import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { CompanyEditForm } from "./CompanyEditForm"

export const revalidate = 0

const COMPANY_SELECT = {
  id: true,
  ownerId: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  coverImageUrl: true,
  website: true,
  phone: true,
  address: true,
  foundedYear: true,
  employeeCount: true,
  businessLicense: true,
} satisfies Prisma.CompanySelect

type CompanyForEdit = Prisma.CompanyGetPayload<{ select: typeof COMPANY_SELECT }>

/**
 * Trang sửa DN — 2 mode:
 *  1. Owner mở (no `?slug`) → fetch theo ownerId hiện tại
 *  2. Admin mở từ `/doanh-nghiep/{slug}` → kèm `?slug=...` (Phase 3.7
 *     2026-04). Server validate caller là admin hoặc chủ DN; nếu không thì
 *     redirect về detail page (no edit access).
 */
export default async function CompanyEditPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { slug: querySlug } = await searchParams
  const viewerIsAdmin = isAdmin(session.user.role)

  let company: CompanyForEdit | null = null
  if (querySlug) {
    // Mode admin/explicit: lookup theo slug. Owner cũng dùng path này được
    // (link từ detail page truyền slug). Validate quyền sau khi fetch.
    company = await prisma.company.findUnique({
      where: { slug: querySlug },
      select: COMPANY_SELECT,
    })
    if (!company) redirect("/doanh-nghiep")
    const isOwner = company.ownerId === session.user.id
    if (!isOwner && !viewerIsAdmin) {
      redirect(`/doanh-nghiep/${querySlug}`)
    }
  } else {
    // Mode owner default: lookup theo ownerId hiện tại.
    company = await prisma.company.findUnique({
      where: { ownerId: session.user.id },
      select: COMPANY_SELECT,
    })
  }

  if (!company) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-brand-900">Doanh nghiệp của tôi</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-yellow-800">Bạn chưa có thông tin doanh nghiệp. Liên hệ ban quản trị để được hỗ trợ.</p>
        </div>
      </div>
    )
  }

  const isAdminEditingOther = viewerIsAdmin && company.ownerId !== session.user.id

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">
        {isAdminEditingOther ? `Chỉnh sửa DN: ${company.name}` : "Chỉnh sửa doanh nghiệp"}
      </h1>
      {isAdminEditingOther && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠ Bạn đang chỉnh sửa DN của hội viên khác (admin override). Mọi thay
          đổi sẽ được áp dụng ngay.
        </div>
      )}
      <CompanyEditForm company={company} companyId={company.id} />
    </div>
  )
}
