import { prisma } from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { cloudinaryFit } from "@/lib/cloudinary"
import { AdminBannerActions } from "./AdminBannerActions"

export const metadata = {
  title: "Quản lý Banner | Admin",
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Chờ CK", color: "bg-amber-100 text-amber-800" },
  PENDING_APPROVAL: { label: "Chờ duyệt", color: "bg-blue-100 text-blue-800" },
  ACTIVE: { label: "ACTIVE", color: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-800" },
  EXPIRED: { label: "Hết hạn", color: "bg-brand-100 text-brand-600" },
}

export default async function AdminBannerPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const sp = await searchParams
  const filterStatus = sp.status

  const where = filterStatus
    ? { status: filterStatus as "PENDING_PAYMENT" | "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "EXPIRED" }
    : undefined

  const [banners, counts] = await Promise.all([
    prisma.banner.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        targetUrl: true,
        startDate: true,
        endDate: true,
        status: true,
        position: true,
        price: true,
        rejectReason: true,
        createdAt: true,
        user: { select: { name: true, email: true, role: true } },
      },
    }),
    prisma.banner.groupBy({
      by: ["status"],
      _count: true,
    }),
  ])

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]))

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Quản lý Banner Quảng cáo</h1>
          <p className="mt-1 text-sm text-brand-500">
            Duyệt nội dung banner sau khi xác nhận chuyển khoản tại{" "}
            <a href="/admin/thanh-toan" className="underline text-brand-700">
              /admin/thanh-toan
            </a>
          </p>
        </div>
        <Link
          href="/admin/banner/tao-moi"
          className="shrink-0 rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          + Tạo banner
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {([
          { key: "PENDING_PAYMENT", label: "Chờ CK" },
          { key: "PENDING_APPROVAL", label: "Chờ duyệt" },
          { key: "ACTIVE", label: "ACTIVE" },
          { key: "REJECTED", label: "Từ chối" },
          { key: "EXPIRED", label: "Hết hạn" },
        ] as const).map((s) => (
          <a
            key={s.key}
            href={`/admin/banner?status=${s.key}`}
            className={`rounded-xl border p-3 text-center ${
              filterStatus === s.key
                ? "border-brand-500 bg-brand-50"
                : "border-brand-200 bg-white hover:border-brand-300"
            }`}
          >
            <p className="text-2xl font-bold text-brand-900">{countMap[s.key] ?? 0}</p>
            <p className="text-xs text-brand-500 mt-0.5">{s.label}</p>
          </a>
        ))}
      </div>

      {filterStatus && (
        <a href="/admin/banner" className="text-xs text-brand-700 underline">
          ← Xem tất cả
        </a>
      )}

      {/* List */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <div className="rounded-xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
            Không có banner nào{filterStatus ? ` ở trạng thái ${STATUS_LABELS[filterStatus]?.label}` : ""}
          </div>
        ) : (
          banners.map((banner) => {
            const status = STATUS_LABELS[banner.status]
            return (
              <div
                key={banner.id}
                className="bg-white rounded-xl border border-brand-200 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                  <div className="space-y-2">
                    {/* Preview ở tỉ lệ 5:1 — đúng cảm giác desktop trên trang chủ */}
                    <div
                      className="relative w-full overflow-hidden rounded-lg bg-brand-100"
                      style={{ aspectRatio: "5 / 1" }}
                    >
                      <Image
                        src={cloudinaryFit(banner.imageUrl, { ar: "5:1", w: 800 })}
                        alt={banner.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <p className="text-[10px] text-brand-400 text-center">
                      Preview tỉ lệ 5:1 (desktop) — Cloudinary auto-crop
                    </p>
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-brand-900 line-clamp-2">{banner.title}</h3>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-brand-100 text-brand-700">
                          {banner.position === "TOP" ? "Đầu trang" : banner.position === "MID" ? "Giữa trang" : "Rail dọc (feed)"}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-brand-600 space-y-0.5">
                      <p>
                        <strong>User:</strong> {banner.user.name} ({banner.user.email}){" "}
                        <span className="text-brand-400">[{banner.user.role}]</span>
                      </p>
                      <p>
                        <strong>Link:</strong>{" "}
                        <a href={banner.targetUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">
                          {banner.targetUrl}
                        </a>
                      </p>
                      <p>
                        <strong>Thời gian:</strong>{" "}
                        {new Date(banner.startDate).toLocaleDateString("vi-VN")} —{" "}
                        {new Date(banner.endDate).toLocaleDateString("vi-VN")}
                      </p>
                      <p>
                        <strong>Tiền:</strong> {banner.price.toLocaleString("vi-VN")}đ
                      </p>
                      <p className="text-brand-400">
                        Tạo lúc: {new Date(banner.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    {banner.status === "REJECTED" && banner.rejectReason && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700">
                        <strong>Lý do từ chối:</strong> {banner.rejectReason}
                      </div>
                    )}

                    <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap">
                      <AdminBannerActions
                        bannerId={banner.id}
                        status={banner.status}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
