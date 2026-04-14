import Image from "next/image"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

/**
 * Đối tác & Cơ quan liên kết — marquee chạy ngang (CSS-only, hover pause).
 *
 * Hiển thị: chỉ logo trên card có background pattern network vàng.
 * Hover: overlay tối mờ che logo, hiện tên + mô tả (nếu có).
 *
 * Background ảnh: `public/partners-card-bg.webp` (400×400 WebP, user tự save —
 * mình không write được binary). Fallback JPG `partners-card-bg.jpg` nếu trình duyệt
 * cổ không hỗ trợ WebP. Nếu cả 2 file đều thiếu → gradient kem (vẫn nổi hơn trắng phẳng).
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
        category: true,
        logoUrl: true,
        websiteUrl: true,
        description: true,
      },
    }),
  ["homepage_active_partners"],
  { revalidate: 300, tags: ["homepage", "partners"] },
)

// Background style — ưu tiên WebP (~15-30KB), fallback JPG, cuối cùng gradient kem.
// `image-set()` để browser tự chọn format tốt nhất; browser cổ sẽ bỏ qua image-set và dùng gradient.
const CARD_BG_STYLE: React.CSSProperties = {
  backgroundImage: [
    "image-set(url('/partners-card-bg.webp') type('image/webp'), url('/partners-card-bg.jpg') type('image/jpeg'))",
    "linear-gradient(135deg, #f8efdf 0%, #f2e4c9 100%)",
  ].join(", "),
  backgroundSize: "cover, cover",
  backgroundPosition: "center, center",
  backgroundRepeat: "no-repeat, no-repeat",
}

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
              const categoryLabel = CATEGORY_LABEL[p.category] ?? CATEGORY_LABEL.OTHER

              const cardInner = (
                <div
                  className="group/card relative w-44 h-44 shrink-0 rounded-xl border border-amber-200/60 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                  style={CARD_BG_STYLE}
                >
                  {/* Logo center */}
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    {p.logoUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={p.logoUrl}
                          alt={p.name}
                          fill
                          className="object-contain drop-shadow-sm"
                          sizes="144px"
                        />
                      </div>
                    ) : (
                      <span
                        className={`flex items-center justify-center w-20 h-20 rounded-full text-white text-lg font-bold shadow-md ${colorFromName(p.name)}`}
                      >
                        {initials}
                      </span>
                    )}
                  </div>

                  {/* Hover overlay — tên + mô tả */}
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-3 bg-linear-to-t from-black/85 via-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200"
                    aria-hidden
                  >
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-300 mb-1">
                      {categoryLabel}
                    </p>
                    <p className="text-xs font-bold text-white leading-tight line-clamp-2">
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="mt-1 text-[11px] text-white/85 leading-snug line-clamp-3">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>
              )

              const commonTitle = p.description
                ? `${p.name} — ${p.description}`
                : p.name

              return p.websiteUrl ? (
                <a
                  key={`${p.id}-${idx}`}
                  href={p.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={commonTitle}
                  aria-label={commonTitle}
                  className="block"
                >
                  {cardInner}
                </a>
              ) : (
                <div
                  key={`${p.id}-${idx}`}
                  title={commonTitle}
                  aria-label={commonTitle}
                >
                  {cardInner}
                </div>
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
