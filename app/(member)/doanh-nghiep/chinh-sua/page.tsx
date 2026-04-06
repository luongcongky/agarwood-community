import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CompanyEditForm } from "./CompanyEditForm"

export const revalidate = 0

export default async function CompanyEditPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
    select: {
      id: true,
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
    },
  })

  if (!company) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-heading font-bold text-brand-900">Doanh nghiệp của tôi</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-yellow-800">Bạn chưa có thông tin doanh nghiệp. Liên hệ ban quản trị để được hỗ trợ.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold text-brand-900">Chỉnh sửa doanh nghiệp</h1>
      <CompanyEditForm company={company} />
    </div>
  )
}
