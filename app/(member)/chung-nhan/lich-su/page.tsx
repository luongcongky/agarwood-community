import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const revalidate = 0

const STATUS_MAP: Record<string, { label: string; cls: string; description: string }> = {
  DRAFT:        { label: "Chờ xác nhận CK",    cls: "bg-gray-100 text-gray-700",   description: "Đang chờ admin xác nhận chuyển khoản" },
  PENDING:      { label: "Chờ xét duyệt",      cls: "bg-yellow-100 text-yellow-700", description: "Hồ sơ đã được tiếp nhận, đang chờ xét duyệt" },
  UNDER_REVIEW: { label: "Đang xét duyệt",     cls: "bg-blue-100 text-blue-700",   description: "Admin đang xem xét hồ sơ của bạn" },
  APPROVED:     { label: "Đã cấp chứng nhận",  cls: "bg-green-100 text-green-700", description: "Sản phẩm đã được cấp badge chứng nhận" },
  REJECTED:     { label: "Từ chối",             cls: "bg-red-100 text-red-700",     description: "Hồ sơ không đạt yêu cầu — admin đang xử lý hoàn tiền" },
  REFUNDED:     { label: "Đã hoàn tiền",        cls: "bg-purple-100 text-purple-700", description: "Phí chứng nhận đã được hoàn lại" },
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default async function CertHistoryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const certifications = await prisma.certification.findMany({
    where: { applicantId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      isOnlineReview: true,
      reviewNote: true,
      approvedAt: true,
      rejectedAt: true,
      refundedAt: true,
      createdAt: true,
      product: { select: { name: true, slug: true, certStatus: true, badgeUrl: true } },
    },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-brand-900">Lịch sử chứng nhận</h1>
        <Link
          href="/chung-nhan/nop-don"
          className="rounded-lg bg-brand-700 text-white px-4 py-2 text-sm font-semibold hover:bg-brand-800 transition-colors"
        >
          + Nộp đơn mới
        </Link>
      </div>

      {certifications.length === 0 ? (
        <div className="bg-white border border-brand-200 rounded-2xl p-12 text-center space-y-3">
          <p className="text-brand-400">Bạn chưa nộp đơn chứng nhận nào.</p>
          <Link href="/chung-nhan/nop-don" className="text-sm text-brand-600 hover:text-brand-800 underline">
            Nộp đơn chứng nhận sản phẩm
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => {
            const st = STATUS_MAP[cert.status] ?? { label: cert.status, cls: "bg-gray-100 text-gray-600", description: "" }
            return (
              <div key={cert.id} className="bg-white border border-brand-200 rounded-2xl p-5 space-y-3">
                {/* Header: product + status */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <Link href={`/san-pham/${cert.product.slug}`} className="font-semibold text-brand-900 text-sm hover:text-brand-700 transition-colors">
                      {cert.product.name}
                    </Link>
                    <p className="text-xs text-brand-400 mt-0.5">
                      Nộp ngày {formatDate(cert.createdAt)} · {cert.isOnlineReview ? "Online" : "Offline"}
                    </p>
                  </div>
                  <span className={cn("inline-flex text-xs font-medium px-2.5 py-1 rounded-full", st.cls)}>
                    {st.label}
                  </span>
                </div>

                {/* Status description */}
                <p className="text-xs text-brand-500">{st.description}</p>

                {/* Approved: show badge link */}
                {cert.status === "APPROVED" && cert.approvedAt && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 space-y-1">
                    <p className="text-sm text-green-800 font-medium">
                      Chứng nhận cấp ngày {formatDate(cert.approvedAt)}
                    </p>
                    <Link href={`/verify/${cert.product.slug}`} className="text-xs text-green-700 hover:text-green-900 underline">
                      Xem trang xác minh chứng nhận
                    </Link>
                  </div>
                )}

                {/* Rejected: show review note */}
                {cert.status === "REJECTED" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-1">
                    {cert.reviewNote && (
                      <p className="text-sm text-red-700">Lý do: {cert.reviewNote}</p>
                    )}
                    {cert.rejectedAt && (
                      <p className="text-xs text-red-500">Từ chối ngày {formatDate(cert.rejectedAt)}</p>
                    )}
                    <p className="text-xs text-red-500">Admin đang xử lý hoàn tiền 5.000.000đ</p>
                  </div>
                )}

                {/* Refunded */}
                {cert.status === "REFUNDED" && cert.refundedAt && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-purple-700">Đã hoàn tiền ngày {formatDate(cert.refundedAt)}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
