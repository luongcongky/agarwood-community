"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { getUserPermissions, hasPermission } from "@/lib/permissions"
import {
  OPENING_BALANCE_CATEGORY_ID,
  parseAmountInput,
  parseDateInput,
} from "@/lib/ledger"

/**
 * Server actions cho /admin/thu-chi.
 *
 * Quyền: tất cả mutation cần `ledger:write` (chỉ ADMIN — `admin:full` cover).
 * Read-only KIEM_TRA committee có `ledger:read` để xem nhưng KHÔNG sửa.
 *
 * Lý do tách READ vs WRITE: tài chính = trách nhiệm tập trung 1 đầu mối,
 * KIEM_TRA giám sát không nên đồng thời ghi sổ.
 */

async function requireWriter() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Chưa đăng nhập" as const, userId: null }
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "ledger:write")) {
    return { error: "Không có quyền ghi sổ quỹ" as const, userId: null }
  }
  return { error: null, userId: session.user.id }
}

const openingBalanceSchema = z.object({
  amount: z.string().min(1, "Nhập số dư đầu kỳ"),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  description: z.string().max(500).optional().or(z.literal("")),
})

export async function setOpeningBalance(input: unknown) {
  const { error, userId } = await requireWriter()
  if (error) return { error }

  const parsed = openingBalanceSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const amount = parseAmountInput(parsed.data.amount)
  if (amount === null) return { error: "Số tiền không hợp lệ" }
  if (amount <= 0) return { error: "Số dư đầu kỳ phải lớn hơn 0" }

  const date = parseDateInput(parsed.data.transactionDate)
  if (!date) return { error: "Ngày không hợp lệ" }

  // Idempotent: nếu đã có opening balance → lỗi (admin phải edit qua trang chi tiết)
  const existing = await prisma.ledgerTransaction.findFirst({
    where: { categoryId: OPENING_BALANCE_CATEGORY_ID },
    select: { id: true },
  })
  if (existing) {
    return { error: "Số dư đầu kỳ đã được ghi nhận trước đó" }
  }

  await prisma.ledgerTransaction.create({
    data: {
      type: "INCOME",
      categoryId: OPENING_BALANCE_CATEGORY_ID,
      amount: BigInt(amount),
      transactionDate: date,
      paymentMethod: "BANK",
      description: parsed.data.description?.trim() || "Số dư đầu kỳ khi triển khai sổ quỹ",
      isSystem: true,
      recordedById: userId!,
    },
  })

  revalidatePath("/admin/thu-chi")
  revalidatePath("/admin/thu-chi/so-quy")
  return { success: true as const }
}

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1, "Chọn danh mục"),
  amount: z.string().min(1, "Nhập số tiền"),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  paymentMethod: z.enum(["CASH", "BANK"]),
  referenceNo: z.string().max(100).optional().or(z.literal("")),
  description: z.string().min(1, "Nhập diễn giải").max(2000),
  receiptUrl: z.string().url().optional().or(z.literal("")),
})

export async function createTransaction(input: unknown) {
  const { error, userId } = await requireWriter()
  if (error) return { error }

  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const amount = parseAmountInput(parsed.data.amount)
  if (amount === null) return { error: "Số tiền không hợp lệ" }
  if (amount <= 0) return { error: "Số tiền phải lớn hơn 0" }

  const date = parseDateInput(parsed.data.transactionDate)
  if (!date) return { error: "Ngày không hợp lệ" }

  // Validate category type khớp với transaction type
  const cat = await prisma.ledgerCategory.findUnique({
    where: { id: parsed.data.categoryId },
    select: { type: true, isActive: true, isSystem: true, id: true },
  })
  if (!cat || !cat.isActive) return { error: "Danh mục không tồn tại hoặc đã ngưng hoạt động" }
  if (cat.type !== parsed.data.type) {
    return { error: "Danh mục không khớp loại thu/chi" }
  }
  // Số dư đầu kỳ chỉ được ghi 1 lần qua wizard, không cho tạo thêm tay.
  if (cat.id === OPENING_BALANCE_CATEGORY_ID) {
    return { error: "Không thể tạo giao dịch số dư đầu kỳ trực tiếp" }
  }

  const created = await prisma.ledgerTransaction.create({
    data: {
      type: parsed.data.type,
      categoryId: parsed.data.categoryId,
      amount: BigInt(amount),
      transactionDate: date,
      paymentMethod: parsed.data.paymentMethod,
      referenceNo: parsed.data.referenceNo?.trim() || null,
      description: parsed.data.description.trim(),
      receiptUrl: parsed.data.receiptUrl?.trim() || null,
      recordedById: userId!,
    },
    select: { id: true },
  })

  revalidatePath("/admin/thu-chi")
  revalidatePath("/admin/thu-chi/so-quy")
  revalidatePath("/admin/thu-chi/bao-cao")
  return { success: true as const, id: created.id }
}

