import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"

export const revalidate = 600

export const metadata: Metadata = {
  title: "Sản phẩm Doanh nghiệp | Hội Trầm Hương Việt Nam",
  description:
    "Khám phá các sản phẩm trầm hương từ doanh nghiệp Hội viên Hội Trầm Hương Việt Nam. Sản phẩm được chứng nhận có badge nổi bật.",
  alternates: { canonical: "/san-pham-doanh-nghiep" },
  openGraph: {
    title: "Sản phẩm Doanh nghiệp | Hội Trầm Hương Việt Nam",
    description:
      "Sản phẩm trầm hương từ doanh nghiệp Hội viên — ưu tiên hiển thị sản phẩm đã được Hội chứng nhận.",
    type: "website",
  },
}

const PAGE_SIZE = 24

// Danh mục sản phẩm — icon + label + filter value
const CATEGORIES = [
  { label: "Trầm tự nhiên",   icon: "🌿", value: "Trầm tự nhiên" },
  { label: "Trầm nuôi cấy",   icon: "🌱", value: "Trầm nuôi cấy" },
  { label: "Tinh dầu",         icon: "💧", value: "Tinh dầu" },
  { label: "Nhang trầm",       icon: "🪔", value: "Nhang trầm" },
  { label: "Vòng trầm",        icon: "📿", value: "Vòng trầm" },
  { label: "Phong thủy",       icon: "🏮", value: "Phong thủy" },
  { label: "Mỹ nghệ",          icon: "🎨", value: "Mỹ nghệ" },
  { label: "Thực phẩm",        icon: "🍵", value: "Thực phẩm" },
]

function buildUrl(p: number, filter: string, category?: string) {
  const params = new URLSearchParams()
  if (p > 1) params.set("page", String(p))
  if (filter && filter !== "all") params.set("filter", filter)
  if (category) params.set("category", category)
  const qs = params.toString()
  return `/san-pham-doanh-nghiep${qs ? `?${qs}` : ""}`
}

