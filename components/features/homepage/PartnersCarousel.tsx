import Image from "next/image"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

/**
 * Đối tác & Cơ quan liên kết — marquee chạy ngang (CSS-only, hover pause).
 * Cùng pattern với CertifiedProductsCarousel.
 *
 * Source: Partner model, sort theo (sortOrder ASC, createdAt DESC).
 * Cache 5 phút, tag "homepage" + "partners".
 */

const CATEGORY_LABEL: Record<string, string> = {
  GOVERNMENT: "Cơ quan nhà nước",
  ASSOCIATION: "Hiệp hội",
  RESEARCH: "Viện / trường",
  ENTERPRISE: "Doanh nghiệp",
  INTERNATIONAL: "Tổ chức quốc tế",
  MEDIA: "Cơ quan báo chí",
  OTHER: "Đối tác",
}

/** Sinh màu nền ổn định từ tên — placeholder khi không có logoUrl */
function colorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  const palette = [
    "bg-emerald-600",
    "bg-amber-600",
    "bg-sky-600",
    "bg-rose-600",
    "bg-violet-600",
    "bg-teal-600",
    "bg-orange-600",
    "bg-indigo-600",
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
        category: true,
        logoUrl: true,
        websiteUrl: true,
        description: true,
      },
    }),
  ["homepage_active_partners"],
  { revalidate: 300, tags: ["homepage", "partners"] },
)

export async function PartnersCarousel() {
  const partners = await getActivePartners()

  if (partners.length === 0) {
    return (
      <section className="bg-brand-50 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">
              Đối tác &amp; Cơ quan liên kết
            </h2>
            <p className="text-sm text-brand-500 mt-1">
              Các cơ quan, hiệp hội, đơn vị nghiên cứu đang đồng hành cùng Hội Trầm Hương Việt Nam
            </p>
          </header>
          <div className="rounded-xl border-2 border-dashed border-brand-300 bg-white p-12 text-center text-brand-500 italic">
            Chưa có đối tác nào được công bố.
          </div>
        </div>
      </section>
    )
  }

  // Duplicate cho infinite loop liên tục
  const items = [...partners, ...partners]

  return (
    <section className="bg-brand-50 py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-900 sm:text-2xl">
              Đối tác &amp; Cơ quan liên kết
            </h2>
            <p className="text-sm text-brand-500 mt-0.5">
              Các cơ quan, hiệp hội, đơn vị nghiên cứu đang đồng hành cùng Hội Trầm Hương Việt Nam
            </p>
          </div>
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
          <div className="flex gap-4 w-max animate-[homepage-partners-marquee_70s_linear_infinite] group-hover:paused">
            {items.map((p, idx) => {
              const initials = getInitials(p.name, p.shortName)
              const cardInner = (
                <div className="flex flex-col items-center gap-3 w-44 h-44 shrink-0 rounded-xl border border-brand-200 bg-white p-4 transition-shadow hover:shadow-md">
                  <div
                    className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center"
                    title={p.description ?? p.name}
                  >
                    {p.logoUrl ? (
                      <Image
                        src={p.logoUrl}
                        alt={p.name}
                        fill
                        className="object-contain p-1"
                        sizes="80px"
                      />
                    ) : (
                      <span
                        className={`flex items-center justify-center w-full h-full text-white text-base font-bold ${colorFromName(p.name)}`}
                      >
                        {initials}
                      </span>
                    )}
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="text-xs font-semibold text-brand-900 line-clamp-2 leading-tight">
                      {p.name}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-brand-500">
                      {CATEGORY_LABEL[p.category] ?? CATEGORY_LABEL.OTHER}
                    </p>
                  </div>
                </div>
              )

              return p.websiteUrl ? (
                <a
                  key={`${p.id}-${idx}`}
                  href={p.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {cardInner}
                </a>
              ) : (
                <div key={`${p.id}-${idx}`}>{cardInner}</div>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes homepage-partners-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