export async function updateTransaction(id: string, input: unknown) {
  const { error } = await requireWriter()
  if (error) return { error }

  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const amount = parseAmountInput(parsed.data.amount)
  if (amount === null) return { error: "Số tiền không hợp lệ" }
  if (amount <= 0) return { error: "Số tiền phải lớn hơn 0" }

  const date = parseDateInput(parsed.data.transactionDate)
  if (!date) return { error: "Ngày không hợp lệ" }

  const tx = await prisma.ledgerTransaction.findUnique({
    where: { id },
    select: { id: true, isSystem: true, categoryId: true },
  })
  if (!tx) return { error: "Giao dịch không tồn tại" }

  const cat = await prisma.ledgerCategory.findUnique({
    where: { id: parsed.data.categoryId },
    select: { type: true, isActive: true, id: true },
  })
  if (!cat || !cat.isActive) return { error: "Danh mục không tồn tại hoặc đã ngưng hoạt động" }
  if (cat.type !== parsed.data.type) return { error: "Danh mục không khớp loại thu/chi" }

  // Bảo vệ system transaction: không cho đổi category sang/khỏi opening balance.
  // Cho edit amount/date/description thoải mái (user yêu cầu sửa thoải mái).
  if (tx.isSystem && parsed.data.categoryId !== tx.categoryId) {
    return { error: "Không thể đổi danh mục của giao dịch hệ thống" }
  }
  if (!tx.isSystem && cat.id === OPENING_BALANCE_CATEGORY_ID) {
    return { error: "Không thể chuyển sang danh mục Số dư đầu kỳ" }
  }

  await prisma.ledgerTransaction.update({
    where: { id },
    data: {
      type: parsed.data.type,
      categoryId: parsed.data.categoryId,
      amount: BigInt(amount),
      transactionDate: date,
      paymentMethod: parsed.data.paymentMethod,
      referenceNo: parsed.data.referenceNo?.trim() || null,
      description: parsed.data.description.trim(),
      receiptUrl: parsed.data.receiptUrl?.trim() || null,
    },
  })

  revalidatePath("/admin/thu-chi")
  revalidatePath("/admin/thu-chi/so-quy")
  revalidatePath(`/admin/thu-chi/${id}`)
  revalidatePath("/admin/thu-chi/bao-cao")
  return { success: true as const }
}

export async function deleteTransaction(id: string) {
  const { error } = await requireWriter()
  if (error) return { error }

  const tx = await prisma.ledgerTransaction.findUnique({
    where: { id },
    select: { isSystem: true, relatedPaymentId: true },
  })
  if (!tx) return { error: "Giao dịch không tồn tại" }
  if (tx.isSystem) return { error: "Không thể xóa giao dịch hệ thống" }
  if (tx.relatedPaymentId) {
    return { error: "Giao dịch này được sinh tự động từ xác nhận chuyển khoản — không thể xóa độc lập" }
  }

  await prisma.ledgerTransaction.delete({ where: { id } })

  revalidatePath("/admin/thu-chi")
  revalidatePath("/admin/thu-chi/so-quy")
  revalidatePath("/admin/thu-chi/bao-cao")
  redirect("/admin/thu-chi/so-quy")
}

// ── Category management ────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(2, "Tên danh mục tối thiểu 2 ký tự").max(100),
  type: z.enum(["INCOME", "EXPENSE"]),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(50),
  isActive: z.boolean().default(true),
})

export async function createCategory(input: unknown) {
  const { error } = await requireWriter()
  if (error) return { error }

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await prisma.ledgerCategory.create({
    data: {
      name: parsed.data.name.trim(),
      type: parsed.data.type,
      displayOrder: parsed.data.displayOrder,
      isActive: parsed.data.isActive,
    },
  })

  revalidatePath("/admin/thu-chi/danh-muc")
  return { success: true as const }
}

const categoryUpdateSchema = categorySchema.partial()

export async function updateCategory(id: string, input: unknown) {
  const { error } = await requireWriter()
  if (error) return { error }

  const parsed = categoryUpdateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const existing = await prisma.ledgerCategory.findUnique({
    where: { id },
    select: { isSystem: true },
  })
  if (!existing) return { error: "Danh mục không tồn tại" }

  // System category: cho rename + reorder + toggle isActive, KHÔNG cho đổi type.
  const data: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim()
  if (parsed.data.displayOrder !== undefined) data.displayOrder = parsed.data.displayOrder
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive
  if (parsed.data.type !== undefined && !existing.isSystem) data.type = parsed.data.type
  if (parsed.data.type !== undefined && existing.isSystem) {
    return { error: "Không thể đổi loại của danh mục hệ thống" }
  }

  await prisma.ledgerCategory.update({ where: { id }, data })
  revalidatePath("/admin/thu-chi/danh-muc")
  return { success: true as const }
}

export async function deleteCategory(id: string) {
  const { error } = await requireWriter()
  if (error) return { error }

  const cat = await prisma.ledgerCategory.findUnique({
    where: { id },
    select: { isSystem: true, _count: { select: { transactions: true } } },
  })
  if (!cat) return { error: "Danh mục không tồn tại" }
  if (cat.isSystem) return { error: "Không thể xóa danh mục hệ thống" }
  if (cat._count.transactions > 0) {
    return { error: `Danh mục đang được dùng bởi ${cat._count.transactions} giao dịch — chuyển sang trạng thái ngưng thay vì xóa` }
  }

  await prisma.ledgerCategory.delete({ where: { id } })
  revalidatePath("/admin/thu-chi/danh-muc")
  return { success: true as const }
}
