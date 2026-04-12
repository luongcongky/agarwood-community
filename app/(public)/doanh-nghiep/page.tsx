import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { AgarwoodPlaceholder } from "@/components/ui/AgarwoodPlaceholder"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Doanh nghiệp",
  description: "Danh sách doanh nghiệp thành viên Hội Trầm Hương Việt Nam — các doanh nghiệp trầm hương uy tín trên toàn quốc.",
  alternates: { canonical: "/doanh-nghiep" },
}

export const revalidate = 3600

/** Strip "https://" + trailing slash để hiển thị gọn */
function displayWebsite(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ province?: string; q?: string }>
}) {
  const params = await searchParams
  const q = params.q ?? ""

  const companies = await prisma.company.findMany({
    where: {
      isPublished: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }),
    },
    orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      description: true,
      address: true,
      phone: true,
      website: true,
      isVerified: true,
      owner: {
        select: { contributionTotal: true },
      },
    },
  })

  return (
    <div>
      {/* Page Banner */}
      <section className="bg-brand-800 py-16 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">Doanh nghiệp</h1>
        <p className="mt-2 text-brand-300 text-lg">
          Danh sách doanh nghiệp thành viên Hội Trầm Hương Việt Nam
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search */}
        <form method="GET" action="/doanh-nghiep" className="mb-8 flex gap-2 max-w-lg mx-auto">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Tìm kiếm doanh nghiệp..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-700 text-brand-100 px-5 py-2.5 text-sm font-medium hover:bg-brand-800 transition-colors"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Members Grid */}
        {companies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground font-medium">
              Không tìm thấy doanh nghiệp nào
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {q
                ? `Không có kết quả cho "${q}". Thử từ khóa khác nhé.`
                : "Chưa có doanh nghiệp nào được đăng."}
            </p>
            {q && (
              <Link
                href="/doanh-nghiep"
                className="mt-4 inline-block text-brand-700 underline text-sm"
              >
                Xem tất cả doanh nghiệp
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
                        alt={company.name}
                        fill
                        className="rounded-full object-cover"
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
                      {company.name}
                    </h2>
                    {company.isVerified && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full mt-1">
                        ✓ Đã xác minh
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {company.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {company.description}
                  </p>
                )}

                {/* Address */}
                {company.address && (
                  <p className="text-muted-foreground text-xs truncate flex items-center gap-1">
                    📍 {company.address}
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
                    Xem chi tiết →
                  </Link>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-brand-300 bg-white px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                    >
                      ↗ Ghé website
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
