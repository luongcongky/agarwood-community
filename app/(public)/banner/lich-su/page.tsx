import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { BannerRowActions } from "./BannerRowActions"

export const metadata = {
  title: "Banner của tôi | Hội Trầm Hương Việt Nam",
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Chờ chuyển khoản", color: "bg-amber-100 text-amber-800 border-amber-300" },
  PENDING_APPROVAL: { label: "Chờ admin duyệt", color: "bg-blue-100 text-blue-800 border-blue-300" },
  ACTIVE: { label: "Đang hiển thị", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  REJECTED: { label: "Bị từ chối", color: "bg-red-100 text-red-800 border-red-300" },
  EXPIRED: { label: "Đã hết hạn", color: "bg-brand-100 text-brand-600 border-brand-300" },
}

export default async function BannerHistoryPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?callbackUrl=/banner/lich-su")
  }

  const banners = await prisma.banner.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      targetUrl: true,
      startDate: true,
      endDate: true,
      status: true,
      price: true,
      rejectReason: true,
      createdAt: true,
    },
  })

  // Tinh "sap het han" — ACTIVE va con < 7 ngay
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86_400_000)

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="bg-brand-800 py-14 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">Banner của tôi</h1>
        <p className="mt-2 text-brand-300 text-base">Lịch sử đăng ký banner quảng cáo</p>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-brand-600">
            Tổng <strong className="text-brand-900">{banners.length}</strong> banner
          </p>
          <Link
            href="/banner/dang-ky"
            className="inline-flex items-center rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            + Đăng ký banner mới
          </Link>
        </div>

        {banners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-200 p-16 text-center">
            <div className="text-5xl mb-3">📢</div>
            <p className="text-brand-700 font-medium">Bạn chưa đăng ký banner nào</p>
            <p className="text-brand-500 text-sm mt-1">
              Đăng ký banner để quảng bá thương hiệu trên trang chủ
            </p>
            <Link
              href="/banner/dang-ky"
              className="mt-5 inline-flex items-center rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Đăng ký banner đầu tiên →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => {
              const status = STATUS_LABELS[banner.status]
              const isExpiringSoon = banner.status === "ACTIVE" && banner.endDate < sevenDaysFromNow
              const canRenew = banner.status === "ACTIVE" || banner.status === "EXPIRED"

              return (
                <div
                  key={banner.id}
                  className="bg-white rounded-xl border border-brand-200 shadow-sm overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                    {/* Image */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-brand-100">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>

                    {/* Info */}
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-brand-900 line-clamp-2">{banner.title}</h3>
                        <span
                          className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="text-xs text-brand-500 space-y-0.5">
                        <p>
                          <strong className="text-brand-700">Link:</strong>{" "}
                          <a href={banner.targetUrl} target="_blank" rel="noopener noreferrer" className="underline">
                            {banner.targetUrl}
                          </a>
                        </p>
                        <p>
                          <strong className="text-brand-700">Thời gian:</strong>{" "}
                          {new Date(banner.startDate).toLocaleDateString("vi-VN")} —{" "}
                          {new Date(banner.endDate).toLocaleDateString("vi-VN")}
                        </p>
                        <p>
                          <strong className="text-brand-700">Tiền:</strong>{" "}
                          {banner.price.toLocaleString("vi-VN")}đ
                        </p>
                      </div>

                      {banner.status === "REJECTED" && banner.rejectReason && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 mt-1">
                          <strong>Lý do từ chối:</strong> {banner.rejectReason}
                        </div>
                      )}

                      {isExpiringSoon && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800 mt-1">
                          ⚠ Sắp hết hạn — gia hạn để tiếp tục hiển thị
                        </div>
                      )}

                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="text-xs text-brand-400">
                          Tạo: {new Date(banner.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        {canRenew && <BannerRowActions bannerId={banner.id} />}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
