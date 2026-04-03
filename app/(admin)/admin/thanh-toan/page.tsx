import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"
import { PaymentActionRow } from "./PaymentActionRow"

export const revalidate = 0

const TYPE_LABELS: Record<string, string> = {
  MEMBERSHIP_FEE: "Phí hội viên",
  CERTIFICATION_FEE: "Phí chứng nhận",
  MEDIA_SERVICE: "Dịch vụ TT",
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "⏳ Chờ xác nhận", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  SUCCESS: { label: "✓ Đã xác nhận", color: "bg-green-100 text-green-800 border-green-200" },
  FAILED: { label: "✗ Bị từ chối", color: "bg-red-100 text-red-800 border-red-200" },
  REFUNDED: { label: "Đã hoàn tiền", color: "bg-gray-100 text-gray-700 border-gray-200" },
}

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ"
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function AdminPaymentPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") notFound()

  const [pendingPayments, recentProcessed] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        type: true,
        amount: true,
        payosOrderCode: true,
        description: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        membership: { select: { amountPaid: true } },
        certification: { select: { product: { select: { name: true } } } },
      },
    }),
    prisma.payment.findMany({
      where: { status: { in: ["SUCCESS", "FAILED"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        payosOrderCode: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Xác nhận chuyển khoản</h1>
        <p className="text-sm text-brand-500 mt-1">Các yêu cầu chờ xác nhận</p>
      </div>

      {/* Alert count */}
      {pendingPayments.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-5 py-3">
          <span className="text-amber-600 text-lg">💳</span>
          <span className="text-sm font-semibold text-amber-800">
            {pendingPayments.length} yêu cầu chờ xác nhận chuyển khoản
          </span>
        </div>
      )}

      {/* Pending payments section */}
      {pendingPayments.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <p className="text-green-700 font-medium">Không có yêu cầu nào đang chờ xác nhận ✓</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide">
            Đang chờ xác nhận ({pendingPayments.length})
          </h2>
          <div className="space-y-3">
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white border-2 border-amber-200 rounded-2xl p-5 space-y-4"
              >
                {/* User + type + amount */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-brand-900 text-sm">
                      {payment.user.name ?? "—"}
                    </p>
                    <p className="text-xs text-brand-400">{payment.user.email}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="block text-xs font-semibold bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full">
                      {TYPE_LABELS[payment.type] ?? payment.type}
                    </span>
                    <span className="block font-bold text-brand-900">
                      {formatVND(payment.amount)}
                    </span>
                  </div>
                </div>

                {/* Certification product */}
                {payment.type === "CERTIFICATION_FEE" && payment.certification?.product && (
                  <p className="text-xs text-brand-500">
                    Sản phẩm:{" "}
                    <span className="font-semibold text-brand-700">
                      {payment.certification.product.name}
                    </span>
                  </p>
                )}

                {/* Transfer description */}
                {payment.payosOrderCode && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-brand-500 text-xs">Mã CK:</span>
                    <span className="font-mono font-bold text-brand-900 bg-brand-50 px-2 py-0.5 rounded text-xs">
                      {payment.payosOrderCode}
                    </span>
                  </div>
                )}

                {/* Description */}
                {payment.description && (
                  <p className="text-xs text-brand-500">{payment.description}</p>
                )}

                {/* Date + actions */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-brand-100 flex-wrap">
                  <span className="text-xs text-brand-400">
                    Gửi lúc: {formatDate(payment.createdAt)}
                  </span>
                  <PaymentActionRow id={payment.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently processed */}
      {recentProcessed.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide">
            Đã xử lý gần đây
          </h2>
          <div className="bg-white border border-brand-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-xs text-brand-500 font-medium">
                  <th className="text-left px-4 py-3">Người dùng</th>
                  <th className="text-left px-4 py-3">Loại</th>
                  <th className="text-left px-4 py-3">Số tiền</th>
                  <th className="text-left px-4 py-3">Trạng thái</th>
                  <th className="text-left px-4 py-3">Ngày gửi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {recentProcessed.map((payment) => {
                  const statusInfo = STATUS_MAP[payment.status] ?? {
                    label: payment.status,
                    color: "bg-gray-100 text-gray-700 border-gray-200",
                  }
                  return (
                    <tr key={payment.id} className="text-brand-800 hover:bg-brand-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand-900 text-xs">{payment.user.name ?? "—"}</p>
                        <p className="text-brand-400 text-xs">{payment.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {TYPE_LABELS[payment.type] ?? payment.type}
                      </td>
                      <td className="px-4 py-3 font-semibold text-xs">
                        {formatVND(payment.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs font-medium border px-2 py-0.5 rounded-full",
                            statusInfo.color
                          )}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-400">
                        {formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
