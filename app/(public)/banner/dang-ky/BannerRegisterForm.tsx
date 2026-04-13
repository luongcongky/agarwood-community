"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Step = 1 | 2 | 3 | 4

type QuotaInfo = {
  used: number
  limit: number
  remaining: number
  resetAt: string
  pricePerMonth: number
}

type BankInfo = {
  bankName: string
  accountNumber: string
  accountName: string
  amount: number
  description: string
}

function todayPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ"
}

export function BannerRegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [quota, setQuota] = useState<QuotaInfo | null>(null)

  // Step 1: schedule + position
  const [startDate, setStartDate] = useState(todayPlusDays(1))
  const [endDate, setEndDate] = useState(todayPlusDays(31))
  const [position, setPosition] = useState<"TOP" | "MID">("TOP")

  // Step 2: content
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState("")
  const [targetUrl, setTargetUrl] = useState("https://")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 3: payment
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch quota on mount
  useEffect(() => {
    fetch("/api/banner/quota")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setQuota(data))
      .catch(() => {})
  }, [])

  // Tính số tháng + tổng tiền
  const monthsCount = (() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0
    const days = Math.ceil((end.getTime() - start.getTime()) / 86_400_000)
    return Math.max(1, Math.ceil(days / 30))
  })()
  const pricePerMonth = quota?.pricePerMonth ?? 1_000_000
  const totalPrice = monthsCount * pricePerMonth
  const quotaExhausted = quota && quota.limit !== -1 && quota.remaining === 0

  // ─── Step 1 ────────────────────────────────────────────────────────────
  function validateStep1(): string | null {
    if (!startDate || !endDate) return "Vui lòng chọn ngày bắt đầu và kết thúc"
    if (new Date(endDate) <= new Date(startDate)) return "Ngày kết thúc phải sau ngày bắt đầu"
    if (monthsCount < 1) return "Thời gian tối thiểu 1 tháng"
    if (quotaExhausted) return "Đã đạt quota tháng này — không thể đăng ký thêm"
    return null
  }

  // ─── Step 2 ────────────────────────────────────────────────────────────
  async function handleImageUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "banner")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setImageUrl(data.secure_url ?? data.url)
    } catch {
      setError("Tải ảnh thất bại. Vui lòng thử lại.")
    } finally {
      setUploading(false)
    }
  }

  function validateStep2(): string | null {
    if (!imageUrl) return "Vui lòng tải lên ảnh banner"
    if (!title || title.length < 5) return "Tiêu đề tối thiểu 5 ký tự"
    if (title.length > 100) return "Tiêu đề tối đa 100 ký tự"
    if (!targetUrl.startsWith("https://")) return "Đường dẫn đích phải bắt đầu bằng https://"
    if (targetUrl.length < 12) return "Đường dẫn đích không hợp lệ"
    return null
  }

  // ─── Step 3 → submit ───────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, targetUrl, title, startDate, endDate, position }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra")
        setSubmitting(false)
        return
      }
      setBankInfo(data.bankInfo)
      setStep(4)
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleCopyDescription() {
    if (!bankInfo) return
    navigator.clipboard.writeText(bankInfo.description)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDone() {
    router.push("/banner/lich-su")
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
      {/* Quota chip */}
      {quota && (
        <div className="border-b border-brand-100 px-6 py-3 bg-brand-50/50 flex items-center justify-between">
          <span className="text-xs text-brand-600">Quota tháng này</span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              quota.limit === -1
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : quota.remaining === 0
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-brand-50 text-brand-700 border border-brand-200",
            )}
          >
            {quota.limit === -1 ? "∞ không giới hạn" : `Đã dùng ${quota.used}/${quota.limit} mẫu`}
          </span>
        </div>
      )}

      {/* Step indicator */}
      <div className="px-6 pt-6">
        <ol className="flex items-center justify-between text-xs">
          {(["Thời gian", "Nội dung", "Thanh toán", "Hoàn tất"] as const).map((label, idx) => {
            const stepNum = (idx + 1) as Step
            const active = step === stepNum
            const done = step > stepNum
            return (
              <li key={label} className="flex items-center gap-2 flex-1">
                <span
                  className={cn(
                    "inline-flex w-7 h-7 rounded-full items-center justify-center font-semibold",
                    done && "bg-emerald-600 text-white",
                    active && "bg-brand-700 text-white",
                    !done && !active && "bg-brand-100 text-brand-400",
                  )}
                >
                  {done ? "✓" : stepNum}
                </span>
                <span className={cn("flex-1", active ? "text-brand-900 font-medium" : "text-brand-500")}>
                  {label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <div>
              <h2 className="text-lg font-bold text-brand-900">Chọn thời gian hiển thị</h2>
              <p className="text-sm text-brand-500 mt-0.5">
                Banner sẽ hiển thị trên trang chủ trong khoảng thời gian này (tối thiểu 1 tháng).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-800 mb-2">Vị trí hiển thị</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "TOP", label: "Đầu trang chủ", desc: "Ngay sau thanh menu" },
                  { value: "MID", label: "Giữa trang chủ", desc: "Sau khu sản phẩm chứng nhận" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPosition(opt.value)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      position === opt.value
                        ? "border-brand-700 bg-brand-50 ring-1 ring-brand-700"
                        : "border-brand-200 hover:bg-brand-50/50",
                    )}
                  >
                    <p className="text-sm font-semibold text-brand-900">{opt.label}</p>
                    <p className="text-xs text-brand-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={startDate}
                  min={todayPlusDays(0)}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || todayPlusDays(1)}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-600 uppercase tracking-wider">Tổng cộng</p>
                <p className="text-2xl font-bold text-brand-900">
                  {monthsCount} tháng × {formatVnd(pricePerMonth)}/tháng
                </p>
              </div>
              <p className="text-2xl font-bold text-brand-700">{formatVnd(totalPrice)}</p>
            </div>

            {error && <ErrorBox>{error}</ErrorBox>}
            {quotaExhausted && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                ⚠ Bạn đã đạt quota {quota!.limit} mẫu tháng này. Quota sẽ reset vào{" "}
                <strong>{new Date(quota!.resetAt).toLocaleDateString("vi-VN")}</strong>. Hoặc{" "}
                <Link href="/landing" className="underline font-semibold">
                  nâng cấp Hội viên
                </Link>{" "}
                để tăng quota.
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!!quotaExhausted}
                onClick={() => {
                  const err = validateStep1()
                  if (err) return setError(err)
                  setError(null)
                  setStep(2)
                }}
                className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Tiếp theo →
              </button>
            </div>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <>
            <div>
              <h2 className="text-lg font-bold text-brand-900">Nội dung banner</h2>
              <p className="text-sm text-brand-500 mt-0.5">
                Tải lên ảnh banner (khuyến nghị tỉ lệ 16:9, tối đa 5MB), nhập tiêu đề và link đích.
              </p>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-2">Ảnh banner *</label>
              {imageUrl ? (
                <div className="relative">
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-brand-200 bg-brand-50">
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" sizes="600px" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="mt-2 text-xs text-red-600 hover:underline"
                  >
                    Xóa ảnh và tải lại
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 hover:border-brand-400 transition-colors flex flex-col items-center justify-center text-brand-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="size-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-3xl mb-2">📷</span>
                      <span className="text-sm font-medium">Click để tải lên</span>
                      <span className="text-xs text-brand-400 mt-1">Tỉ lệ 16:9 hoặc 3:1, max 5MB</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                  e.target.value = ""
                }}
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1">
                Tiêu đề <span className="text-xs text-brand-500">(5-100 ký tự)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Khuyến mãi 30% trầm hương Khánh Hòa"
                maxLength={100}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
              <p className="text-xs text-brand-400 mt-1">{title.length}/100 ký tự</p>
            </div>

            {/* Target URL */}
            <div>
              <label className="block text-sm font-medium text-brand-800 mb-1">
                Đường dẫn đích (https://...)
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/san-pham/abc"
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm font-mono"
              />
            </div>

            {error && <ErrorBox>{error}</ErrorBox>}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setStep(1)
                }}
                className="rounded-lg border border-brand-300 px-6 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={() => {
                  const err = validateStep2()
                  if (err) return setError(err)
                  setError(null)
                  setStep(3)
                }}
                className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Tiếp theo →
              </button>
            </div>
          </>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <>
            <div>
              <h2 className="text-lg font-bold text-brand-900">Xác nhận và thanh toán</h2>
              <p className="text-sm text-brand-500 mt-0.5">
                Vui lòng kiểm tra lại thông tin và thực hiện chuyển khoản.
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-600">Vị trí:</span>
                <span className="font-semibold text-brand-900">
                  {position === "TOP" ? "Đầu trang chủ" : "Giữa trang chủ"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-600">Tiêu đề:</span>
                <span className="font-semibold text-brand-900 text-right">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-600">Link đích:</span>
                <span className="font-mono text-xs text-brand-700 truncate max-w-xs">{targetUrl}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-600">Thời gian:</span>
                <span className="text-brand-900">
                  {new Date(startDate).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(endDate).toLocaleDateString("vi-VN")} ({monthsCount} tháng)
                </span>
              </div>
              <div className="flex justify-between border-t border-brand-200 pt-3">
                <span className="text-brand-600 font-semibold">Tổng tiền:</span>
                <span className="text-xl font-bold text-brand-700">{formatVnd(totalPrice)}</span>
              </div>
            </div>

            {error && <ErrorBox>{error}</ErrorBox>}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setStep(2)
                }}
                disabled={submitting}
                className="rounded-lg border border-brand-300 px-6 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận và lấy mã CK"}
              </button>
            </div>
          </>
        )}

        {/* ── Step 4 ── */}
        {step === 4 && bankInfo && (
          <>
            <div className="text-center">
              <div className="text-5xl mb-2">🏦</div>
              <h2 className="text-lg font-bold text-brand-900">Chuyển khoản theo thông tin bên dưới</h2>
              <p className="text-sm text-brand-500 mt-0.5">
                Sau khi chuyển khoản, ban quản trị sẽ xác nhận trong vòng 24h.
              </p>
            </div>

            <div className="rounded-xl border-2 border-brand-300 bg-brand-50/30 p-5 space-y-3 text-sm">
              <BankRow label="Ngân hàng" value={bankInfo.bankName} />
              <BankRow label="Số tài khoản" value={bankInfo.accountNumber} mono />
              <BankRow label="Chủ tài khoản" value={bankInfo.accountName} />
              <BankRow label="Số tiền" value={formatVnd(bankInfo.amount)} highlight />
              <div>
                <p className="text-xs text-brand-600 mb-1">Nội dung CK (quan trọng — copy chính xác)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-white border border-brand-200 px-3 py-2 text-sm font-bold text-brand-900">
                    {bankInfo.description}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyDescription}
                    className="rounded-lg bg-brand-700 text-white px-3 py-2 text-xs font-semibold hover:bg-brand-800"
                  >
                    {copied ? "Đã copy ✓" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              ⚠ <strong>Lưu ý:</strong> Phải nhập đúng nội dung CK để admin đối chiếu. Banner sẽ chuyển sang
              <strong> chờ duyệt content</strong> sau khi admin xác nhận chuyển khoản.
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDone}
                className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Tôi đã chuyển khoản → Xem lịch sử
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </div>
  )
}

function BankRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-brand-600">{label}:</span>
      <span
        className={cn(
          "text-right",
          mono && "font-mono",
          highlight ? "text-xl font-bold text-brand-700" : "font-semibold text-brand-900",
        )}
      >
        {value}
      </span>
    </div>
  )
}
