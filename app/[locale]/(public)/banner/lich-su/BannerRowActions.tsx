"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type RenewMonths = 1 | 3 | 6 | 12

type BankInfo = {
  bankName: string
  accountNumber: string
  accountName: string
  amount: number
  description: string
}

export function BannerRowActions({ bannerId }: { bannerId: string }) {
  const [open, setOpen] = useState(false)
  const [months, setMonths] = useState<RenewMonths>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const router = useRouter()

  async function handleRenew() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/banner/${bannerId}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra")
        return
      }
      setBankInfo(data.bankInfo)
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setBankInfo(null)
    setError(null)
    setMonths(1)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
      >
        Gia hạn
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {!bankInfo ? (
              <>
                <h3 className="text-lg font-bold text-brand-900">Gia hạn banner</h3>
                <p className="text-sm text-brand-500">Chọn số tháng muốn gia hạn (1.000.000đ/tháng):</p>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 3, 6, 12] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonths(m)}
                      className={`rounded-lg border-2 py-3 text-sm font-bold transition-colors ${
                        months === m
                          ? "border-brand-700 bg-brand-50 text-brand-900"
                          : "border-brand-200 text-brand-600 hover:border-brand-300"
                      }`}
                    >
                      {m} tháng
                    </button>
                  ))}
                </div>
                <div className="rounded-lg bg-brand-50/50 border border-brand-200 p-3 flex justify-between items-center">
                  <span className="text-sm text-brand-600">Tổng tiền</span>
                  <span className="text-xl font-bold text-brand-700">
                    {(months * 1_000_000).toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-brand-300 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleRenew}
                    disabled={submitting}
                    className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                  >
                    {submitting ? "Đang xử lý..." : "Lấy mã CK"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-1">🏦</div>
                  <h3 className="text-lg font-bold text-brand-900">Chuyển khoản gia hạn</h3>
                </div>
                <div className="rounded-xl border-2 border-brand-300 bg-brand-50/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-brand-600">Ngân hàng:</span>
                    <span className="font-semibold">{bankInfo.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-600">STK:</span>
                    <span className="font-mono font-semibold">{bankInfo.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-600">Chủ TK:</span>
                    <span className="font-semibold text-right">{bankInfo.accountName}</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-200 pt-2">
                    <span className="text-brand-600">Số tiền:</span>
                    <span className="text-lg font-bold text-brand-700">
                      {bankInfo.amount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-brand-600 mb-1">Nội dung CK:</p>
                    <code className="block rounded bg-white border border-brand-200 px-2 py-1.5 text-xs font-bold">
                      {bankInfo.description}
                    </code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Đã chuyển khoản — Đóng
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
