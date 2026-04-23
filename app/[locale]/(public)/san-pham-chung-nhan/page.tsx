import Link from "next/link"
import Image from "next/image"
import { unstable_cache } from "next/cache"
import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { cloudinaryResize } from "@/lib/cloudinary"
import { BLUR_DATA_URL } from "@/lib/seo/blur-placeholder"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { ProductFilters } from "./ProductFilters"

export const revalidate = 3600

const PRODUCT_CARD_SELECT = {
  id: true,
  name: true, name_en: true, name_zh: true, name_ar: true,
  slug: true,
  imageUrls: true,
  category: true, category_en: true, category_zh: true, category_ar: true,
  priceRange: true,
  certApprovedAt: true,
  company: {
    select: {
      name: true, name_en: true, name_zh: true, name_ar: true,
      slug: true, logoUrl: true, isVerified: true, address: true,
    },
  },
} as const

/** Default product list (page 1, no filter, sort moi-nhat, grid view) —
 *  variant phổ biến nhất, cache 5 min. Mọi param khác bypass cache. */
const getDefaultCertProducts = unstable_cache(
  async (take: number) =>
    prisma.product.findMany({
      where: {
        certStatus: "APPROVED",
        isPublished: true,
        companyId: { not: null },
      },
      orderBy: { certApprovedAt: "desc" },
      take,
      select: PRODUCT_CARD_SELECT,
    }),
  ["cert-products_list_default"],
  { revalidate: 300, tags: ["products", "cert-products"] },
)

const getDefaultCertProductsCount = unstable_cache(
  () =>
    prisma.product.count({
      where: {
        certStatus: "APPROVED",
        isPublished: true,
        companyId: { not: null },
      },
    }),
  ["cert-products_count_default"],
  { revalidate: 300, tags: ["products", "cert-products"] },
)

/** Stats + filter meta — shared across tất cả variant bộ lọc/phân trang →
 *  cache chung 10 phút. Trước đây hit DB mỗi page. */
const getCertProductsFilterMeta = unstable_cache(
  async () => {
    const [totalProducts, totalCompanies, rawCategories, activeAddresses] =
      await Promise.all([
        prisma.product.count({ where: { certStatus: "APPROVED", isPublished: true } }),
        prisma.company.count({
          where: { products: { some: { certStatus: "APPROVED", isPublished: true } } },
        }),
        prisma.product.findMany({
          where: { certStatus: "APPROVED", isPublished: true, category: { not: null } },
          select: { category: true },
          distinct: ["category"],
          orderBy: { category: "asc" },
        }),
        prisma.company.findMany({
          where: { products: { some: { certStatus: "APPROVED", isPublished: true } } },
          select: { address: true },
        }),
      ])
    return { totalProducts, totalCompanies, rawCategories, activeAddresses }
  },
  ["cert-products_filter_meta"],
  { revalidate: 600, tags: ["products", "cert-products"] },
)

export async function generateMetadata() {
  const t = await getTranslations("certProducts")
  return { title: t("metaTitle"), alternates: { canonical: "/san-pham-chung-nhan" } }
}

// Common Vietnamese provinces for agarwood industry
const KNOWN_PROVINCES = [
  "Khánh Hòa", "Quảng Nam", "Bình Phước", "Hà Tĩnh", "Phú Yên",
  "Bình Định", "Quảng Ngãi", "Nghệ An", "TP.HCM", "Hà Nội",
  "Đà Nẵng", "Lâm Đồng", "Gia Lai", "Kon Tum",
]

const PAGE_SIZE_GRID = 24
const PAGE_SIZE_LIST = 20

type OrderBy =
  | { certApprovedAt: "desc" }
  | { name: "asc" }
  | { company: { name: "asc" } }
  | { isPublished: "desc" }

function buildUrl(overrides: Record<string, string | undefined>, base: URLSearchParams) {
  const next = new URLSearchParams(base.toString())
  for (const [k, v] of Object.entries(overrides)) {
    if (v) next.set(k, v)
    else next.delete(k)
  }
  const qs = next.toString()
  return `/san-pham-chung-nhan${qs ? `?${qs}` : ""}`
}

function paginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = [1]
  if (current > 4) pages.push("...")
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) pages.push(i)
  if (current < total - 3) pages.push("...")
  if (total > 1) pages.push(total)
  return pages
}

