import Link from "next/link"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { LeaderSectionGrid, type LeaderCardData, type LeaderSection } from "./LeaderSectionGrid"

export const revalidate = 600

/** Leaders thay đổi chậm (admin CRUD), cache 10 phút. */
const getAllActiveLeaders = unstable_cache(
  () =>
    prisma.leader.findMany({
      where: { isActive: true },
      orderBy: [{ term: "desc" }, { category: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        name: true, name_en: true, name_zh: true, name_ar: true,
        honorific: true, honorific_en: true, honorific_zh: true, honorific_ar: true,
        title: true, title_en: true, title_zh: true, title_ar: true,
        workTitle: true, workTitle_en: true, workTitle_zh: true, workTitle_ar: true,
        bio: true, bio_en: true, bio_zh: true, bio_ar: true,
        photoUrl: true,
        category: true,
        term: true,
      },
    }),
  ["ban-lanh-dao_leaders"],
  { revalidate: 600, tags: ["leaders"] },
)

export async function generateMetadata() {
  const t = await getTranslations("leadership")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: "/ban-lanh-dao" },
  }
}

export default async function LeadershipPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string }>
}) {
  const [params, t, locale] = await Promise.all([
    searchParams,
    getTranslations("leadership"),
    getLocale() as Promise<Locale>,
  ])

  const allLeaders = await getAllActiveLeaders()

  const terms = [...new Set(allLeaders.map((l) => l.term))]
  const selectedTerm = params.term ?? terms[0] ?? null

  const l = <T extends Record<string, unknown>>(record: T, field: string) =>
    localize(record, field, locale) as string | null

  const leaders: LeaderCardData[] = (selectedTerm
    ? allLeaders.filter((leader) => leader.term === selectedTerm)
    : []
  ).map((leader) => ({
    id: leader.id,
    name: l(leader, "name") ?? leader.name,
    honorific: l(leader, "honorific"),
    title: l(leader, "title") ?? leader.title,
    workTitle: l(leader, "workTitle"),
    bio: l(leader, "bio"),
    photoUrl: leader.photoUrl,
    term: leader.term,
    category: leader.category as "BTV" | "BCH" | "BKT" | "HDTD",
  }))

  const sections: LeaderSection[] = [
    { category: "BTV", label: t("btvLabel"), description: t("btvDesc"), members: leaders.filter((x) => x.category === "BTV") },
    { category: "BKT", label: t("bktLabel"), description: t("bktDesc"), members: leaders.filter((x) => x.category === "BKT") },
    { category: "HDTD", label: t("hdtdLabel"), description: t("hdtdDesc"), members: leaders.filter((x) => x.category === "HDTD") },
    { category: "BCH", label: t("bchLabel"), description: t("bchDesc"), members: leaders.filter((x) => x.category === "BCH") },
  ]

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div>
          {/* Term selector */}
          {terms.length > 1 && (
            <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
              {terms.map((term) => (
                <Link
                  key={term}
                  href={`/ban-lanh-dao?term=${encodeURIComponent(term)}`}
                  className={cn(
                    "rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors",
                    term === selectedTerm
                      ? "border-brand-500 bg-brand-700 text-white"
                      : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50",
                  )}
                >
                  {term}
                </Link>
              ))}
            </div>
          )}

          {selectedTerm && (
            <p className="text-center text-sm text-brand-500 mb-10">
              {selectedTerm} — {t("memberCount", { count: leaders.length })}
            </p>
          )}

          <LeaderSectionGrid sections={sections} />

          {/* Back link */}
          <div className="mt-10 text-center">
            <Link
              href="/gioi-thieu-v2"
              className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-900 transition-colors"
            >
              {t("backToAbout")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
