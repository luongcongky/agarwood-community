import Image from "next/image"
import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { prisma } from "@/lib/prisma"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { BLUR_DATA_URL } from "@/lib/seo/blur-placeholder"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import { CERT_VALIDITY_YEARS } from "@/lib/certification-council-constants"
import { FeatureToggleBtn } from "./FeatureToggleBtn"
import { AnimatedCount } from "./AnimatedCount"

export async function generateMetadata() {
  const t = await getTranslations("companies")
  return {
    title: t("metaTitle"),
    alternates: { canonical: "/doanh-nghiep" },
  }
}

// Phase 3.7 round 4 (2026-04): page-level ISR đã bỏ vì admin toggle "Tiêu
// biểu" / "Xác minh" cần phản ánh ngay mà revalidateTag/revalidatePath trong
// Next 16 không bust reliably. Dataset nhỏ (<50 DN) nên 1 SELECT mỗi request
// không đáng kể.
export const dynamic = "force-dynamic"

function lastAddressSegment(addr: string): string {
  return addr.split(",").pop()?.trim() ?? addr
}

function displayWebsite(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

const COMPANY_SELECT = {
  id: true,
  name: true, name_en: true, name_zh: true, name_ar: true,
  slug: true,
  logoUrl: true,
  coverImageUrl: true,
  address: true, address_en: true, address_zh: true, address_ar: true,
  foundedYear: true,
  phone: true,
  website: true,
  isVerified: true,
  isFeatured: true,
  featuredOrder: true,
  // Filtered count: chỉ tính SP đã được Hội đồng cấp chứng nhận (APPROVED).
  // Phase 5.1 (2026-05) — show "N chứng nhận" pill trên card để user thấy
  // được thành tựu cụ thể của DN.
  _count: {
    select: {
      products: { where: { certStatus: "APPROVED" as const } },
    },
  },
} as const

type CompanyCard = Awaited<
  ReturnType<typeof prisma.company.findMany<{ select: typeof COMPANY_SELECT }>>
>[number]

export default async function MembersPage() {
  const [locale, session, t] = await Promise.all([
    getLocale() as Promise<Locale>,
    auth(),
    getTranslations("companies"),
  ])
  const isAdminUser = isAdmin(session?.user?.role)

  // 4 query song song: list DN + 3 stats hero. Stats nhẹ (count/aggregate),
  // không cần cache riêng.
  const [companies, totalCompanies, totalCertified, foundedAgg] = await Promise.all([
    prisma.company.findMany({
      where: { isPublished: true },
      orderBy: [
        { isFeatured: "desc" },
        { featuredOrder: "asc" },
        { isVerified: "desc" },
        { createdAt: "desc" },
      ],
      select: COMPANY_SELECT,
    }),
    prisma.company.count({ where: { isPublished: true } }),
    prisma.product.count({ where: { certStatus: "APPROVED" } }),
    prisma.company.aggregate({
      _min: { foundedYear: true },
      where: { isPublished: true, foundedYear: { not: null } },
    }),
  ])

  const oldestYear = foundedAgg._min.foundedYear ?? new Date().getFullYear()
  const heritageYears = Math.max(0, new Date().getFullYear() - oldestYear)

  const l = <T extends Record<string, unknown>>(rec: T, field: string) =>
    localize(rec, field, locale) as string

  // Featured spotlight = top 3 DN có isFeatured. Còn lại đổ xuống directory
  // grid. Nếu <3 featured, fill placeholder slot "vị trí trống" (nudge admin
  // hoặc DN đăng ký).
  const featured = companies.filter((c) => c.isFeatured).slice(0, 3)
  const featuredIds = new Set(featured.map((c) => c.id))
  const restCompanies = companies.filter((c) => !featuredIds.has(c.id))

  const isLoggedIn = !!session?.user
  const ctaHref = isLoggedIn ? "/admin" : "/dang-ky"
  const ctaLabel = isLoggedIn
    ? "Đăng ký vị trí Tiêu biểu"
    : "Đăng ký hội viên doanh nghiệp"

  const monthYear = new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(new Date())

  return (
    <div className="bg-brand-50/40">
      {/* Animation keyframes — pure CSS, không cần JS hydrate.
          Tôn trọng prefers-reduced-motion: disable mọi animation khi user
          chọn reduce. Counter tick-up trên stats là client component (xem
          AnimatedCount.tsx), tween qua requestAnimationFrame. */}
      <style>{`
        @keyframes dn-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dn-blob-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(-22px, 28px) scale(1.05); }
          66%      { transform: translate(18px, -12px) scale(0.96); }
        }
        @keyframes dn-pop-in {
          0%   { opacity: 0; transform: scale(0.6); }
          60%  { opacity: 1; transform: scale(1.12); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes dn-ken-burns {
          from { transform: scale(1); }
          to   { transform: scale(1.06); }
        }

        /* Hero load cascade — mỗi phần tử set --d (delay) inline */
        .dn-load {
          opacity: 0;
          animation: dn-fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--d, 0ms);
        }
        .dn-blob {
          animation: dn-blob-drift 14s ease-in-out infinite;
        }
        .dn-pop {
          opacity: 0;
          animation: dn-pop-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: var(--d, 400ms);
        }
        .dn-kb {
          animation: dn-ken-burns 12s ease-in-out infinite alternate;
        }

        /* Card stagger — cascade delay theo index, cap modulo 12 để delay
           tối đa ~860ms (đủ ấn tượng, không bắt user chờ). Fill mode "both":
           ẩn trước delay, giữ end state sau khi xong. */
        .dn-card-stagger {
          animation: dn-fade-up 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: calc((var(--i, 0) % 12) * 55ms + 200ms);
        }

        @media (prefers-reduced-motion: reduce) {
          .dn-load, .dn-pop, .dn-card-stagger {
            opacity: 1; transform: none; animation: none;
          }
          .dn-blob, .dn-kb { animation: none; }
        }
      `}</style>

      {/* ── HERO STRIP ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-brand-200/60 bg-white">
        {/* Decorative gold drop accent — drift 14s loop để trang "thở" */}
        <div
          aria-hidden
          className="dn-blob pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--color-amber-200)_0%,transparent_60%)]/50 blur-2xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            {/* Headline — cascade delay theo flow đọc */}
            <div className="lg:col-span-7">
              <p
                className="dn-load flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-700"
                style={{ "--d": "0ms" } as React.CSSProperties}
              >
                <span className="h-px w-10 bg-brand-700/40" />
                Niên giám hội viên
              </p>
              <h1
                className="dn-load font-serif-headline mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-brand-900 sm:text-5xl lg:text-[58px]"
                style={{ "--d": "120ms" } as React.CSSProperties}
              >
                Những doanh nghiệp <br className="hidden sm:block" />
                <span className="italic text-brand-700">giữ lửa</span> cho di sản{" "}
                <span className="whitespace-nowrap">trầm hương Việt.</span>
              </h1>
              <p
                className="dn-load mt-6 max-w-xl text-base leading-relaxed text-brand-600 sm:text-lg"
                style={{ "--d": "280ms" } as React.CSSProperties}
              >
                Niên giám doanh nghiệp được Hội Trầm Hương Việt Nam xét duyệt — đại diện cho những
                đơn vị uy tín trong nuôi trồng, chế tác và phân phối trầm hương theo chuẩn mực bền
                vững.
              </p>
            </div>

            {/* Stats + CTA — vào sân khấu sau headline */}
            <div className="lg:col-span-5">
              <ul
                className="dn-load grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-brand-200/70 ring-1 ring-brand-300/60 shadow-sm"
                style={{ "--d": "440ms" } as React.CSSProperties}
              >
                <Stat value={totalCompanies} label="doanh nghiệp" />
                <Stat value={totalCertified} label="sản phẩm chứng nhận" />
                <Stat value={heritageYears} suffix="+" label="năm di sản" />
              </ul>
              <Link
                href={ctaHref}
                className="dn-load group mt-6 inline-flex w-full items-center justify-between gap-3 rounded-xl bg-brand-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-lg sm:w-auto"
                style={{ "--d": "600ms" } as React.CSSProperties}
              >
                <span>{ctaLabel}</span>
                <span className="text-amber-400 transition-transform duration-300 group-hover:translate-x-1.5">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED SPOTLIGHT ───────────────────────────────────────────
           Premium zone — bg gradient amber tách khỏi 2 section trắng kế bên,
           hairline gold trên/dưới như viền tủ kính prestige, header có gold
           accent underline. */}
      {featured.length > 0 && (
        <section className="relative bg-linear-to-b from-amber-50/60 via-amber-50/20 to-amber-50/50">
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
            className="pointer-events-none absolute top-10 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-amber-300)_0%,transparent_60%)]/25 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-700">
                  <span className="text-base text-amber-500">★</span>
                  <span>Tiêu biểu của Hội</span>
                </p>
                <h2 className="font-serif-headline mt-3 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl lg:text-[44px]">
                  Những đơn vị tiên phong
                </h2>
                <div className="mt-4 h-[3px] w-20 rounded-full bg-linear-to-r from-amber-500 via-amber-400 to-amber-300" />
              </div>
              <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-amber-700/70 sm:block">
                Niên giám {monthYear}
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
              {featured[0] && (
                <FeaturedHero
                  company={featured[0]}
                  l={l}
                  isAdmin={isAdminUser}
                  visitWebsiteLabel={t("visitWebsite")}
                />
              )}

              <div className="grid grid-cols-1 gap-4 lg:gap-6">
                {featured.slice(1, 3).map((c) => (
                  <FeaturedSide key={c.id} company={c} l={l} isAdmin={isAdminUser} />
                ))}
                {featured.length === 1 && <FeaturedSidePlaceholder ctaHref={ctaHref} />}
                {featured.length === 2 && <FeaturedSidePlaceholder ctaHref={ctaHref} />}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── DIRECTORY GRID ───────────────────────────────────────────── */}
      <section className="bg-brand-50/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-700">
                <span className="h-px w-10 bg-brand-700/40" />
                Toàn bộ hội viên
              </p>
              <h2 className="font-serif-headline mt-2 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
                Danh bạ doanh nghiệp
              </h2>
            </div>
            <p className="hidden text-sm text-brand-500 tabular-nums sm:block">
              {restCompanies.length} đơn vị
            </p>
          </div>

          {restCompanies.length === 0 ? (
            <p className="text-center text-brand-500">Chưa có doanh nghiệp nào trong danh bạ.</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {restCompanies.map((c, i) => (
                <DirectoryCard
                  key={c.id}
                  company={c}
                  l={l}
                  isAdmin={isAdminUser}
                  visitWebsiteLabel={t("visitWebsite")}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ASPIRATION CTA BAND ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18] bg-[radial-gradient(circle_at_18%_28%,#fbbf24_0,transparent_45%),radial-gradient(circle_at_82%_72%,#f97316_0,transparent_50%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-400">
                <span className="h-px w-10 bg-amber-400/50" />
                Trở thành hội viên
              </p>
              <h2 className="font-serif-headline mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
                Vị trí tiếp theo trong niên giám —{" "}
                <span className="italic text-amber-400">có thể là bạn.</span>
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70">
                Tham gia Hội để hiện diện cùng những thương hiệu đã định hình ngành trầm hương Việt
                Nam — nâng cao uy tín, tiếp cận hệ thống chứng nhận & xét duyệt sản phẩm theo
                chuẩn của Hội.
              </p>
            </div>
            <div className="space-y-3 lg:col-span-5">
              <BenefitRow
                num="01"
                title="Niên giám điện tử"
                desc="Tên doanh nghiệp xuất hiện trong danh bạ chính thức, được Google index."
              />
              <BenefitRow
                num="02"
                title="Chứng nhận sản phẩm"
                desc={`Quy trình thẩm định 5 thành viên hội đồng — chứng nhận có hiệu lực ${CERT_VALIDITY_YEARS} năm, có thể gia hạn.`}
              />
              <BenefitRow
                num="03"
                title="Vị trí Tiêu biểu"
                desc="Cơ hội được Hội đề cử lên đầu trang — tăng độ tin cậy với khách hàng."
              />
              <Link
                href={ctaHref}
                className="group mt-3 inline-flex w-full items-center justify-between gap-3 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-semibold text-brand-900 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:shadow-amber-400/30"
              >
                <span>{ctaLabel}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Subcomponents ───────────────────────────────────────────────────────────

function Stat({
  value,
  label,
  suffix,
}: {
  value: number
  label: string
  suffix?: string
}) {
  return (
    <li className="bg-white p-5 text-center">
      <p className="font-serif-headline text-3xl font-bold tabular-nums text-brand-900 sm:text-4xl">
        <AnimatedCount value={value} suffix={suffix} />
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-brand-500">
        {label}
      </p>
    </li>
  )
}

function FeaturedHero({
  company,
  l,
  isAdmin,
  visitWebsiteLabel,
}: {
  company: CompanyCard
  l: <T extends Record<string, unknown>>(rec: T, field: string) => string
  isAdmin: boolean
  visitWebsiteLabel: string
}) {
  const productsCount = company._count.products
  return (
    // Overlay-link pattern: outer là <div>, inner Link absolute z-10 phủ vùng
    // visual; admin toggle + website button nằm z-20 để nhận click trước.
    // Tránh nested <a> + <button> trong outer <a> (HTML5 không cho phép).
    // Gold ring + amber shadow → cảm giác "tủ kính prestige" tách khỏi card thường.
    <div className="group relative overflow-hidden rounded-2xl bg-brand-100 ring-2 ring-amber-400/40 shadow-[0_12px_40px_rgb(180,120,30,0.18)] lg:col-span-2 aspect-4/3 lg:aspect-16/10">
      <Link
        href={`/doanh-nghiep/${company.slug}`}
        aria-label={l(company, "name")}
        className="absolute inset-0 z-10"
      />

      {company.coverImageUrl ? (
        // Ken Burns slow zoom — wrap div riêng để tách khỏi `transition` hover
        // (nếu để cùng class thì hover scale-105 sẽ chiến với keyframe).
        <div className="dn-kb absolute inset-0">
          <Image
            src={company.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.08]"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            priority
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-brand-300 via-brand-400 to-brand-600" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-brand-900/95 via-brand-900/45 to-transparent" />

      <span
        className="dn-pop absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-linear-to-br from-amber-400 to-amber-600 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-900 shadow-xl ring-2 ring-white"
        style={{ "--d": "700ms" } as React.CSSProperties}
      >
        <span className="text-sm leading-none">★</span> Tiêu biểu
      </span>

      {isAdmin && (
        <div className="absolute right-3 top-3 z-20">
          <FeatureToggleBtn
            companyId={company.id}
            initialFeatured={company.isFeatured}
          />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <div className="flex items-end gap-4">
          {company.logoUrl && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-4 ring-white shadow-xl sm:h-20 sm:w-20">
              <Image
                src={company.logoUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-serif-headline text-2xl font-bold leading-tight text-white sm:text-3xl">
              {l(company, "name")}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/85 sm:text-sm">
              {company.foundedYear && <span>Từ {company.foundedYear}</span>}
              {company.foundedYear && productsCount > 0 && (
                <span aria-hidden className="opacity-50">·</span>
              )}
              {productsCount > 0 && (
                <span>
                  <span className="font-semibold text-amber-300">{productsCount}</span> sản phẩm
                  chứng nhận
                </span>
              )}
              {l(company, "address") && (
                <>
                  <span aria-hidden className="opacity-50">·</span>
                  <span>{lastAddressSegment(l(company, "address"))}</span>
                </>
              )}
            </div>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-20 mt-3 inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                {visitWebsiteLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturedSide({
  company,
  l,
  isAdmin,
}: {
  company: CompanyCard
  l: <T extends Record<string, unknown>>(rec: T, field: string) => string
  isAdmin: boolean
}) {
  const productsCount = company._count.products
  return (
    <div className="group relative aspect-16/10 overflow-hidden rounded-2xl bg-brand-100 ring-2 ring-amber-400/40 shadow-[0_8px_24px_rgb(180,120,30,0.15)] lg:aspect-auto lg:flex-1">
      <Link
        href={`/doanh-nghiep/${company.slug}`}
        aria-label={l(company, "name")}
        className="absolute inset-0 z-10"
      />
      {company.coverImageUrl ? (
        <Image
          src={company.coverImageUrl}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-brand-200 to-brand-400" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-brand-900/90 via-brand-900/30 to-transparent" />
      <span
        className="dn-pop absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-linear-to-br from-amber-400 to-amber-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-brand-900 shadow-lg ring-2 ring-white/80"
        style={{ "--d": "850ms" } as React.CSSProperties}
      >
        <span className="text-xs leading-none">★</span> Tiêu biểu
      </span>
      {isAdmin && (
        <div className="absolute right-2 top-2 z-20">
          <FeatureToggleBtn
            companyId={company.id}
            initialFeatured={company.isFeatured}
          />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-serif-headline text-lg font-bold leading-tight text-white">
          {l(company, "name")}
        </h3>
        <p className="mt-1 text-xs text-white/75">
          {productsCount > 0
            ? `${productsCount} sản phẩm chứng nhận`
            : company.foundedYear
              ? `Hội viên từ ${company.foundedYear}`
              : "Hội viên Hội Trầm Hương VN"}
        </p>
      </div>
    </div>
  )
}

/** Empty featured slot — nudge cho admin (hoặc DN) thấy "vị trí trống" */
function FeaturedSidePlaceholder({ ctaHref }: { ctaHref: string }) {
  return (
    <Link
      href={ctaHref}
      className="group relative flex aspect-16/10 flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-4 text-center transition-colors hover:border-amber-500 hover:bg-amber-50 lg:aspect-auto lg:flex-1"
    >
      <span className="font-serif-headline text-3xl text-amber-500">★</span>
      <p className="mt-2 text-sm font-semibold text-brand-900">Vị trí Tiêu biểu còn trống</p>
      <p className="mt-1 text-xs text-brand-600">Đăng ký để được Hội đề cử</p>
    </Link>
  )
}

function DirectoryCard({
  company,
  l,
  isAdmin,
  visitWebsiteLabel,
  index,
}: {
  company: CompanyCard
  l: <T extends Record<string, unknown>>(rec: T, field: string) => string
  isAdmin: boolean
  visitWebsiteLabel: string
  /** Index trong list — dùng cho stagger delay. */
  index: number
}) {
  const productsCount = company._count.products
  const address = l(company, "address")
  const detailUrl = `/doanh-nghiep/${company.slug}`

  return (
    // Card không phải <a> wrapper duy nhất — footer chứa <a website> +
    // <button toggle> sẽ vi phạm HTML5 (<a> không nest <a>/<button>).
    // Cover + header có Link riêng tới detail; footer là layer độc lập.
    <div
      className="dn-card-stagger group flex flex-col overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-400 hover:shadow-xl"
      style={{ "--i": index } as React.CSSProperties}
    >
      {/* Cover (clickable) */}
      <Link
        href={detailUrl}
        aria-label={l(company, "name")}
        className="relative block aspect-16/7 w-full overflow-hidden bg-brand-100"
      >
        {company.coverImageUrl ? (
          <Image
            src={company.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-brand-100 via-amber-50/40 to-brand-200/60" />
        )}
        {company.isFeatured && (
          <span
            className="dn-pop absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.15em] text-brand-900 shadow ring-1 ring-white"
            style={{ "--d": "200ms" } as React.CSSProperties}
          >
            ★ Tiêu biểu
          </span>
        )}
      </Link>

      {/* Header (logo + name) clickable */}
      <Link href={detailUrl} className="flex items-start gap-3 px-4 pt-3">
        <div className="relative -mt-9 h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white shadow-md ring-4 ring-white">
          {company.logoUrl ? (
            <Image
              src={company.logoUrl}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <AgarwoodPlaceholder
              className="h-full w-full"
              shape="full"
              size="sm"
              tone="light"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-brand-900 transition-colors group-hover:text-brand-700">
            {l(company, "name")}
          </h3>
          {company.isVerified && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
              ✓ Đã xác minh
            </span>
          )}
        </div>
      </Link>

      {/* Body — chỉ hiện số điện thoại liên hệ. Description gốc dài + chứa
          dữ liệu lộn xộn (Địa chỉ + Hotline trộn nhau) đã bỏ. */}
      <div className="flex flex-1 flex-col gap-2 px-4 pt-2">
        {company.phone && (
          <a
            href={`tel:${company.phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-900 transition-colors"
          >
            <span aria-hidden>📞</span>
            <span className="tabular-nums">{company.phone}</span>
          </a>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {productsCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              ✓ {productsCount} chứng nhận
            </span>
          )}
          {company.foundedYear && (
            <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">
              Từ {company.foundedYear}
            </span>
          )}
          {address && (
            <span className="inline-flex items-center rounded-full border border-brand-200 bg-white px-2 py-0.5 text-[10px] font-medium text-brand-600">
              📍 {lastAddressSegment(address)}
            </span>
          )}
        </div>
      </div>

      {/* Footer — actions: detail + website + admin toggle.
          Tách khỏi Link wrapper để các phần tử anchor/button hợp lệ HTML5. */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-brand-100 px-4 py-2.5">
        <Link
          href={detailUrl}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700/80 transition-colors hover:text-brand-900 group-hover:text-brand-900"
        >
          <span>Xem chi tiết</span>
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              title={displayWebsite(company.website)}
              className="inline-flex items-center gap-1 rounded-md border border-brand-300 bg-white px-2 py-1 text-[10px] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              {visitWebsiteLabel}
            </a>
          )}
          {isAdmin && (
            <FeatureToggleBtn
              companyId={company.id}
              initialFeatured={company.isFeatured}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function BenefitRow({
  num,
  title,
  desc,
}: {
  num: string
  title: string
  desc: string
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-amber-400/30 hover:bg-white/10">
      <span className="font-serif-headline text-2xl font-bold leading-none text-amber-400">
        {num}
      </span>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-white/65">{desc}</p>
      </div>
    </div>
  )
}
