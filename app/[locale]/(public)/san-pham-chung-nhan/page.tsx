import Link from "next/link"
import Image from "next/image"
import { unstable_cache } from "next/cache"
import { getLocale, getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { cloudinaryResize } from "@/lib/cloudinary"
import { BLUR_DATA_URL } from "@/lib/seo/blur-placeholder"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import {
  CERT_VALIDITY_YEARS,
  COUNCIL_SIZE,
} from "@/lib/certification-council-constants"
import { ProductFilters } from "./ProductFilters"
import { CertProductCard } from "./CertProductCard"
import { ProductFeatureToggleBtn } from "./ProductFeatureToggleBtn"
import { CertifiedSeal } from "@/components/ui/CertifiedSeal"
import { getStaticTexts } from "@/lib/static-texts"

export const revalidate = 3600

const PRODUCT_CARD_SELECT = {
  id: true,
  name: true, name_en: true, name_zh: true, name_ar: true,
  slug: true,
  imageUrls: true,
  category: true, category_en: true, category_zh: true, category_ar: true,
  priceRange: true,
  certApprovedAt: true,
  isFeatured: true,
  company: {
    select: {
      name: true, name_en: true, name_zh: true, name_ar: true,
      slug: true,
      logoUrl: true,
      isVerified: true,
      address: true,
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

/** Featured spotlight — 5 sản phẩm vừa được cấp chứng nhận gần nhất.
 *  Cache 10 min — list này không đổi thường xuyên. */
const getFeaturedCertProducts = unstable_cache(
  async () =>
    prisma.product.findMany({
      where: {
        certStatus: "APPROVED",
        isPublished: true,
        companyId: { not: null },
      },
      orderBy: { certApprovedAt: "desc" },
      take: 5,
      select: PRODUCT_CARD_SELECT,
    }),
  ["cert-products_featured_top5"],
  { revalidate: 600, tags: ["products", "cert-products"] },
)

/** Stats meta — shared across tất cả variant. Cache 10 phút. */
const getCertProductsFilterMeta = unstable_cache(
  async () => {
    const [totalProducts, totalCompanies, oldestApproved] = await Promise.all([
      prisma.product.count({ where: { certStatus: "APPROVED", isPublished: true } }),
      prisma.company.count({
        where: { products: { some: { certStatus: "APPROVED", isPublished: true } } },
      }),
      prisma.product.aggregate({
        _min: { certApprovedAt: true },
        where: { certStatus: "APPROVED", isPublished: true },
      }),
    ])
    const oldest = oldestApproved._min.certApprovedAt
    const monthsActive = oldest
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(oldest).getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
        )
      : 1
    return {
      totalProducts,
      totalCompanies,
      oldestApproved: oldest,
      monthsActive,
    }
  },
  ["cert-products_filter_meta"],
  { revalidate: 600, tags: ["products", "cert-products"] },
)

export async function generateMetadata() {
  const t = await getTranslations("certProducts")
  return {
    title: t("metaTitle"),
    alternates: { canonical: "/san-pham-chung-nhan" },
  }
}

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
    sort?: string
    view?: string
  }>
}) {
  const [locale, session] = await Promise.all([
    getLocale() as Promise<Locale>,
    auth(),
  ])
  // `t` đọc StaticPageConfig (admin CMS override) trước, fallback messages —
  // admin /admin/trang-tinh?page=certProducts có thể chỉnh trực tiếp.
  const t = await getStaticTexts("certProducts", locale)
  const isAdminUser = isAdmin(session?.user?.role)
  const l = <T extends Record<string, unknown>>(record: T, field: string) =>
    localize(record, field, locale) as string
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const q = sp.q ?? ""
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
    companyId: { not: null },
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { company: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
  }

  // Default variant (page 1, không search, sort default, grid view) dùng
  // cache 5 phút. Biến thể search/sort/pagination bypass cache.
  const isDefaultVariant =
    page === 1 && !q && sort === "moi-nhat" && view === "grid"

  const [total, products, featured, filterMeta] = await Promise.all([
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
    getFeaturedCertProducts(),
    getCertProductsFilterMeta(),
  ])

  const { totalProducts, totalCompanies, monthsActive } = filterMeta

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const lastUpdated = new Date().toLocaleDateString(locale, {
    day: "2-digit", month: "2-digit", year: "numeric",
  })

  // Build URLSearchParams cho pagination links (preserve search/sort/view)
  const currentParams = new URLSearchParams()
  if (q) currentParams.set("q", q)
  if (sort && sort !== "moi-nhat") currentParams.set("sort", sort)
  if (view && view !== "grid") currentParams.set("view", view)

  const hasActiveFilter = !!q

  return (
    <div className="bg-stone-50">
      {/* Animation keyframes — cp- prefix tách khỏi dn- của doanh-nghiep */}
      <style>{`
        @keyframes cp-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cp-stamp-in {
          0%   { opacity: 0; transform: rotate(-15deg) scale(0.5); }
          70%  { opacity: 1; transform: rotate(5deg) scale(1.1); }
          100% { opacity: 1; transform: rotate(-3deg) scale(1); }
        }
        @keyframes cp-line-draw {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes cp-step-pop {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Process timeline — energy flow bar: gradient sáng emerald quét
           liên tục left→right trên line nối các step. Background-size 50%
           + position 0→200% tạo cảm giác "dòng chảy" infinite. */
        @keyframes cp-flow-bg {
          0%   { background-position: -50% 0; }
          100% { background-position: 150% 0; }
        }
        .cp-flow-bar {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(16, 185, 129, 0.85) 50%,
            transparent 100%
          );
          background-size: 50% 100%;
          background-repeat: no-repeat;
          animation: cp-flow-bg 4s linear infinite;
        }

        /* Traveler dot — chấm sáng glow di chuyển từ trái sang phải dọc
           line, qua từng step trong 4s loop. Box-shadow tạo aura emerald.
           Fade in/out ở 2 đầu để loop mượt. */
        @keyframes cp-traveler {
          0%   { left: 0; opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          8%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          92%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { left: 100%; opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
        }
        .cp-traveler {
          position: absolute;
          top: 50%;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: rgb(16, 185, 129);
          box-shadow:
            0 0 0 3px rgba(16, 185, 129, 0.25),
            0 0 12px rgba(16, 185, 129, 0.7),
            0 0 24px rgba(52, 211, 153, 0.5);
          animation: cp-traveler 4s ease-in-out infinite;
          animation-delay: 1600ms;
          pointer-events: none;
        }

        /* Step icon pulse — ring emerald expand+fade. Delay theo --i * 1s
           để 4 steps pulse tuần tự trong cùng 4s cycle với traveler. Ghép
           với traveler tạo cảm giác "wave reaches each step". */
        @keyframes cp-step-pulse {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
          70%  { opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
        .cp-step-glow {
          position: relative;
        }
        .cp-step-glow::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          border: 3px solid rgb(52, 211, 153);
          animation: cp-step-pulse 4s ease-out infinite;
          animation-delay: calc(var(--i, 0) * 1s + 1600ms);
          opacity: 0;
          pointer-events: none;
        }
        /* Gold shimmer — sweep light từ trái sang phải qua ribbon. Pseudo
           layer ::before có gradient white-translucent đi từ -100% → 100%.
           Loop chậm 3.5s mỗi lần để không gây phân tâm. */
        @keyframes cp-shimmer {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
        .cp-ribbon-gold {
          position: relative;
          overflow: hidden;
        }
        .cp-ribbon-gold::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%);
          animation: cp-shimmer 3.5s ease-in-out infinite;
          pointer-events: none;
        }

        /* Ken Burns slow zoom — cinematic motion cho featured cover. Wrap
           Image trong div .cp-kb-slow để keyframe transform không chiến
           với group-hover scale. */
        @keyframes cp-ken-burns-slow {
          from { transform: scale(1); }
          to   { transform: scale(1.04); }
        }
        .cp-kb-slow {
          animation: cp-ken-burns-slow 12s ease-in-out infinite alternate;
        }

        /* Halo pulse — vòng sáng gold expand 0 → 8px outline + fade.
           "Heartbeat" 2.5s draws eye liên tục. Box-shadow inset:0 trên
           ::after để không ảnh hưởng layout. */
        @keyframes cp-halo-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.45),
                        0 0 0 0 rgba(251, 191, 36, 0.25);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(251, 191, 36, 0),
                        0 0 0 12px rgba(251, 191, 36, 0);
          }
        }
        .cp-halo {
          animation: cp-halo-pulse 2.5s ease-in-out infinite;
        }

        .cp-load {
          opacity: 0;
          animation: cp-fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--d, 0ms);
        }
        .cp-stamp {
          opacity: 0;
          animation: cp-stamp-in 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: var(--d, 600ms);
        }
        .cp-line {
          transform-origin: left center;
          animation: cp-line-draw 1200ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 400ms;
        }
        .cp-step {
          opacity: 0;
          animation: cp-step-pop 500ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: calc(var(--i, 0) * 200ms + 300ms);
        }
        .cp-card-stagger {
          animation: cp-fade-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: calc((var(--i, 0) % 8) * 70ms + 150ms);
        }

        @media (prefers-reduced-motion: reduce) {
          .cp-load, .cp-stamp, .cp-step, .cp-card-stagger {
            opacity: 1; transform: none; animation: none;
          }
          .cp-line { transform: scaleX(1); animation: none; }
          .cp-ribbon-gold::before { animation: none; display: none; }
          .cp-kb-slow, .cp-halo { animation: none; }
          .cp-flow-bar, .cp-traveler { animation: none; }
          .cp-traveler { display: none; }
          .cp-step-glow::after { animation: none; display: none; }
        }
      `}</style>

      {/* ─────── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-20 h-112 w-md rounded-full bg-[radial-gradient(circle,var(--color-emerald-500)_0%,transparent_60%)]/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-amber-500)_0%,transparent_60%)]/10 blur-2xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div
            className="cp-load flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300"
            style={{ "--d": "0ms" } as React.CSSProperties}
          >
            <CertSealIcon className="h-5 w-5" />
            <span>{t("heroEyebrow")}</span>
          </div>

          <h1
            className="cp-load font-serif-headline mt-6 text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[56px]"
            style={{ "--d": "150ms" } as React.CSSProperties}
          >
            {t("heroTitle1")}
            <br />
            {t("heroTitle2")}
            <br />
            <span className="text-emerald-300">{t("heroTitleCouncil", { count: COUNCIL_SIZE })}</span>{" "}
            {t("heroTitleSuffix")}
          </h1>

          <p
            className="cp-load mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg"
            style={{ "--d": "320ms" } as React.CSSProperties}
          >
            {t("heroSub", { validity: CERT_VALIDITY_YEARS })}
          </p>

          <div
            className="cp-load mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/15 pt-8"
            style={{ "--d": "480ms" } as React.CSSProperties}
          >
            <Stat number={totalProducts} label={t("statProducts")} />
            <Divider />
            <Stat number={totalCompanies} label={t("statCompanies")} />
            <Divider />
            <Stat number={monthsActive} label={t("statMonthsActive")} />
          </div>

          <div
            className="cp-load mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ "--d": "640ms" } as React.CSSProperties}
          >
            <Link
              href="/chung-nhan/nop-don"
              className="group inline-flex items-center justify-between gap-3 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-emerald-500/40"
            >
              <span>{t("ctaSubmit")}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#process"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              <span>{t("ctaProcess", { validity: CERT_VALIDITY_YEARS })}</span>
              <span aria-hidden>↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─────── PROCESS TIMELINE ───────────────────────────────────── */}
      <section id="process" className="relative bg-stone-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700">
              <span className="h-px w-10 bg-emerald-600/40" />
              {t("processEyebrow")}
              <span className="h-px w-10 bg-emerald-600/40" />
            </p>
            <h2 className="font-serif-headline mt-4 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              {t("processTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-brand-600 sm:text-base">
              {t("processSub")}
            </p>
          </div>

          <div className="relative">
            {/* Connecting line — desktop only.
                Layer 1 (bg track): static emerald-100 hairline.
                Layer 2 (cp-line): scale-x draw-in animation 1.2s on mount.
                Layer 3 (cp-flow-bar): continuous flowing gradient sau 1.6s.
                Layer 4 (cp-traveler): glowing dot di chuyển 4s loop. */}
            <div
              aria-hidden
              className="absolute left-[12.5%] right-[12.5%] top-[40px] hidden h-[2px] bg-emerald-100 md:block"
            >
              <div className="cp-line absolute inset-0 bg-linear-to-r from-emerald-500 to-emerald-400" />
              <div className="cp-flow-bar absolute inset-0" />
              <div className="cp-traveler" />
            </div>

            <div className="grid gap-8 md:grid-cols-4 md:gap-4">
              <Step num={t("stepLabel", { num: "01" })} icon="📋" title={t("step1Title")} desc={t("step1Desc")} index={0} />
              <Step num={t("stepLabel", { num: "02" })} icon="👥" title={t("step2Title")} desc={t("step2Desc", { count: COUNCIL_SIZE })} index={1} />
              <Step num={t("stepLabel", { num: "03" })} icon="🔍" title={t("step3Title")} desc={t("step3Desc")} index={2} />
              <Step num={t("stepLabel", { num: "04" })} icon="🏅" title={t("step4Title")} desc={t("step4Desc", { count: COUNCIL_SIZE, validity: CERT_VALIDITY_YEARS })} index={3} />
            </div>
          </div>

          <p
            className="mx-auto mt-10 max-w-2xl rounded-lg border border-amber-300 bg-amber-50/60 px-4 py-3 text-center text-xs text-amber-900"
          >
            ⚠️ <span dangerouslySetInnerHTML={{ __html: t("vetoNotice") }} />
          </p>
        </div>
      </section>

      {/* ─────── FEATURED CERTIFIED ──────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="relative overflow-hidden bg-brand-900 py-16 text-white sm:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--color-emerald-500)_0%,transparent_50%)]/8"
          />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
                  <span className="h-px w-10 bg-emerald-300/40" />
                  {t("featuredEyebrow")}
                </p>
                <h2 className="font-serif-headline mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {t("featuredTitle")}
                </h2>
              </div>
              <Link
                href="#directory"
                className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 transition-colors hover:text-emerald-200 sm:block"
              >
                {t("featuredViewAll")}
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
              {featured.map((p, i) => (
                <FeaturedProductCard
                  key={p.id}
                  product={p}
                  l={l}
                  index={i}
                  isAdmin={isAdminUser}
                  locale={locale}
                  certIssuedLabel={(date) => t("cardCertIssued", { date })}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────── FILTERS + DIRECTORY ─────────────────────────────────────
           Wrap chung 1 div để sticky scope của ProductFilters chỉ giới hạn
           trong vùng directory — không leak qua Aspiration CTA section. */}
      <div id="directory">
        <ProductFilters
          totalProducts={totalProducts}
          totalCompanies={totalCompanies}
          lastUpdated={lastUpdated}
        />

        <section className="bg-stone-50 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700">
                  <span className="h-px w-10 bg-emerald-600/40" />
                  {t("directoryEyebrow")}
                </p>
                <h2 className="font-serif-headline mt-3 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
                  {t("directoryTitle")}
                </h2>
              </div>
            </div>

            {/* Result count + clear filters */}
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-stone-600">
                {total === 0
                  ? t("noResultsFound")
                  : t("countLabel", {
                      first: ((page - 1) * PAGE_SIZE + 1).toLocaleString(locale),
                      last: Math.min(page * PAGE_SIZE, total).toLocaleString(locale),
                      total: total.toLocaleString(locale),
                    })}
                {hasActiveFilter && (
                  <Link
                    href="/san-pham-chung-nhan"
                    scroll={false}
                    className="ml-3 text-xs text-emerald-700 underline hover:text-emerald-800"
                  >
                    {t("clearFilters")}
                  </Link>
                )}
              </p>
            </div>

            {total === 0 ? (
              <div className="py-24 text-center">
                <AgarwoodPlaceholder className="mx-auto mb-4 h-20 w-20" size="lg" shape="full" tone="light" />
                <p className="text-lg font-medium text-stone-600">
                  {t("noMatchTitle")}
                </p>
                <p className="mt-2 text-sm text-stone-400">
                  {t("noMatchDesc")}
                </p>
                <Link href="/san-pham-chung-nhan" className="mt-4 inline-block text-sm text-emerald-700 underline hover:text-emerald-800">
                  {t("viewAllProducts")}
                </Link>
              </div>
            ) : view === "list" ? (
              /* List view — compact rows */
              <div className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                {products.map((product) => {
                  const firstImage = product.imageUrls[0] ?? null
                  return (
                    <Link
                      key={product.id}
                      href={`/san-pham/${product.slug}`}
                      className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-emerald-50/40"
                    >
                      <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        {firstImage ? (
                          <Image
                            src={firstImage}
                            alt={l(product, "name")}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <AgarwoodPlaceholder className="h-full w-full" size="xs" shape="square" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-2">
                          <h3 className="text-sm font-semibold leading-snug text-brand-900 transition-colors group-hover:text-emerald-700">
                            {l(product, "name")}
                          </h3>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            {t("listCertBadge")}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                          {product.company!.name}
                          {l(product, "category") && ` · ${l(product, "category")}`}
                          {product.company!.address &&
                            ` · ${product.company!.address.split(",").at(-1)?.trim()}`}
                          {product.certApprovedAt &&
                            ` · ${t("listCertIssued", { date: new Date(product.certApprovedAt).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" }) })}`}
                        </p>
                      </div>

                      <span className="hidden shrink-0 text-xs text-stone-400 sm:block">{t("listView")}</span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              /* Grid view (mặc định) — portrait cards với cert seal */
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product, i) => (
                  <CertProductCard
                    key={product.id}
                    card={{
                      id: product.id,
                      slug: product.slug,
                      name: l(product, "name"),
                      companyName: l(product.company!, "name"),
                      category: l(product, "category") ?? "",
                      imageFirst: product.imageUrls[0] ?? null,
                      certApprovedAt: product.certApprovedAt
                        ? new Date(product.certApprovedAt).toISOString()
                        : null,
                      isFeatured: product.isFeatured,
                    }}
                    index={i}
                    isAdmin={isAdminUser}
                    locale={locale}
                    featuredTagline={t("cardFeaturedTagline")}
                    featuredBadge={t("cardFeatured")}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) }, currentParams)}
                    scroll={false}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 transition-colors hover:border-emerald-500 hover:text-emerald-700"
                  >
                    {t("paginationPrev")}
                  </Link>
                )}

                {paginationRange(page, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="select-none px-2 py-2 text-sm text-stone-400">…</span>
                  ) : (
                    <Link
                      key={p}
                      href={buildUrl({ page: String(p) }, currentParams)}
                      scroll={false}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                        p === page
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-stone-300 bg-white text-stone-700 hover:border-emerald-500 hover:text-emerald-700",
                      )}
                    >
                      {p}
                    </Link>
                  ),
                )}

                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) }, currentParams)}
                    scroll={false}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 transition-colors hover:border-emerald-500 hover:text-emerald-700"
                  >
                    {t("paginationNext")}
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ─────── ASPIRATION CTA ──────────────────────────────────────────
           Emerald-950 (jade lacquer) — KHÁC brand-900 (wood brown) của
           SiteFooter để 2 vùng tối không blur. Brass-on-jade palette. */}
      <section className="relative overflow-hidden bg-emerald-950 py-16 text-white sm:py-24">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-400/70 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-amber-400/70 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,var(--color-emerald-400)_0%,transparent_50%),radial-gradient(circle_at_80%_50%,var(--color-amber-500)_0%,transparent_55%)]/15"
        />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300">
            <span className="h-px w-10 bg-amber-300/50" />
            {t("aspirationEyebrow")}
            <span className="h-px w-10 bg-amber-300/50" />
          </p>
          <h2 className="font-serif-headline mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t("aspirationTitle")}{" "}
            <span className="text-amber-300">{t("aspirationTitleEm")}</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-emerald-100/75">
            {t("aspirationDesc")}
          </p>

          <div className="mx-auto mt-10 flex max-w-md items-center justify-between text-emerald-200/85">
            <MiniStep label={t("miniStep1")} icon="📋" />
            <MiniDot />
            <MiniStep label={t("miniStep2")} icon="👥" />
            <MiniDot />
            <MiniStep label={t("miniStep3")} icon="🔍" />
            <MiniDot />
            <MiniStep label={t("miniStep4")} icon="🏅" />
          </div>

          <Link
            href="/chung-nhan/nop-don"
            className="group mt-10 inline-flex items-center gap-3 rounded-xl bg-amber-500 px-7 py-4 text-sm font-semibold text-emerald-950 shadow-xl shadow-amber-500/30 transition-all hover:-translate-y-0.5 hover:bg-amber-400 hover:shadow-amber-400/50 sm:text-base"
          >
            <span>{t("aspirationCta")}</span>
            <span className="transition-transform group-hover:translate-x-1.5">→</span>
          </Link>
          <p className="mt-4 text-xs text-emerald-100/55">
            {t("aspirationNote")}
          </p>
        </div>
      </section>
    </div>
  )
}

