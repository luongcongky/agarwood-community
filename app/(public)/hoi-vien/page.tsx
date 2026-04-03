import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

export const revalidate = 3600

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ province?: string; q?: string }>
}) {
  const params = await searchParams
  const province = params.province ?? ""
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
        <h1 className="font-heading text-4xl font-bold text-brand-100">Hội viên</h1>
        <p className="mt-2 text-brand-300 text-lg">
          Danh sách doanh nghiệp thành viên Hội Trầm Hương Việt Nam
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search */}
        <form method="GET" action="/hoi-vien" className="mb-8 flex gap-2 max-w-lg mx-auto">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Tìm kiếm hội viên..."
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
              Không tìm thấy hội viên nào
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {q
                ? `Không có kết quả cho "${q}". Thử từ khóa khác nhé.`
                : "Chưa có hội viên nào được đăng."}
            </p>
            {q && (
              <Link
                href="/hoi-vien"
                className="mt-4 inline-block text-brand-700 underline text-sm"
              >
                Xem tất cả hội viên
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
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-brand-700 text-brand-100 flex items-center justify-center text-xl font-bold flex-shrink-0">
                      {getInitials(company.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-heading font-bold text-foreground text-base leading-tight">
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

                {/* CTA */}
                <div className="mt-auto pt-2">
                  <Link
                    href={`/hoi-vien/${company.slug}`}
                    className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
                  >
                    Xem chi tiết →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
