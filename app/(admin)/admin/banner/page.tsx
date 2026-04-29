import { prisma } from "@/lib/prisma"
import Image from "next/image"
import type { BannerSlot, BannerStatus } from "@prisma/client"
import { cloudinaryFit } from "@/lib/cloudinary"
import { BANNER_SLOT_META, getSlotShapeConfig } from "@/lib/banner-slots"
import { AdminBannerActions } from "./AdminBannerActions"
import { BannerSlotsEditor } from "./BannerSlotsEditor"
import { BannerWorkbench } from "./BannerWorkbench"

export const metadata = {
  title: "Quản lý Banner | Admin",
}

const STATUS_LABELS: Record<BannerStatus, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Chờ CK", color: "bg-amber-100 text-amber-800" },
  PENDING_APPROVAL: { label: "Chờ duyệt", color: "bg-blue-100 text-blue-800" },
  ACTIVE: { label: "ACTIVE", color: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-800" },
  EXPIRED: { label: "Hết hạn", color: "bg-brand-100 text-brand-600" },
}

const STATUS_KEYS: BannerStatus[] = [
  "PENDING_PAYMENT",
  "PENDING_APPROVAL",
  "ACTIVE",
  "REJECTED",
  "EXPIRED",
]

function isValidStatus(s: string | undefined): s is BannerStatus {
  return !!s && STATUS_KEYS.includes(s as BannerStatus)
}

function isValidSlot(s: string | undefined): s is BannerSlot {
  return !!s && s in BANNER_SLOT_META
}

export default async function AdminBannerPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; slot?: string }>
}) {
  const sp = await searchParams
  // Default ACTIVE — KH yêu cầu badge luôn phải có 1 cái được chọn.
  const filterStatus: BannerStatus = isValidStatus(sp.status) ? sp.status : "ACTIVE"
  const filterSlot = isValidSlot(sp.slot) ? sp.slot : null

  const where = {
    status: filterStatus,
    ...(filterSlot ? { positions: { has: filterSlot } } : {}),
  }

  const [banners, counts] = await Promise.all([
    prisma.banner.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        targetUrl: true,
        startDate: true,
        endDate: true,
        status: true,
        positions: true,
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

  // Build badge URLs giữ nguyên `?slot=` khi chuyển status.
  function statusUrl(status: BannerStatus) {
    const params = new URLSearchParams()
    params.set("status", status)
    if (filterSlot) params.set("slot", filterSlot)
    return `/admin/banner?${params.toString()}`
  }

  // Render banner cards once, pass to Workbench. Aspect preview dùng shape
  // của từng banner (vì list có thể chứa banner cross-shape khi chưa chọn slot).
  const bannerCards =
    banners.length === 0 ? (
      <div className="rounded-xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
        Không có banner nào ở trạng thái {STATUS_LABELS[filterStatus].label}.
      </div>
    ) : (
      <div className="space-y-3">
        {banners.map((banner) => {
          const status = STATUS_LABELS[banner.status]
          // Multi-slot: dùng slot ĐẦU TIÊN làm preview shape (mọi slot trong
          // banner.positions phải cùng shape do form constraint, nên slot[0] đủ).
          const primarySlot = banner.positions[0] ?? "HOMEPAGE_TOP_LEFT"
          const shapeConfig = getSlotShapeConfig(primarySlot)
          const previewAr = shapeConfig.aspectRatio
          const previewArStr =
            previewAr === 5
              ? "5:1"
              : previewAr < 1
                ? "2:3"
                : "485:90"
          return (
            <div
              key={banner.id}
              className="bg-white rounded-xl border border-brand-200 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                <div className="space-y-2">
                  <div
                    className={`relative w-full overflow-hidden rounded-lg bg-brand-100 ${
                      previewAr < 1 ? "max-w-[120px] mx-auto" : ""
                    }`}
                    style={{ aspectRatio: previewAr }}
                  >
                    <Image
                      src={cloudinaryFit(banner.imageUrl, { ar: previewArStr, w: 800 })}
                      alt={banner.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-brand-900 line-clamp-2">{banner.title}</h3>
                    <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Multi-slot pills + inline editor — admin click "Sửa vị trí"
                      để áp dụng banner cho slot khác cùng shape (hoặc gỡ slot). */}
                  <div className="flex flex-wrap gap-1">
                    {banner.positions.map((slot) => (
                      <span
                        key={slot}
                        className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-brand-100 text-brand-700"
                        title={BANNER_SLOT_META[slot].description}
                      >
                        {BANNER_SLOT_META[slot].label}
                      </span>
                    ))}
                  </div>
                  <BannerSlotsEditor
                    bannerId={banner.id}
                    currentPositions={banner.positions}
                  />

                  <div className="text-xs text-brand-600 space-y-0.5">
                    <p>
                      <strong>User:</strong> {banner.user.name} ({banner.user.email}){" "}
                      <span className="text-brand-400">[{banner.user.role}]</span>
                    </p>
                    {banner.targetUrl && (
                      <p>
                        <strong>Link:</strong>{" "}
                        <a
                          href={banner.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline break-all"
                        >
                          {banner.targetUrl}
                        </a>
                      </p>
                    )}
                    <p>
                      <strong>Thời gian:</strong>{" "}
                      {new Date(banner.startDate).toLocaleDateString("vi-VN")} —{" "}
                      {new Date(banner.endDate).toLocaleDateString("vi-VN")}
                    </p>
                    {banner.price > 0 && (
                      <p>
                        <strong>Tiền:</strong> {banner.price.toLocaleString("vi-VN")}đ
                      </p>
                    )}
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
        })}
      </div>
    )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-brand-900">Quản lý Banner Quảng cáo</h1>
        <p className="mt-1 text-sm text-brand-500">
          Click 1 vùng trên mockup bên trái → xem banner đang chạy ở vùng đó (lọc theo
          status badge) + tạo banner mới cho vùng đó.
        </p>
      </header>

      {/* 5 status badges — clickable, preserve ?slot= khi đổi */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_KEYS.map((key) => {
          const meta = STATUS_LABELS[key]
          const active = filterStatus === key
          return (
            <a
              key={key}
              href={statusUrl(key)}
              className={`rounded-xl border p-3 text-center transition-colors ${
                active
                  ? "border-brand-500 bg-brand-50"
                  : "border-brand-200 bg-white hover:border-brand-300"
              }`}
            >
              <p className="text-2xl font-bold text-brand-900">{countMap[key] ?? 0}</p>
              <p className="text-xs text-brand-500 mt-0.5">{meta.label}</p>
            </a>
          )
        })}
      </div>

      {/* Workbench: mockup trái + list/form phải */}
      <BannerWorkbench
        currentSlot={filterSlot}
        bannerCards={bannerCards}
        bannerCount={banners.length}
        currentStatusLabel={STATUS_LABELS[filterStatus].label}
      />
    </div>
  )
}