// ── Subcomponents ───────────────────────────────────────────────────────────

type ProductRow = Awaited<
  ReturnType<typeof prisma.product.findMany<{ select: typeof PRODUCT_CARD_SELECT }>>
>[number]

function Stat({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-serif-headline text-4xl font-bold tabular-nums text-emerald-300 sm:text-5xl">
        {number}
      </span>
      <span className="text-sm text-white/70">{label}</span>
    </div>
  )
}

function Divider() {
  return <span aria-hidden className="hidden h-10 w-px bg-white/15 sm:block" />
}

function Step({
  num,
  icon,
  title,
  desc,
  index,
}: {
  num: string
  icon: string
  title: string
  desc: string
  index: number
}) {
  return (
    <div
      className="cp-step relative flex flex-col items-center text-center"
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="cp-step-glow relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-stone-50 bg-brand-900 text-2xl shadow-lg ring-2 ring-emerald-500">
        <span aria-hidden>{icon}</span>
      </div>
      <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
        {num}
      </span>
      <h3 className="font-serif-headline mt-1 text-xl font-bold text-brand-900">
        {title}
      </h3>
      <p className="mt-2 max-w-[18ch] text-xs leading-relaxed text-brand-600">
        {desc}
      </p>
    </div>
  )
}

function MiniStep({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span aria-hidden className="text-2xl">{icon}</span>
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </div>
  )
}

