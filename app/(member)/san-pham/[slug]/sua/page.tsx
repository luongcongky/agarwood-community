import { auth } from "@/lib/auth"
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
      slug: true,
      description: true,
      category: true,
      priceRange: true,
      imageUrls: true,
      isPublished: true,
      company: { select: { ownerId: true, slug: true } },
    },
  })

  if (!product) notFound()
  if (product.company.ownerId !== session.user.id && session.user.role !== "ADMIN") {
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
        }}
        companySlug={product.company.slug}
      />
    </div>
  )
}
