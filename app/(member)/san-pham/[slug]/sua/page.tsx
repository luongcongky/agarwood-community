import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ProductForm } from "../../ProductForm"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
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
      ownerId: true,
      company: { select: { slug: true } },
    },
  })

  if (!product) notFound()
  if (product.ownerId !== session.user.id && !isAdmin(session.user.role)) {
    redirect("/")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/san-pham/${slug}`} className="text-brand-600 hover:text-brand-800 text-sm">
          ← Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">Chỉnh sửa sản phẩm</h1>
      </div>
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category,
          priceRange: product.priceRange,
          imageUrls: product.imageUrls as string[],
          isPublished: product.isPublished,
          // @ts-expect-error — extra i18n fields ProductForm reads via record cast
          name_en: product.name_en,
          name_zh: product.name_zh,
          name_ar: product.name_ar,
          description_en: product.description_en,
          description_zh: product.description_zh,
          description_ar: product.description_ar,
          category_en: product.category_en,
          category_zh: product.category_zh,
          category_ar: product.category_ar,
        }}
        companySlug={product.company?.slug}
        historyHref={`/san-pham/${slug}/lich-su`}
      />
    </div>
  )
}
