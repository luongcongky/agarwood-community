import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export const revalidate = 0

export default async function MyCompanyPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
    select: { slug: true },
  })

  // If user has a company, redirect to their public profile
  if (company) {
    redirect(`/doanh-nghiep/${company.slug}`)
  }

  // No company yet — show guidance
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Doanh nghiệp của tôi</h1>
      <div className="bg-white rounded-xl border border-brand-200 p-8 text-center space-y-4">
        <div className="text-4xl">🏢</div>
        <h2 className="text-lg font-semibold text-brand-900">Chưa có thông tin doanh nghiệp</h2>
        <p className="text-sm text-brand-500">
          Thông tin doanh nghiệp được tạo khi bạn đăng ký hội viên. Nếu bạn cần cập nhật hoặc bổ sung thông tin, vui lòng liên hệ ban quản trị.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/lien-he" className="rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors">
            Liên hệ ban quản trị
          </Link>
        </div>
      </div>
    </div>
  )
}
