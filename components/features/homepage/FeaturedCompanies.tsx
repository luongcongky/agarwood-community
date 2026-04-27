import Image from "next/image"
import Link from "next/link"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { Section } from "./Section"

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
        name: true,
        name_en: true,
        name_zh: true,
        name_ar: true,
        logoUrl: true,
      },
    }),
  ["homepage_featured_companies"],
  { revalidate: 300, tags: ["homepage", "companies"] },
)

export async function FeaturedCompanies() {
  const [companies, t, locale] = await Promise.all([
    getFeaturedCompanies(),
    getTranslations("homepage"),
    getLocale() as Promise<Locale>,
  ])

  if (companies.length === 0) return null

  const localized = companies.map((c) => ({
    ...c,
    localName: localize(c, "name", locale) as string,
  }))
  const items = [...localized, ...localized]

  return (
    <Section title={t("featuredCompaniesTitle")} titleHref="/doanh-nghiep">
      <div
        className="group relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
        }}
      >
        <div className="flex w-max animate-[homepage-featured-companies-marquee_70s_linear_infinite] gap-4 group-hover:paused">
          {items.map((c, idx) => {
            const initials = getInitials(c.localName)
            return (
              <Link
                key={`${c.id}-${idx}`}
                href={`/doanh-nghiep/${c.slug}`}
                title={c.localName}
                aria-label={c.localName}
                className="block"
              >
                <div className="relative h-36 w-36 shrink-0 overflow-hidden border border-neutral-200 bg-white">
                  {c.logoUrl ? (
                    <Image
                      src={c.logoUrl}
                      alt={c.localName}
                      fill
                      // object-cover để logo lấp full khung 144×144 (Phase 3.7
                      // round 4 — 2026-04 customer feedback). Logo aspect lệch
                      // sẽ bị crop nhẹ ở mép, đổi lại không có lề trắng.
                      className="object-cover"
                      sizes="144px"
                    />
                  ) : (
                    <span
                      className={`flex h-full w-full items-center justify-center text-2xl font-bold text-white ${colorFromName(c.localName)}`}
                    >
                      {initials}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes homepage-featured-companies-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </Section>
  )
}
