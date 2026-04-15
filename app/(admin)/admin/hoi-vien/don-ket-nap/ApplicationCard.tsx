"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"

type ApplicationData = {
  id: string
  status: string
  requestedCategory: string
  reason: string
  representativeName: string | null
  representativePosition: string | null
  submittedAt: string
  reviewedAt: string | null
  reviewerName: string | null
  rejectReason: string | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    accountType: string
    memberCategory: string
    companyName: string | null
    businessLicense: string | null
  }
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: "Chờ duyệt",    cls: "bg-amber-100 text-amber-800 border-amber-200" },
  APPROVED: { label: "Đã công nhận", cls: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "Đã từ chối",   cls: "bg-red-100 text-red-800 border-red-200" },
}

const CATEGORY_LABEL: Record<string, string> = {
  OFFICIAL:  "Chính thức",
  AFFILIATE: "Liên kết",
  HONORARY:  "Danh dự",
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function ApplicationCard({
  application: app,
}: {
  application: ApplicationData
}) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"none" | "approve" | "reject">("none")
  const [rejectReason, setRejectReason] = useState("")
  const [finalCategory, setFinalCategory] = useState(app.requestedCategory)
  const [error, setError] = useState<string | null>(null)

  const badge = STATUS_BADGE[app.status] ?? { label: app.status, cls: "bg-gray-100 text-gray-600" }
  const isBusiness = app.user.accountType === "BUSINESS"

  async function handleSubmit(action: "APPROVE" | "REJECT") {
    setError(null)

    if (action === "REJECT" && !rejectReason.trim()) {
      setError("Vui lòng nhập lý do từ chối.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/membership-applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejectReason: action === "REJECT" ? rejectReason.trim() : undefined,
          finalCategory: action === "APPROVE" ? finalCategory : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Xử lý thất bại")
        return
      }
      router.refresh()
    } catch {
      setError("Không thể kết nối")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-white p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/admin/hoi-vien/${app.user.id}`}
              className="font-bold text-brand-900 hover:text-brand-700"
            >
              {app.user.name}
            </Link>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-brand-500">
            {app.user.email}
            {app.user.phone && <> · {app.user.phone}</>}
          </p>
          {app.user.companyName && (
            <p className="text-xs text-brand-600">
              🏢 {app.user.companyName}
              {app.user.businessLicense && <> · ĐKKD: {app.user.businessLicense}</>}
            </p>
          )}
        </div>
        <div className="text-right text-xs text-brand-500 space-y-0.5">
          <p>Nộp: {fmtDate(app.submittedAt)}</p>
          {app.reviewedAt && (
            <p>
              Duyệt: {fmtDate(app.reviewedAt)}
              {app.reviewerName && <> · {app.reviewerName}</>}
            </p>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-brand-50 rounded-lg px-3 py-2">
          <p className="text-brand-500">Loại TK</p>
          <p className="font-semibold text-brand-800">
            {isBusiness ? "Doanh nghiệp" : "Cá nhân"}
          </p>
        </div>
        <div className="bg-brand-50 rounded-lg px-3 py-2">
          <p className="text-brand-500">Hạng hiện tại</p>
          <p className="font-semibold text-brand-800">
            {CATEGORY_LABEL[app.user.memberCategory]}
          </p>
        </div>
        <div className="bg-brand-50 rounded-lg px-3 py-2">
          <p className="text-brand-500">Xin hạng</p>
          <p className="font-semibold text-brand-800">
            {CATEGORY_LABEL[app.requestedCategory]}
          </p>
        </div>
        {isBusiness && app.representativeName && (
          <div className="bg-brand-50 rounded-lg px-3 py-2">
            <p className="text-brand-500">Người đại diện</p>
            <p className="font-semibold text-brand-800 truncate" title={app.representativeName}>
              {app.representativeName}
              {app.representativePosition && ` (${app.representativePosition})`}
            </p>
          </div>
        )}
      </div>

      {/* Reason */}
      <div>
        <p className="text-xs text-brand-500 mb-1">Lý do xin gia nhập:</p>
        <p className="text-sm text-brand-800 whitespace-pre-wrap leading-relaxed border-l-2 border-brand-200 pl-3 py-1">
          {app.reason}
        </p>
      </div>

      {/* Reject reason if already rejected */}
      {app.status === "REJECTED" && app.rejectReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs">
          <p className="font-semibold text-red-800">Lý do từ chối:</p>
          <p className="text-red-700 mt-1">{app.rejectReason}</p>
        </div>
      )}

      {/* Actions (only if PENDING) */}
      {app.status === "PENDING" && (
        <div className="pt-2 border-t border-brand-100">
          {mode === "none" && (
            <div className="flex gap-2">
              <button
                onClick={() => setMode("approve")}
                disabled={readOnly}
                title={readOnly ? READ_ONLY_TOOLTIP : undefined}
                className="flex-1 rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                ✓ Phê duyệt
              </button>
              <button
                onClick={() => setMode("reject")}
                disabled={readOnly}
                title={readOnly ? READ_ONLY_TOOLTIP : undefined}
                className="flex-1 rounded-lg border border-red-300 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                ✗ Từ chối
              </button>
            </div>
          )}

          {mode === "approve" && (
            <div className="space-y-3 bg-green-50 border border-green-200 rounded-lg p-4">
              <div>
                <label className="block text-xs font-medium text-green-800 mb-1">
                  Công nhận với hạng
                </label>
                <select
                  value={finalCategory}
                  onChange={(e) => setFinalCategory(e.target.value)}
                  className="w-full rounded-md border border-green-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="OFFICIAL">Chính thức</option>
                  <option value="AFFILIATE">Liên kết</option>
                  <option value="HONORARY">Danh dự</option>
                </select>
              </div>
              {error && (
                <p className="text-xs text-red-700">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmit("APPROVE")}
                  disabled={loading || readOnly}
                  title={readOnly ? READ_ONLY_TOOLTIP : undefined}
                  className="flex-1 rounded-md bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận phê duyệt"}
                </button>
                <button
                  onClick={() => { setMode("none"); setError(null) }}
                  disabled={loading}
                  className="rounded-md border border-green-300 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                >
                  Huỷ
                </button>
              </div>
            </div>
          )}

          {mode === "reject" && (
            <div className="space-y-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <div>
                <label className="block text-xs font-medium text-red-800 mb-1">
                  Lý do từ chối <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-red-300 px-3 py-2 text-sm bg-white resize-none"
                  placeholder="Hồ sơ chưa đủ, cần bổ sung giấy phép kinh doanh..."
                />
              </div>
              {error && (
                <p className="text-xs text-red-700">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmit("REJECT")}
                  disabled={loading || readOnly}
                  title={readOnly ? READ_ONLY_TOOLTIP : undefined}
                  className="flex-1 rounded-md bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
                <button
                  onClick={() => { setMode("none"); setError(null) }}
                  disabled={loading}
                  className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
