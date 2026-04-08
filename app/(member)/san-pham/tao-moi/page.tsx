import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ProductForm } from "../ProductForm"

export default async function CreateProductPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { ownerId: session.user.id },
    select: { slug: true },
  })

  if (!company) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-brand-900">Thêm sản phẩm</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-sm text-yellow-800">
          Bạn cần có thông tin doanh nghiệp trước khi thêm sản phẩm.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/doanh-nghiep/${company.slug}`} className="text-brand-600 hover:text-brand-800 text-sm">
          ← Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">Thêm sản phẩm mới</h1>
      </div>
      <ProductForm companySlug={company.slug} />
    </div>
  )
}
