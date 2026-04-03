import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
  })
}

export default async function PaymentHistoryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      payosOrderCode: true,
      description: true,
      createdAt: true,
      membership: { select: { validFrom: true, validTo: true, status: true } },
      certification: { select: { status: true, product: { select: { name: true } } } },
    },
  })

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/gia-han"
          className="text-sm text-brand-600 hover:text-brand-800 transition-colors"
        >
          ← Về trang gia hạn
        </Link>
      </div>

      <h1 className="text-2xl font-heading font-bold text-brand-900">
        Lịch sử thanh toán
      </h1>

      {payments.length === 0 ? (
        <div className="bg-white border border-brand-200 rounded-2xl p-12 text-center">
          <p className="text-brand-400 text-sm">Chưa có giao dịch nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const statusInfo = STATUS_MAP[payment.status] ?? {
              label: payment.status,
              color: "bg-gray-100 text-gray-700 border-gray-200",
            }
            const typeLabel = TYPE_LABELS[payment.type] ?? payment.type

            return (
              <div
                key={payment.id}
                className="bg-white border border-brand-200 rounded-2xl p-5 space-y-3"
              >
                {/* Top row: type + status + amount */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full">
                      {typeLabel}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium border px-2.5 py-1 rounded-full",
                        statusInfo.color
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <span className="font-bold text-brand-900 text-base">
                    {formatVND(payment.amount)}
                  </span>
                </div>

                {/* Transfer description */}
                {payment.payosOrderCode && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-brand-500">Mã CK:</span>
                    <span className="font-mono font-semibold text-brand-900 bg-brand-50 px-2 py-0.5 rounded text-xs">
                      {payment.payosOrderCode}
                    </span>
                  </div>
                )}

                {/* Description */}
                {payment.description && (
                  <p className="text-sm text-brand-600">{payment.description}</p>
                )}

                {/* Date */}
                <p className="text-xs text-brand-400">
                  Ngày gửi: {formatDate(payment.createdAt)}
                </p>

                {/* Membership validity — only for MEMBERSHIP_FEE + SUCCESS */}
                {payment.type === "MEMBERSHIP_FEE" &&
                  payment.status === "SUCCESS" &&
                  payment.membership && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
                      Hiệu lực:{" "}
                      <span className="font-semibold">
                        {formatDate(payment.membership.validFrom)} –{" "}
                        {formatDate(payment.membership.validTo)}
                      </span>
                    </div>
                  )}

                {/* Certification product name */}
                {payment.type === "CERTIFICATION_FEE" &&
                  payment.certification?.product && (
                    <div className="text-xs text-brand-500">
                      Sản phẩm:{" "}
                      <span className="font-semibold text-brand-700">
                        {payment.certification.product.name}
                      </span>
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
