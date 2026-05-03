import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import { CategoryManager } from "../_components/CategoryManager"
import { ChevronLeft } from "lucide-react"

export const revalidate = 0

export default async function CategoryAdminPage() {
  const session = await auth()
  if (!session?.user?.id) notFound()
  const perms = await getUserPermissions(session.user.id)
  // Read perm để xem; quản lý (CRUD) cần write — UI vẫn hiển thị nút nhưng
  // server actions sẽ chặn nếu user không có quyền.
  if (!hasPermission(perms, "ledger:read")) notFound()

  const categories = await prisma.ledgerCategory.findMany({
    orderBy: [{ type: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      displayOrder: true,
      isActive: true,
      isSystem: true,
      _count: { select: { transactions: true } },
    },
  })

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/thu-chi"
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Tổng quan
        </Link>
        <h1 className="text-2xl font-bold text-brand-900 mt-1">Danh mục thu chi</h1>
        <p className="text-sm text-brand-500 mt-1">
          Danh mục có ⚠ <strong>HT</strong> là danh mục hệ thống — cho phép đổi
          tên/thứ tự/trạng thái, không cho xóa hoặc đổi loại. Danh mục đang được
          dùng cũng không thể xóa — chuyển sang trạng thái <em>Ngưng</em> để ẩn
          khỏi form thêm giao dịch.
        </p>
      </div>

      <CategoryManager
        initial={categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          displayOrder: c.displayOrder,
          isActive: c.isActive,
          isSystem: c.isSystem,
          transactionCount: c._count.transactions,
        }))}
      />
    </div>
  )
}