function MiniDot() {
  return (
    <span aria-hidden className="inline-block h-1 w-1 rounded-full bg-emerald-300/60" />
  )
}

function CertSealIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 11 2 2 4-4" />
    </svg>
  )
}



function FeaturedProductCard({
  product,
  l,
  index,
  isAdmin,
  locale,
  certIssuedLabel,
}: {
  product: ProductRow
  l: <T extends Record<string, unknown>>(rec: T, field: string) => string
  index: number
  isAdmin?: boolean
  locale: Locale
  certIssuedLabel: (date: string) => string
}) {
  const firstImage = product.imageUrls[0]
  return (
    // Overlay-link pattern: outer là <div>, inner Link absolute z-10. Admin
    // toggle z-20 nhận click trước Link. Tránh nested <a> + <button>.
    <div
      className="cp-card-stagger group relative flex flex-col overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white/10 hover:ring-emerald-300/40"
      style={{ "--i": index } as React.CSSProperties}
    >
      <Link
        href={`/san-pham/${product.slug}`}
        aria-label={l(product, "name")}
        className="absolute inset-0 z-10"
      />
      <div className="relative aspect-4/5 overflow-hidden bg-brand-800">
        {firstImage ? (
          <Image
            src={cloudinaryResize(firstImage, 480)}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <AgarwoodPlaceholder className="h-full w-full" size="md" shape="square" tone="dark" />
        )}
        <div className="absolute right-3 top-3 z-20">
          <CertifiedSeal size={56} delay={600 + index * 120} />
        </div>
        {/* Admin-only ★ tiêu biểu toggle — góc trái-trên, z-20 nhận click trước Link overlay */}
        {isAdmin && (
          <div className="absolute left-3 top-3 z-20">
            <ProductFeatureToggleBtn
              productId={product.id}
              initialFeatured={product.isFeatured}
            />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-serif-headline line-clamp-2 text-sm font-semibold leading-tight text-white">
          {l(product, "name")}
        </h3>
        <p className="mt-1 line-clamp-1 text-[11px] text-white/60">
          {product.company!.name}
        </p>
        {product.certApprovedAt && (
          <p className="mt-2 text-[10px] uppercase tracking-wider text-emerald-300/70">
            {certIssuedLabel(
              new Date(product.certApprovedAt).toLocaleDateString(locale, {
                month: "2-digit",
                year: "numeric",
              }),
            )}
          </p>
        )}
      </div>
    </div>
  )
}
