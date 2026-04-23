import Image from "next/image"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
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

function getInitials(name: string, short: string | null): string {
  if (short && short.length <= 5) return short.toUpperCase()
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join("")
    .toUpperCase()
}

const getActivePartners = unstable_cache(
  async () =>
    prisma.partner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        shortName: true,
        logoUrl: true,
        websiteUrl: true,
      },
    }),
  ["homepage_active_partners"],
  { revalidate: 300, tags: ["homepage", "partners"] },
)

export async function Partners() {
  const [partners, t] = await Promise.all([
    getActivePartners(),
    getTranslations("homepage"),
  ])

  if (partners.length === 0) return null

  const items = [...partners, ...partners]

  return (
    <Section title={t("partnersTitle")}>
      <div
        className="group relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 3%, black 97%, transparent)",
        }}
      >
        <div className="flex w-max animate-[homepage-partners-marquee_70s_linear_infinite] gap-4 group-hover:paused">
          {items.map((p, idx) => {
            const initials = getInitials(p.name, p.shortName)
            const cardInner = (
              <div className="relative h-36 w-36 shrink-0 overflow-hidden border border-neutral-200 bg-white">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  {p.logoUrl ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={p.logoUrl}
                        alt={p.name}
                        fill
                        className="object-contain"
                        sizes="144px"
                      />
                    </div>
                  ) : (
                    <span
                      className={`flex h-16 w-16 items-center justify-center text-base font-bold text-white ${colorFromName(p.name)}`}
                    >
                      {initials}
                    </span>
                  )}
                </div>
              </div>
            )
            return p.websiteUrl ? (
              <a
                key={`${p.id}-${idx}`}
                href={p.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={p.name}
                aria-label={p.name}
                className="block"
              >
                {cardInner}
              </a>
            ) : (
              <div
                key={`${p.id}-${idx}`}
                title={p.name}
                aria-label={p.name}
              >
                {cardInner}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes homepage-partners-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </Section>
  )
}
