import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getMemberTier } from "@/lib/tier"
import { redirect } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const revalidate = 0

const TYPE_LABELS: Record<string, string> = {
  MEMBERSHIP_FEE: "Phí hội viên",
  CERTIFICATION_FEE: "Phí chứng nhận",
  MEDIA_SERVICE: "Dịch vụ truyền thông",
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: "Đang chờ xác nhận", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  SUCCESS:  { label: "Đã xác nhận",       cls: "bg-green-100 text-green-700 border-green-200" },
  FAILED:   { label: "Từ chối",           cls: "bg-red-100 text-red-700 border-red-200" },
  REFUNDED: { label: "Đã hoàn tiền",      cls: "bg-blue-100 text-blue-700 border-blue-200" },
}

function formatVND(n: number) { return n.toLocaleString("vi-VN") + "đ" }
function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}


export default async function PaymentHistoryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [payments, user] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        payosOrderCode: true,
        description: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
        membership: { select: { validFrom: true, validTo: true } },
        certification: { select: { product: { select: { name: true } } } },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { contributionTotal: true, accountType: true },
    }),
  ])

  const contributionTotal = user?.contributionTotal ?? 0
  const tier = await getMemberTier(contributionTotal, (user?.accountType ?? "BUSINESS") as "BUSINESS" | "INDIVIDUAL")
  const totalPaid = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/gia-han" className="text-sm text-brand-600 hover:text-brand-800">
          ← Về trang gia hạn
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-brand-900">Lịch sử thanh toán</h1>

      {/* Payment list */}
      {payments.length === 0 ? (
        <div className="bg-white border border-brand-200 rounded-2xl p-12 text-center">
          <p className="text-brand-400 text-sm">Chưa có giao dịch nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const st = STATUS_MAP[p.status] ?? { label: p.status, cls: "bg-gray-100 text-gray-600 border-gray-200" }
            const typeLabel = TYPE_LABELS[p.type] ?? p.type
            const isPending = p.status === "PENDING"
            const pendingHours = isPending
              ? Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 3600000)
              : 0

            return (
              <div key={p.id} className="bg-white border border-brand-200 rounded-2xl p-5 space-y-3">
                {/* Top: date + type + amount */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm text-brand-700">{formatDate(p.createdAt)}</p>
                    <p className="text-xs text-brand-400 mt-0.5">{typeLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-900 text-base">{formatVND(p.amount)}</p>
                    <span className={cn("inline-flex text-xs font-medium border px-2 py-0.5 rounded-full mt-1", st.cls)}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* CK description */}
                {p.description && (
                  <p className="text-xs text-brand-600">Nội dung: <span className="font-mono font-semibold text-brand-900">{p.description}</span></p>
                )}

                {/* Confirmed: show membership validity */}
                {p.status === "SUCCESS" && p.type === "MEMBERSHIP_FEE" && p.membership && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
                    Hiệu lực: <span className="font-semibold">{formatDate(p.membership.validFrom)} – {formatDate(p.membership.validTo)}</span>
                    {p.updatedAt && <span className="text-green-600 ml-2">· Xác nhận {formatDate(p.updatedAt)}</span>}
                  </div>
                )}

                {/* Confirmed: cert product */}
                {p.status === "SUCCESS" && p.type === "CERTIFICATION_FEE" && p.certification?.product && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">
                    Sản phẩm: <span className="font-semibold">{p.certification.product.name}</span>
                    {p.updatedAt && <span className="text-green-600 ml-2">· Xác nhận {formatDate(p.updatedAt)}</span>}
                  </div>
                )}

                {/* Rejected: show reason */}
                {p.status === "FAILED" && p.failureReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                    Lý do: {p.failureReason}
                  </div>
                )}

                {/* Pending > 24h warning */}
                {isPending && pendingHours >= 24 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                    Giao dịch này đang chờ xác nhận hơn 24 giờ. Nếu bạn cần hỗ trợ, vui lòng liên hệ admin.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Summary footer */}
      <div className="bg-white border border-brand-200 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-brand-500">Tổng đã đóng góp cho hội</span>
          <span className="text-lg font-bold text-brand-900">{formatVND(totalPaid)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-brand-500">Hạng hiện tại</span>
          <span className="text-sm font-semibold text-brand-900">{"★".repeat(tier.stars)} {tier.label}</span>
        </div>
        {tier.next && (
          <p className="text-xs text-brand-400 pt-1 border-t border-brand-200">
            Cần thêm <span className="font-semibold text-brand-700">{formatVND(tier.needMore)}</span> để đạt hạng ★{"★".repeat(tier.stars)} {tier.next}
          </p>
        )}
      </div>
    </div>
  )
}