export default async function CertifiedProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    q?: string
    loai?: string
    vung?: string
    sort?: string
    view?: string
  }>
}) {
  const [locale, t] = await Promise.all([getLocale() as Promise<Locale>, getTranslations("certProducts")])
  const l = <T extends Record<string, unknown>>(record: T, field: string) => localize(record, field, locale) as string
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const q = sp.q ?? ""
  const loai = sp.loai ?? ""
  const vung = sp.vung ?? ""
  const sort = sp.sort ?? "moi-nhat"
  const view = sp.view ?? "grid"
  const PAGE_SIZE = view === "list" ? PAGE_SIZE_LIST : PAGE_SIZE_GRID

  const orderBy: OrderBy =
    sort === "ten-az" ? { name: "asc" }
    : sort === "cong-ty" ? { company: { name: "asc" } }
    : sort === "noi-bat" ? { isPublished: "desc" }
    : { certApprovedAt: "desc" }

  const baseWhere = {
    certStatus: "APPROVED" as const,
    isPublished: true,
    companyId: { not: null },  // Chứng nhận yêu cầu doanh nghiệp — safety net
    ...(loai && { category: { contains: loai, mode: "insensitive" as const } }),
    ...(vung && { company: { address: { contains: vung, mode: "insensitive" as const } } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { company: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
  }

  // Default variant (page 1, không filter, sort default, grid view) dùng
  // cache 5 phút. Biến thể filter/sort/pagination bypass cache vì quá nhiều
  // permutation.
  const isDefaultVariant =
    page === 1 &&
    !q && !loai && !vung &&
    sort === "moi-nhat" &&
    view === "grid"

  const [total, products, filterMeta] = await Promise.all([
    isDefaultVariant
      ? getDefaultCertProductsCount()
      : prisma.product.count({ where: baseWhere }),
    isDefaultVariant
      ? getDefaultCertProducts(PAGE_SIZE)
      : prisma.product.findMany({
          where: baseWhere,
          orderBy,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: PRODUCT_CARD_SELECT,
        }),
    getCertProductsFilterMeta(),
  ])

  const { totalProducts, totalCompanies, rawCategories, activeAddresses } = filterMeta
  const categories = rawCategories
    .map((r) => r.category)
    .filter((c): c is string => !!c)

  const provinces = KNOWN_PROVINCES.filter((prov) =>
    activeAddresses.some((c) => c.address?.includes(prov))
  )

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const lastUpdated = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })

  // Build a URLSearchParams-like object for pagination links
  const currentParams = new URLSearchParams()
  if (q) currentParams.set("q", q)
  if (loai) currentParams.set("loai", loai)
  if (vung) currentParams.set("vung", vung)
  if (sort && sort !== "moi-nhat") currentParams.set("sort", sort)
  if (view && view !== "grid") currentParams.set("view", view)

  return (
    <div>
      {/* ── Filters (client component) — ProductFilters tự render chrome riêng. */}
      <ProductFilters
        categories={categories}
        provinces={provinces}
        totalProducts={totalProducts}
        totalCompanies={totalCompanies}
        lastUpdated={lastUpdated}
      />

      {/* ── Top CTA call-out — prominent placement để business thấy action ngay
           above-the-fold. Thay thế bottom CTA cũ bị khuất. ────────────── */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="flex flex-col items-start gap-4 border border-brand-300 bg-linear-to-r from-brand-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 11 3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-tight text-brand-900 sm:text-base">
                Doanh nghiệp muốn được chứng nhận sản phẩm?
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-700">
                Tăng uy tín, được ưu tiên hiển thị và gắn huy hiệu chứng nhận chính thức của Hội Trầm Hương Việt Nam.
              </p>
            </div>
          </div>
          <Link
            href="/chung-nhan/nop-don"
            className="inline-flex shrink-0 items-center gap-2 bg-brand-700 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-800 sm:text-[13px]"
          >
            Nộp đơn chứng nhận
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Kết quả — flat, no card wrapper ─────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Result count */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-brand-600">
            {total === 0
              ? "Không tìm thấy sản phẩm nào"
              : t("countLabel", {
                  first: ((page - 1) * PAGE_SIZE + 1).toLocaleString(locale),
                  last: Math.min(page * PAGE_SIZE, total).toLocaleString(locale),
                  total: total.toLocaleString(locale),
                })}
            {(loai || vung || q) && (
              <Link href="/san-pham-chung-nhan" className="ml-3 text-brand-700 underline text-xs">
                Xoá bộ lọc
              </Link>
            )}
          </p>
        </div>

        {total === 0 ? (
          <div className="py-24 text-center">
            <AgarwoodPlaceholder className="w-20 h-20 mx-auto mb-4" size="lg" shape="full" tone="light" />
            <p className="text-brand-600 text-lg font-medium">Không tìm thấy sản phẩm phù hợp</p>
            <p className="text-brand-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
            <Link href="/san-pham-chung-nhan" className="mt-4 inline-block text-brand-700 underline text-sm">
              Xem tất cả sản phẩm
            </Link>
          </div>
        ) : view === "list" ? (
          /* ── Tầng 4B: List view ─────────────────────────────────────────── */
          <div className="bg-white rounded-xl border border-brand-200 divide-y divide-brand-100 shadow-sm">
            {products.map((product) => {
              const firstImage = product.imageUrls[0] ?? null
              return (
                <Link
                  key={product.id}
                  href={`/san-pham/${product.slug}`}
                  className="group flex items-center gap-4 px-4 py-4 hover:bg-brand-50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-14 shrink-0 rounded-lg overflow-hidden bg-brand-100">
                    {firstImage ? (
                      <Image src={firstImage} alt={l(product, "name")} fill className="object-cover" sizes="64px" />
                    ) : (
                      <AgarwoodPlaceholder className="w-full h-full" size="xs" shape="square" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h2 className="font-semibold text-brand-900 text-sm leading-snug group-hover:text-brand-700 transition-colors">
                        {l(product, "name")}
                      </h2>
                      <span className="shrink-0 inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                        {t("certifiedBadge")}
                      </span>
                    </div>
                    <p className="text-xs text-brand-500 mt-1">
                      {product.company!.name}
                      {l(product, "category") && ` · ${l(product, "category")}`}
                      {product.company!.address && ` · ${product.company!.address.split(",").at(-1)?.trim()}`}
                      {product.certApprovedAt && ` · Cấp: ${new Date(product.certApprovedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-brand-500 hidden sm:block">Xem →</span>
                </Link>
              )
            })}
          </div>
        ) : (
          /* ── Tầng 4A: Grid view (mặc định) ─────────────────────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => {
              const firstImage = product.imageUrls[0] ?? null
              return (
                <Link
                  key={product.id}
                  href={`/san-pham/${product.slug}`}
                  className="group bg-white rounded-xl border border-brand-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-brand-100">
                    {firstImage ? (
                      <Image
                        src={cloudinaryResize(firstImage, 480)}
                        alt={l(product, "name")}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    ) : (
                      <AgarwoodPlaceholder className="w-full h-full" size="md" shape="square" tone="light" />
                    )}
                    {/* Cert badge */}
                    <div className="absolute top-2.5 right-2.5 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {t("certifiedBadge")}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1 gap-1.5">
                    <h2 className="font-semibold text-brand-900 text-sm leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                      {l(product, "name")}
                    </h2>

                    {/* Company */}
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-5 h-5 rounded-full overflow-hidden bg-brand-700 shrink-0 flex items-center justify-center">
                        {product.company!.logoUrl ? (
                          <Image src={product.company!.logoUrl} alt="" fill className="object-cover" sizes="20px" />
                        ) : (
                          <span className="text-[9px] font-bold text-brand-100">{product.company!.name[0]}</span>
                        )}
                      </div>
                      <span className="text-xs text-brand-500 line-clamp-1">
                        {product.company!.name}
                        {product.company!.isVerified && <span className="text-green-600 ml-0.5">✓</span>}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="mt-auto pt-1 flex items-center justify-between text-xs text-brand-400">
                      <span>{product.category ?? ""}</span>
                      {product.certApprovedAt && (
                        <span>
                          Cấp{" "}
                          {new Date(product.certApprovedAt).toLocaleDateString("vi-VN", {
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1.5 flex-wrap">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) }, currentParams)}
                className="px-3 py-2 rounded-lg border border-brand-300 text-sm text-brand-700 hover:bg-white transition-colors"
              >
                ← Trước
              </Link>
            )}

            {paginationRange(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`e${i}`} className="px-2 py-2 text-brand-400 text-sm select-none">…</span>
              ) : (
                <Link
                  key={p}
                  href={buildUrl({ page: String(p) }, currentParams)}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                    p === page
                      ? "bg-brand-800 text-white border-brand-800"
                      : "bg-white border-brand-300 text-brand-700 hover:border-brand-500"
                  )}
                >
                  {p}
                </Link>
              )
            )}

            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) }, currentParams)}
                className="px-3 py-2 rounded-lg border border-brand-300 text-sm text-brand-700 hover:bg-white transition-colors"
              >
                Tiếp →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── CTA cuối trang — shorter reminder cho user đã scroll qua hết. Primary
           CTA đã đặt ở top banner; đây là secondary exposure. ─────────── */}
      <div className="mt-8 border-t border-neutral-200 bg-neutral-50 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center">
          <p className="text-sm text-neutral-600">
            Đã xem hết danh sách? Hãy để sản phẩm của bạn cũng xuất hiện ở đây.
          </p>
          <Link
            href="/chung-nhan/nop-don"
            className="inline-flex items-center gap-2 border border-brand-700 bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-brand-700 transition-colors hover:bg-brand-700 hover:text-white"
          >
            Nộp đơn chứng nhận
          </Link>
        </div>
      </div>
    </div>
  )
}
