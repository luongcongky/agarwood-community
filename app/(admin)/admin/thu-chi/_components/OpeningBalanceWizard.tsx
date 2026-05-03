"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { setOpeningBalance } from "../_actions"
import { formatAmountInput, parseAmountInput } from "@/lib/ledger-utils"

export function OpeningBalanceWizard() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  function onAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Auto-format với dấu chấm phân cách hàng nghìn (kiểu vi-VN)
    const raw = e.target.value
    const parsed = parseAmountInput(raw)
    if (parsed === null) {
      // Cho phép xóa hết
      if (raw === "") setAmount("")
      return
    }
    setAmount(formatAmountInput(parsed))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await setOpeningBalance({
        amount,
        transactionDate: date,
        description,
      })
      if ("error" in res && res.error) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 sm:p-8 max-w-2xl">
      <div className="space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
          ★ Bước khởi tạo
        </div>
        <h2 className="text-xl font-bold text-brand-900">Nhập số dư đầu kỳ</h2>
        <p className="text-sm text-brand-600">
          Hội đã có quỹ trước khi triển khai sổ quỹ điện tử. Nhập số dư hiện tại
          và ngày bắt đầu — mọi giao dịch thu/chi tiếp theo sẽ cộng/trừ từ con
          số này.
        </p>
        <p className="text-xs text-brand-500">
          Chỉ thực hiện <strong>1 lần</strong>. Có thể chỉnh lại sau qua trang
          chi tiết giao dịch nếu nhập sai.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-brand-800">
              Số dư đầu kỳ (VNĐ) <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              inputMode="numeric"
              required
              value={amount}
              onChange={onAmountChange}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-right font-mono text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-brand-800">
              Ngày bắt đầu <span className="text-red-500">*</span>
            </span>
            <input
              type="date"
              required
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-brand-800">Ghi chú</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Số dư đầu kỳ khi triển khai sổ quỹ"
            className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full sm:w-auto rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? "Đang lưu..." : "Lưu số dư đầu kỳ"}
        </button>
      </form>
    </div>
  )
}