export default async function BusinessProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; category?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const filter = params.filter ?? "all" // all | certified
  const categoryFilter = params.category ?? ""

  const where = {
    isPublished: true,
    company: {
      isPublished: true,
      owner: { role: { in: [Role.VIP, Role.ADMIN] } },
    },
    ...(filter === "certified" && { certStatus: "APPROVED" as const }),
    ...(categoryFilter && { category: categoryFilter }),
  }

  // Sort logic: certified products first, then featured, then newest
  // Using multiple orderBy keys
  const [total, certifiedCount, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count({
      where: {
        isPublished: true,
        certStatus: "APPROVED",
        company: {
          isPublished: true,
          owner: { role: { in: [Role.VIP, Role.ADMIN] } },
        },
      },
    }),
    prisma.product.findMany({
      where,
      // Certified first (APPROVED sorts before others alphabetically? no — use raw priority)
      // Workaround: sort by composite — since certStatus is enum, we sort by isFeatured + featuredOrder + createdAt
      // Then split client-side is impossible without fetching all — instead fetch all in priority buckets
      orderBy: [
        { isFeatured: "desc" },
        { featuredOrder: "asc" },
        { createdAt: "desc" },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrls: true,
        category: true,
        priceRange: true,
        certStatus: true,
        isFeatured: true,
        featuredOrder: true,
        createdAt: true,
        company: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            owner: { select: { name: true } },
          },
        },
        _count: { select: { comments: { where: { deletedAt: null } } } },
      },
    }),
  ])

  // Sort certified products to the top within the page results
  const sortedProducts = [...products].sort((a, b) => {
    const aCertified = a.certStatus === "APPROVED" ? 0 : 1
    const bCertified = b.certStatus === "APPROVED" ? 0 : 1
    if (aCertified !== bCertified) return aCertified - bCertified
    // Within same certification bucket, featured first
    const aFeatured = a.isFeatured ? 0 : 1
    const bFeatured = b.isFeatured ? 0 : 1
    if (aFeatured !== bFeatured) return aFeatured - bFeatured
    // Then by featuredOrder
    if (a.featuredOrder !== null && b.featuredOrder !== null) {
      return a.featuredOrder - b.featuredOrder
    }
    // Finally by date
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-brand-50">
      {/* ── Page Banner ─────────────────────────────────────────────────── */}
      <div className="bg-brand-800 py-14 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">
          Sản phẩm Doanh nghiệp
        </h1>
        <p className="mt-2 text-brand-300 text-base max-w-2xl mx-auto">
          Khám phá sản phẩm trầm hương từ các doanh nghiệp Hội viên.
          Sản phẩm có biểu tượng{" "}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white align-middle">
            ✓ Chứng nhận
          </span>{" "}
          đã được Hội thẩm định chất lượng.
        </p>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────────── */}
      <div className="border-b border-brand-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-2 flex-wrap">
          <Link
            href={buildUrl(1, "all")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
              filter === "all" && !categoryFilter
                ? "bg-brand-800 text-white border-brand-800"
                : "bg-white text-brand-700 border-brand-200 hover:bg-brand-50",
            )}
          >
            Tất cả ({total})
          </Link>
          <Link
            href={buildUrl(1, "certified")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
              filter === "certified"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50",
            )}
          >
            ✓ Chứng nhận ({certifiedCount})
          </Link>
        </div>
      </div>

      {/* ── Categories grid — like Vatgia ──────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={buildUrl(1, filter, categoryFilter === cat.value ? "" : cat.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:shadow-md",
                categoryFilter === cat.value
                  ? "bg-brand-800 text-white border-brand-800 shadow-md"
                  : "bg-white text-brand-700 border-brand-200 hover:border-brand-400",
              )}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
        {categoryFilter && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-brand-600">
              Đang lọc: <strong>{categoryFilter}</strong>
            </span>
            <Link
              href={buildUrl(1, filter)}
              className="text-xs text-brand-400 hover:text-red-500 transition-colors"
            >
              ✕ Bỏ lọc
            </Link>
          </div>
        )}
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        {sortedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-200 p-16 text-center">
            <AgarwoodPlaceholder className="w-20 h-20 mx-auto mb-4" size="lg" shape="full" tone="light" />
            <p className="text-brand-700 text-lg font-medium">
              {filter === "certified"
                ? "Chưa có sản phẩm chứng nhận nào"
                : "Chưa có sản phẩm nào được công bố"}
            </p>
            <p className="text-brand-500 text-sm mt-2">
              Doanh nghiệp Hội viên sẽ sớm cập nhật sản phẩm của mình.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => {
              const cover = product.imageUrls[0] ?? null
              const isCertified = product.certStatus === "APPROVED"
              return (
                <Link
                  key={product.id}
                  href={`/san-pham/${product.slug}`}
                  className={cn(
                    "group relative bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col",
                    isCertified
                      ? "border-emerald-300 hover:border-emerald-500 ring-1 ring-emerald-100"
                      : "border-brand-200 hover:border-brand-400",
                  )}
                >
                  {/* Image */}
                  <div className="relative h-52 bg-brand-100 overflow-hidden">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={product.name}
                        fill
                        className={cn(
                          "object-cover transition-transform duration-300 group-hover:scale-105",
                          !isCertified && "opacity-90",
                        )}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <AgarwoodPlaceholder className="w-full h-full" size="lg" shape="square" />
                    )}

                    {/* Certified badge — prominent */}
                    {isCertified && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-lg ring-2 ring-white">
                        ✓ Chứng nhận
                      </span>
                    )}

                    {/* Featured badge — secondary */}
                    {product.isFeatured && !isCertified && (
                      <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                        ⭐ Nổi bật
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1 gap-1.5">
                    <h2
                      className={cn(
                        "font-semibold leading-snug transition-colors line-clamp-2",
                        isCertified
                          ? "text-brand-900 group-hover:text-emerald-700"
                          : "text-brand-800 group-hover:text-brand-700",
                      )}
                    >
                      {product.name}
                    </h2>

                    {/* Company */}
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-5 h-5 rounded-full overflow-hidden bg-brand-700 shrink-0 flex items-center justify-center">
                        {product.company.logoUrl ? (
                          <Image
                            src={product.company.logoUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="20px"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-brand-100">
                            {product.company.name[0]}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-brand-500 line-clamp-1">
                        {product.company.name}
                        {product.company.isVerified && (
                          <span className="text-green-600 ml-0.5">✓</span>
                        )}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="mt-auto pt-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {product.category && (
                          <span className="text-brand-500">{product.category}</span>
                        )}
                        {product._count.comments > 0 && (
                          <span className="text-brand-400">💬 {product._count.comments}</span>
                        )}
                      </div>
                      {product.priceRange && (
                        <span
                          className={cn(
                            "font-semibold",
                            isCertified ? "text-emerald-700" : "text-brand-700",
                          )}
                        >
                          {product.priceRange}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={buildUrl(page - 1, filter, categoryFilter)}
                className="px-4 py-2 rounded-lg border border-brand-300 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                ← Trước
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-brand-600">
              Trang {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={buildUrl(page + 1, filter, categoryFilter)}
                className="px-4 py-2 rounded-lg border border-brand-300 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                Tiếp →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="bg-brand-800 py-12 text-center text-white">
        <p className="text-brand-200 mb-4 text-sm">
          Doanh nghiệp của bạn muốn giới thiệu sản phẩm trên trang này?
        </p>
        <Link
          href="/dang-ky"
          className="inline-flex items-center justify-center rounded-lg bg-brand-400 text-brand-900 font-semibold px-6 py-3 hover:bg-brand-300 transition-colors"
        >
          Đăng ký hội viên
        </Link>
      </div>
    </div>
  )
}
