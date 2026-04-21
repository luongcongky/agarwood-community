import Image from "next/image"
import Link from "next/link"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"

/**
 * Doanh nghiệp tiêu biểu — marquee chạy ngang, layout mirror PartnersCarousel.
 * Source: Company với `isPublished=true AND isFeatured=true`, sort theo
 * `featuredOrder ASC`. Admin pin bằng cách set isFeatured + featuredOrder ở
 * trang /admin/doanh-nghiep.
 * Card click → /doanh-nghiep/[slug]. Hover hiện tên + representative position.
 */

function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  const palette = [
    "bg-emerald-700",
    "bg-amber-700",
    "bg-sky-700",
    "bg-rose-700",
    "bg-violet-700",
    "bg-teal-700",
    "bg-orange-700",
    "bg-indigo-700",
  ]
  return palette[Math.abs(hash) % palette.length]
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join("")
    .toUpperCase()
}

const getFeaturedCompanies = unstable_cache(
  async () =>
    prisma.company.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        name: true, name_en: true, name_zh: true, name_ar: true,
        description: true, description_en: true, description_zh: true, description_ar: true,
        logoUrl: true,
        representativePosition: true,
        representativePosition_en: true,
        representativePosition_zh: true,
        representativePosition_ar: true,
      },
    }),
  ["homepage_featured_companies"],
  { revalidate: 300, tags: ["homepage", "companies"] },
)

const CARD_BG_STYLE: React.CSSProperties = {
  backgroundImage: [
    "image-set(url('/partners-card-bg.webp') type('image/webp'), url('/partners-card-bg.jpg') type('image/jpeg'))",
    "linear-gradient(135deg, #f8efdf 0%, #f2e4c9 100%)",
  ].join(", "),
  backgroundSize: "cover, cover",
  backgroundPosition: "center, center",
  backgroundRepeat: "no-repeat, no-repeat",
}

export async function FeaturedCompaniesCarousel() {
  const [companies, t, locale] = await Promise.all([
    getFeaturedCompanies(),
    getTranslations("homepage"),
    getLocale() as Promise<Locale>,
  ])

  if (companies.length === 0) {
    // Admin chưa pin doanh nghiệp nào — ẩn luôn section thay vì hiện empty
    // state (tránh "không gian chết" trên trang chủ).
    return null
  }

  const localized = companies.map((c) => ({
    ...c,
    localName: localize(c, "name", locale) as string,
    localDesc: localize(c, "description", locale) as string | null,
    localPosition: localize(c, "representativePosition", locale) as string | null,
  }))

  const items = [...localized, ...localized]

  return (
    <section className="bg-brand-50/85 backdrop-blur-[2px] py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-900 sm:text-2xl">
              {t("featuredCompaniesTitle")}
            </h2>
            <p className="text-sm text-brand-500 mt-0.5">
              {t("featuredCompaniesSubtitle")}
            </p>
          </div>
          <Link
            href="/doanh-nghiep"
            className="hidden sm:inline-block text-sm font-medium text-brand-600 hover:text-brand-800 underline underline-offset-4"
          >
            {t("viewAll")}
          </Link>
        </header>

        <div
          className="group relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
          }}
        >
          <div className="flex gap-4 w-max animate-[homepage-featured-companies-marquee_70s_linear_infinite] group-hover:paused">
            {items.map((c, idx) => {
              const initials = getInitials(c.localName)
              const overlayText = c.localPosition ?? c.localDesc ?? null

              return (
                <Link
                  key={`${c.id}-${idx}`}
                  href={`/doanh-nghiep/${c.slug}`}
                  title={c.localName}
                  aria-label={c.localName}
                  className="block"
                >
                  <div
                    className="group/card relative w-44 h-44 shrink-0 rounded-xl border border-amber-200/60 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                    style={CARD_BG_STYLE}
                  >
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      {c.logoUrl ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={c.logoUrl}
                            alt={c.localName}
                            fill
                            className="object-contain drop-shadow-sm"
                            sizes="144px"
                          />
                        </div>
                      ) : (
                        <span
                          className={`flex items-center justify-center w-20 h-20 rounded-full text-white text-lg font-bold shadow-md ${colorFromName(c.localName)}`}
                        >
                          {initials}
                        </span>
                      )}
                    </div>

                    <div
                      className="absolute inset-0 flex flex-col justify-end p-3 bg-linear-to-t from-black/85 via-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200"
                      aria-hidden
                    >
                      <p className="text-xs font-bold text-white leading-tight line-clamp-2">
                        {c.localName}
                      </p>
                      {overlayText && (
                        <p className="mt-1 text-[11px] text-white/85 leading-snug line-clamp-3">
                          {overlayText}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes homepage-featured-companies-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
