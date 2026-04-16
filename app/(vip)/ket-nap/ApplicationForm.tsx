"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = {
  userName: string
  accountType: string
  currentCategory: string
  defaultRepresentativeName: string
  defaultRepresentativePosition: string
}

export function ApplicationForm({
  userName,
  accountType,
  currentCategory,
  defaultRepresentativeName,
  defaultRepresentativePosition,
}: Props) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [requestedCategory, setRequestedCategory] = useState("OFFICIAL")
  const [representativeName, setRepresentativeName] = useState(defaultRepresentativeName)
  const [representativePosition, setRepresentativePosition] = useState(defaultRepresentativePosition)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBusiness = accountType === "BUSINESS"
  const isAlreadyOfficial = currentCategory === "OFFICIAL"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (reason.trim().length < 20) {
      setError("Vui lòng viết lý do xin gia nhập (ít nhất 20 ký tự).")
      return
    }

    if (isBusiness && !representativeName.trim()) {
      setError("Tổ chức phải chỉ định người đại diện.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/membership/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          requestedCategory,
          representativeName: isBusiness ? representativeName.trim() : null,
          representativePosition: isBusiness ? representativePosition.trim() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Không thể nộp đơn. Vui lòng thử lại.")
        return
      }
      router.refresh()
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-brand-200 bg-white p-6 space-y-5"
    >
      <div>
        <h2 className="text-base font-bold text-brand-900">Nộp đơn kết nạp</h2>
        <p className="text-xs text-brand-500 mt-1">
          Người nộp đơn: <strong>{userName}</strong> ·{" "}
          {isBusiness ? "Tài khoản Doanh nghiệp" : "Tài khoản Cá nhân"}
        </p>
        {isAlreadyOfficial && (
          <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
            Bạn hiện CHƯA là Hội viên Chính thức. Nộp đơn là bước cần cần thiết để Hội xác nhận và thay đổi hạng.
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-brand-700 mb-1.5">
          Hạng Hội viên xin kết nạp <span className="text-red-500">*</span>
        </label>
        <select
          value={requestedCategory}
          onChange={(e) => setRequestedCategory(e.target.value)}
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        >
          <option value="OFFICIAL">
            Chính thức — đầy đủ quyền biểu quyết, ứng cử, bầu cử
          </option>
          <option value="AFFILIATE">
            Liên kết — dành cho DN chưa đủ tiêu chuẩn chính thức, DN FDI
          </option>
          <option value="HONORARY">
            Danh dự — cá nhân/tổ chức uy tín, có đóng góp cho Hội
          </option>
        </select>
      </div>

      {/* Representative (business only) */}
      {isBusiness && (
        <div className="space-y-3 rounded-lg border border-brand-100 bg-brand-50/40 p-4">
          <p className="text-xs font-medium text-brand-700">
            Người đại diện tổ chức (Điều 7 Khoản 2c)
          </p>
          <div>
            <label className="block text-xs text-brand-600 mb-1">
              Họ tên người đại diện <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
              placeholder="Ví dụ: Trần Văn A"
              className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label className="block text-xs text-brand-600 mb-1">Chức vụ</label>
            <input
              type="text"
              value={representativePosition}
              onChange={(e) => setRepresentativePosition(e.target.value)}
              placeholder="Ví dụ: Giám đốc, Chủ tịch HĐQT"
              className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>
      )}

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-brand-700 mb-1.5">
          Lý do xin gia nhập & giới thiệu{" "}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder="Giới thiệu bản thân / tổ chức, kinh nghiệm trong ngành trầm hương, lý do muốn gia nhập Hội, mong muốn đóng góp..."
          className="w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 resize-none"
        />
        <p className="mt-1 text-xs text-brand-400">
          {reason.length}/2000 ký tự · Tối thiểu 20 ký tự
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Đang gửi..." : "Nộp đơn kết nạp"}
      </button>
      <p className="text-xs text-brand-400 text-center">
        Ban Thường vụ Hội sẽ xét duyệt trong cuộc họp quý sắp tới. Kết quả
        thông báo qua email trong vòng 30 ngày.
      </p>
    </form>
  )
}
