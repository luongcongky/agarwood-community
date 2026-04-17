import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { getTranslations } from "next-intl/server"

export const revalidate = 600

export async function generateMetadata() {
  const t = await getTranslations("leadership")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: { canonical: "/ban-lanh-dao" },
  }
}

type LeaderCategory = "BTV" | "BCH" | "BKT"

function InitialsAvatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase()
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-brand-700 text-white font-bold",
        className,
      )}
    >
      {initials}
    </div>
  )
}

export default async function LeadershipPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string }>
}) {
  const params = await searchParams
  const t = await getTranslations("leadership")

  const sectionConfig: {
    category: LeaderCategory
    label: string
    description: string
  }[] = [
    { category: "BTV", label: t("btvLabel"), description: t("btvDesc") },
    { category: "BKT", label: t("bktLabel"), description: t("bktDesc") },
    { category: "BCH", label: t("bchLabel"), description: t("bchDesc") },
  ]

  const allLeaders = await prisma.leader.findMany({
    where: { isActive: true },
    orderBy: [{ term: "desc" }, { category: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      title: true,
      category: true,
      workTitle: true,
      bio: true,
      photoUrl: true,
      term: true,
    },
  })

  // Distinct terms, most recent first
  const terms = [...new Set(allLeaders.map((l) => l.term))]
  const selectedTerm = params.term ?? terms[0] ?? null

  const leaders = selectedTerm
    ? allLeaders.filter((l) => l.term === selectedTerm)
    : []

  return (
    <div className="min-h-screen bg-brand-50/60">
      {/* Banner */}
      <section className="bg-brand-800 py-16 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-brand-300 text-lg">
          {t("subtitle")}
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-4 sm:p-6 lg:p-8">
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

        {/* Sections: BTV → BKT → BCH */}
        {sectionConfig.map(({ category, label, description }) => {
          const members = leaders.filter((l) => l.category === category)
          if (members.length === 0) return null

          return (
            <section key={category} className="mb-14">
              <header className="mb-6 text-center">
                <h2 className="text-xl font-bold text-brand-900 sm:text-2xl">
                  {label}
                </h2>
                <p className="mt-1 text-sm text-brand-500">{description}</p>
              </header>

              <div
                className={cn(
                  "grid gap-6 max-w-5xl mx-auto",
                  category === "BTV"
                    ? "sm:grid-cols-2 lg:grid-cols-3"
                    : category === "BKT"
                      ? "sm:grid-cols-2 max-w-2xl"
                      : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                )}
              >
                {members.map((leader) => (
                  <div
                    key={leader.id}
                    className="flex flex-col items-center rounded-xl border border-brand-200 bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                  >
                    {leader.photoUrl ? (
                      <div className="relative h-20 w-20 rounded-full overflow-hidden mb-4 border-2 border-brand-100">
                        <Image
                          src={leader.photoUrl}
                          alt={leader.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <InitialsAvatar
                        name={leader.name}
                        className="h-20 w-20 text-xl mb-4"
                      />
                    )}
                    <h3 className="font-bold text-brand-900 text-base">
                      {leader.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-amber-700">
                      {leader.title}
                    </p>
                    {leader.workTitle && (
                      <p className="mt-2 text-xs text-brand-500 leading-relaxed">
                        {leader.workTitle}
                      </p>
                    )}
                    {leader.bio && (
                      <p className="mt-2 text-xs text-brand-600 leading-relaxed">
                        {leader.bio}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link
            href="/gioi-thieu"
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
