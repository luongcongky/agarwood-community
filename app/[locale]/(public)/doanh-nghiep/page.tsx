import Image from "next/image"
import Link from "next/link"
import { unstable_cache } from "next/cache"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { prisma } from "@/lib/prisma"
import { BLUR_DATA_URL } from "@/lib/seo/blur-placeholder"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
export async function generateMetadata() {
  const t = await getTranslations("companies")
  return { title: t("metaTitle"), alternates: { canonical: "/doanh-nghiep" } }
}

export const revalidate = 3600

/** Strip "https://" + trailing slash để hiển thị gọn */
function displayWebsite(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

/** Strip HTML tags + decode entities cơ bản + truncate. Description lưu dạng
 *  HTML rich-text; ở card chỉ cần 2 dòng plain preview. Truncate server-side
 *  tránh ship full HTML (có thể vài KB/card × 30+ card = trăm KB) xuống DOM. */
const DESC_PREVIEW_MAX = 180
function stripHtmlPreview(html: string): string {
  const plain = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
  if (plain.length <= DESC_PREVIEW_MAX) return plain
  return plain.slice(0, DESC_PREVIEW_MAX).replace(/\s+\S*$/, "") + "…"
}

const COMPANY_CARD_SELECT = {
  id: true,
  name: true, name_en: true, name_zh: true, name_ar: true,
  slug: true,
  logoUrl: true,
  description: true, description_en: true, description_zh: true, description_ar: true,
  address: true, address_en: true, address_zh: true, address_ar: true,
  phone: true,
  website: true,
  isVerified: true,
} as const

/** Default list (no search) cached 5 min — hit DB 1 lần/5ph thay vì mỗi
 *  request. revalidateTag("companies") khi admin CRUD company. */
const getDefaultCompanies = unstable_cache(
  () =>
    prisma.company.findMany({
      where: { isPublished: true },
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      select: COMPANY_CARD_SELECT,
    }),
  ["doanh-nghiep_list_default"],
  { revalidate: 300, tags: ["companies"] },
)

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ province?: string; q?: string }>
}) {
  const [locale, t] = await Promise.all([
    getLocale() as Promise<Locale>,
    getTranslations("companies"),
  ])
  const l = <T extends Record<string, unknown>>(record: T, field: string) => localize(record, field, locale) as string
  const params = await searchParams
  const q = params.q ?? ""

  // Default list đi qua cache 5 phút; search path bypass cache (keyword động).
  const companies = q
    ? await prisma.company.findMany({
        where: {
          isPublished: true,
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        },
        orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
        select: COMPANY_CARD_SELECT,
      })
    : await getDefaultCompanies()

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search */}
        <form method="GET" action="/doanh-nghiep" className="mb-8 flex gap-2 max-w-lg mx-auto">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={t("searchPlaceholder")}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-700 text-brand-100 px-5 py-2.5 text-sm font-medium hover:bg-brand-800 transition-colors"
          >
            {t("searchBtn")}
          </button>
        </form>

        {/* Members Grid */}
        {companies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground font-medium">
              {t("emptyTitle")}
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {q
                ? t("emptySearch", { query: q })
                : t("emptyDefault")}
            </p>
            {q && (
              <Link
                href="/doanh-nghiep"
                className="mt-4 inline-block text-brand-700 underline text-sm"
              >
                {t("viewAll")}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                {/* Logo + Name Row */}
                <div className="flex items-center gap-3">
                  {company.logoUrl ? (
                    <div className="relative w-16 h-16 shrink-0">
                      <Image
                        src={company.logoUrl}
                        alt={l(company, "name")}
                        fill
                        sizes="64px"
                        className="rounded-full object-cover"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    </div>
                  ) : (
                    <AgarwoodPlaceholder
                      className="w-16 h-16"
                      shape="full"
                      size="sm"
                    />
                  )}
                  <div className="min-w-0">
                    <h2 className="font-bold text-foreground text-base leading-tight">
                      {l(company, "name")}
                    </h2>
                    {company.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full mt-1">
                        {t("verified")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description — strip HTML + truncate ~180 ký tự trên server;
                    DOM chỉ ship preview ngắn thay vì full rich-text HTML. */}
                {l(company, "description") && (
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {stripHtmlPreview(l(company, "description"))}
                  </p>
                )}

                {/* Address */}
                {l(company, "address") && (
                  <p className="text-muted-foreground text-xs truncate flex items-center gap-1">
                    📍 {l(company, "address")}
                  </p>
                )}

                {/* Phone */}
                {company.phone && (
                  <p className="text-muted-foreground text-xs flex items-center gap-1">
                    📞 {company.phone}
                  </p>
                )}

                {/* Website */}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1 truncate"
                  >
                    🌐 {displayWebsite(company.website)}
                  </a>
                )}

                {/* CTA */}
                <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                  <Link
                    href={`/doanh-nghiep/${company.slug}`}
                    className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
                  >
                    {t("viewDetails")}
                  </Link>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-brand-300 bg-white px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                    >
                      {t("visitWebsite")}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
