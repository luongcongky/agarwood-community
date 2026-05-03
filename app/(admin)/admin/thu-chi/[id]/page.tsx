import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { getActiveCategories, formatLedgerDate } from "@/lib/ledger"
import { formatVnd } from "@/lib/certification-fee"
import { TransactionForm } from "../_components/TransactionForm"
import { ChevronLeft, Receipt } from "lucide-react"

export const revalidate = 0

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) notFound()
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "ledger:read")) notFound()
  const canWrite = hasPermission(perms, "ledger:write")

  const tx = await prisma.ledgerTransaction.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, isSystem: true } },
      recordedBy: { select: { name: true, email: true } },
      payment: {
        select: {
          id: true,
          type: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  })
  if (!tx) notFound()

  // Read-only view cho người không có write perm
  if (!canWrite) {
    return (
      <div className="space-y-5 max-w-3xl">
        <div>
          <Link
            href="/admin/thu-chi/so-quy"
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Sổ quỹ
          </Link>
          <h1 className="text-2xl font-bold text-brand-900 mt-1">Chi tiết giao dịch</h1>
        </div>
        <ReadOnlyView tx={tx} />
      </div>
    )
  }

  const categories = await getActiveCategories()

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/thu-chi/so-quy"
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Sổ quỹ
          </Link>
          <h1 className="text-2xl font-bold text-brand-900 mt-1">Chi tiết giao dịch</h1>
          <p className="text-xs text-brand-500 mt-1">
            Ghi nhận bởi <strong>{tx.recordedBy.name}</strong> · {formatLedgerDate(tx.createdAt)}
          </p>
        </div>
      </div>

      <TransactionForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          isSystem: c.isSystem,
        }))}
        initial={{
          id: tx.id,
          type: tx.type,
          categoryId: tx.categoryId,
          amount: Number(tx.amount),
          transactionDate: tx.transactionDate.toISOString().slice(0, 10),
          paymentMethod: tx.paymentMethod,
          referenceNo: tx.referenceNo,
          description: tx.description,
          receiptUrl: tx.receiptUrl,
          isSystem: tx.isSystem,
          hasRelatedPayment: !!tx.relatedPaymentId,
        }}
      />

      {tx.payment && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 max-w-3xl">
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-2">
            Liên kết payment
          </p>
          <p className="text-sm text-brand-800">
            {tx.payment.type} từ <strong>{tx.payment.user.name ?? tx.payment.user.email}</strong>
          </p>
          <Link
            href={`/admin/thanh-toan`}
            className="text-xs text-brand-600 hover:text-brand-800 inline-block mt-1"
          >
            → Xem trong /admin/thanh-toan
          </Link>
        </div>
      )}
    </div>
  )
}

function ReadOnlyView({
  tx,
}: {
  tx: {
    type: "INCOME" | "EXPENSE"
    amount: bigint
    transactionDate: Date
    description: string
    referenceNo: string | null
    receiptUrl: string | null
    paymentMethod: "CASH" | "BANK"
    category: { name: string }
    recordedBy: { name: string }
    createdAt: Date
  }
}) {
  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-baseline gap-3">
        <span
          className={`text-3xl font-bold tabular-nums ${
            tx.type === "INCOME" ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {tx.type === "INCOME" ? "+" : "−"}
          {formatVnd(Number(tx.amount))}
        </span>
        <span className="text-sm text-brand-500">{tx.category.name}</span>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-brand-500 text-xs uppercase tracking-wide">Ngày</dt>
          <dd className="text-brand-900">{formatLedgerDate(tx.transactionDate)}</dd>
        </div>
        <div>
          <dt className="text-brand-500 text-xs uppercase tracking-wide">Hình thức</dt>
          <dd className="text-brand-900">
            {tx.paymentMethod === "BANK" ? "Chuyển khoản" : "Tiền mặt"}
          </dd>
        </div>
        {tx.referenceNo && (
          <div>
            <dt className="text-brand-500 text-xs uppercase tracking-wide">Số phiếu / Mã GD</dt>
            <dd className="text-brand-900 font-mono">{tx.referenceNo}</dd>
          </div>
        )}
        <div>
          <dt className="text-brand-500 text-xs uppercase tracking-wide">Ghi nhận bởi</dt>
          <dd className="text-brand-900">
            {tx.recordedBy.name} · {formatLedgerDate(tx.createdAt)}
          </dd>
        </div>
      </dl>
      <div>
        <dt className="text-brand-500 text-xs uppercase tracking-wide">Diễn giải</dt>
        <dd className="text-brand-900 whitespace-pre-wrap mt-1">{tx.description}</dd>
      </div>
      {tx.receiptUrl && (
        <a
          href={tx.receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-medium"
        >
          <Receipt className="h-4 w-4" /> Xem chứng từ
        </a>
      )}
    </div>
  )
}
