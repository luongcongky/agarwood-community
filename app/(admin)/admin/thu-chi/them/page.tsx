import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { getActiveCategories } from "@/lib/ledger"
import { TransactionForm } from "../_components/TransactionForm"
import { ChevronLeft } from "lucide-react"

export const revalidate = 0

export default async function NewTransactionPage() {
  const session = await auth()
  if (!session?.user?.id) notFound()
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "ledger:write")) notFound()

  const categories = await getActiveCategories()

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/thu-chi/so-quy"
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Sổ quỹ
        </Link>
        <h1 className="text-2xl font-bold text-brand-900 mt-1">Thêm giao dịch</h1>
      </div>

      <TransactionForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          isSystem: c.isSystem,
        }))}
      />
    </div>
  )
}
