"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

type BankInfo = {
  bankName: string
  accountNumber: string
  accountName: string
  amount: number
  description: string
}

type Product = {
  id: string
  name: string
  slug: string
  certStatus: string
  imageUrls: string[]
}

type Step1Data = {
  productId: string
  productName: string
}

type Step2Data = {
  applicantNote: string
  isOnlineReview: boolean
  bankAccountName: string
  bankAccountNumber: string
  bankName: string
}

type Step2Errors = Partial<Record<keyof Step2Data, string>>

const CERT_FEE = 5_000_000

const ACTIVE_CERT_STATUSES = ["PENDING", "APPROVED", "UNDER_REVIEW"]

const STEP_LABELS = [
  { step: 1, label: "Chọn sản phẩm" },
  { step: 2, label: "Hồ sơ & Tài liệu" },
  { step: 3, label: "Thanh toán" },
]

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ"
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_LABELS.map((item, i) => (
        <div key={item.step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                current === item.step
                  ? "bg-brand-700 border-brand-700 text-white"
                  : current > item.step
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white border-brand-300 text-brand-400"
              )}
            >
              {current > item.step ? "✓" : item.step}
            </div>
            <span
              className={cn(
                "text-xs mt-1 font-medium w-24 text-center",
                current === item.step ? "text-brand-800" : "text-brand-400"
              )}
            >
              {item.label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div
              className={cn(
                "w-16 h-0.5 mb-5 mx-1",
                current > item.step ? "bg-green-500" : "bg-brand-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default function NopDonPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1 state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState("")

  // Step 2 state
  const [applicantNote, setApplicantNote] = useState("")
  const [isOnlineReview, setIsOnlineReview] = useState(true)
  const [bankAccountName, setBankAccountName] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [step2Errors, setStep2Errors] = useState<Step2Errors>({})

  // Step 3 state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [certBankInfo, setCertBankInfo] = useState<BankInfo | null>(null)
  const [certDone, setCertDone] = useState(false)

  // Restore from sessionStorage on mount
  useEffect(() => {
    const s1 = sessionStorage.getItem("cert_step1")
    const s2 = sessionStorage.getItem("cert_step2")
    if (s1) {
      const d: Step1Data = JSON.parse(s1)
      setSelectedProductId(d.productId)
    }
    if (s2) {
      const d: Step2Data = JSON.parse(s2)
      setApplicantNote(d.applicantNote)
      setIsOnlineReview(d.isOnlineReview)
      setBankAccountName(d.bankAccountName)
      setBankAccountNumber(d.bankAccountNumber)
      setBankName(d.bankName)
    }
  }, [])

  // Fetch products
  useEffect(() => {
    fetch("/api/my-products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products ?? [])
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false))
  }, [])

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  function handleStep1Next() {
    if (!selectedProductId) return
    const step1Data: Step1Data = {
      productId: selectedProductId,
      productName: selectedProduct?.name ?? "",
    }
    sessionStorage.setItem("cert_step1", JSON.stringify(step1Data))
    setCurrentStep(2)
  }

  function validateStep2(): boolean {
    const errors: Step2Errors = {}
    if (!bankAccountName.trim())
      errors.bankAccountName = "Vui lòng nhập tên chủ tài khoản"
    if (!bankAccountNumber.trim())
      errors.bankAccountNumber = "Vui lòng nhập số tài khoản"
    if (!bankName.trim()) errors.bankName = "Vui lòng nhập tên ngân hàng"
    setStep2Errors(errors)
    return Object.keys(errors).length === 0
  }

  function handleStep2Next() {
    if (!validateStep2()) return
    const step2Data: Step2Data = {
      applicantNote,
      isOnlineReview,
      bankAccountName,
      bankAccountNumber,
      bankName,
    }
    sessionStorage.setItem("cert_step2", JSON.stringify(step2Data))
    setCurrentStep(3)
  }

  async function handleSubmitPayment() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/certification/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          applicantNote,
          isOnlineReview,
          bankAccountName,
          bankAccountNumber,
          bankName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error ?? "Đã xảy ra lỗi. Vui lòng thử lại.")
        if (data.redirectTo) {
          setTimeout(() => router.push(data.redirectTo), 2000)
        }
        return
      }
      setCertBankInfo(data.bankInfo)
    } catch {
      setSubmitError("Không thể kết nối. Vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-brand-900 mb-6 text-center">
        Nộp đơn chứng nhận sản phẩm
      </h1>

      <StepIndicator current={currentStep} />

      {/* STEP 1: Select product */}
      {currentStep === 1 && (
        <div className="bg-white border border-brand-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-brand-900">
            Chọn sản phẩm cần chứng nhận
          </h2>

          {productsLoading ? (
            <p className="text-brand-400 text-sm">Đang tải sản phẩm...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-brand-500 text-sm">
                Bạn chưa có sản phẩm nào. Hãy thêm sản phẩm trước khi nộp đơn.
              </p>
              <Link
                href="/san-pham/tao-moi"
                className="inline-block bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-800 transition-colors"
              >
                + Tạo sản phẩm mới
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const isBlocked = ACTIVE_CERT_STATUSES.includes(product.certStatus)
                return (
                  <label
                    key={product.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 transition-all",
                      isBlocked
                        ? "border-brand-200 bg-brand-50 opacity-60 cursor-not-allowed"
                        : selectedProductId === product.id
                        ? "border-brand-600 bg-brand-50 cursor-pointer"
                        : "border-brand-200 bg-white hover:border-brand-400 cursor-pointer"
                    )}
                  >
                    <input
                      type="radio"
                      name="product"
                      value={product.id}
                      disabled={isBlocked}
                      checked={selectedProductId === product.id}
                      onChange={() => setSelectedProductId(product.id)}
                      className="mt-1 accent-brand-600"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-brand-900 text-sm">
                        {product.name}
                      </p>
                      {isBlocked ? (
                        <p className="text-sm text-brand-500 mt-0.5">
                          Đang trong quá trình xét duyệt
                        </p>
                      ) : (
                        <p className="text-xs text-brand-500 mt-0.5">
                          Trạng thái: {product.certStatus}
                        </p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleStep1Next}
              disabled={!selectedProductId}
              className="bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp theo →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Documents & info */}
      {currentStep === 2 && (
        <div className="bg-white border border-brand-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-brand-900">
            Hồ sơ & Tài liệu
          </h2>

          {/* Applicant note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-700">
              Ghi chú cho admin
            </label>
            <textarea
              value={applicantNote}
              onChange={(e) => setApplicantNote(e.target.value)}
              rows={4}
              placeholder="Mô tả thêm về sản phẩm, quy trình sản xuất, nguồn gốc..."
              className="w-full rounded-lg border border-brand-300 px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Review method */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-700">
              Hình thức xét duyệt
            </p>
            <div className="flex gap-4">
              {[
                { value: true, label: "Online" },
                { value: false, label: "Offline (gửi mẫu)" },
              ].map((opt) => (
                <label
                  key={String(opt.value)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reviewMethod"
                    checked={isOnlineReview === opt.value}
                    onChange={() => setIsOnlineReview(opt.value)}
                    className="accent-brand-600"
                  />
                  <span className="text-sm text-brand-800">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* File upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-700">
              Tài liệu đính kèm
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="block w-full text-sm text-brand-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-100 file:text-brand-700 file:font-medium hover:file:bg-brand-200 cursor-pointer"
            />
            <p className="text-sm text-brand-500">
              Hỗ trợ: PDF, JPG, PNG (tối đa 10MB mỗi file)
            </p>
          </div>

          {/* Refund bank info */}
          <div className="space-y-3 bg-brand-50 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <span className="text-base">🏦</span>
              <div>
                <p className="text-sm font-semibold text-brand-800">
                  Thông tin hoàn phí
                </p>
                <p className="text-xs text-brand-500 mt-0.5">
                  Thông tin này dùng để hoàn phí nếu đơn bị từ chối.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-brand-700">
                  Tên chủ tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="NGUYEN VAN A"
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500",
                    step2Errors.bankAccountName
                      ? "border-red-400 bg-red-50"
                      : "border-brand-300 bg-white"
                  )}
                />
                {step2Errors.bankAccountName && (
                  <p className="text-xs text-red-600">
                    {step2Errors.bankAccountName}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-brand-700">
                  Số tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="0123456789"
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500",
                    step2Errors.bankAccountNumber
                      ? "border-red-400 bg-red-50"
                      : "border-brand-300 bg-white"
                  )}
                />
                {step2Errors.bankAccountNumber && (
                  <p className="text-xs text-red-600">
                    {step2Errors.bankAccountNumber}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-brand-700">
                  Ngân hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Vietcombank, Techcombank..."
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500",
                    step2Errors.bankName
                      ? "border-red-400 bg-red-50"
                      : "border-brand-300 bg-white"
                  )}
                />
                {step2Errors.bankName && (
                  <p className="text-xs text-red-600">{step2Errors.bankName}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="text-brand-600 px-4 py-2.5 rounded-lg font-medium hover:bg-brand-50 transition-colors border border-brand-200"
            >
              ← Quay lại
            </button>
            <button
              onClick={handleStep2Next}
              className="bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-800 transition-colors"
            >
              Tiếp theo →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment summary */}
      {currentStep === 3 && (
        <div className="bg-white border border-brand-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-brand-900">
            Xác nhận & Thanh toán
          </h2>

          {/* Summary card — only shown before bank info is loaded */}
          {!certBankInfo && !certDone && (
            <>
              <div className="bg-brand-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-600">Sản phẩm</span>
                  <span className="font-semibold text-brand-900">
                    {selectedProduct?.name ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-600">Hình thức xét duyệt</span>
                  <span className="font-semibold text-brand-900">
                    {isOnlineReview ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-600">Tài khoản hoàn phí</span>
                  <span className="font-semibold text-brand-900 text-right max-w-48 truncate">
                    {bankAccountName} — {bankName}
                  </span>
                </div>
                <div className="border-t border-brand-200 pt-3 flex justify-between">
                  <span className="text-brand-700 font-semibold">
                    Phí xét duyệt
                  </span>
                  <span className="text-brand-900 font-bold text-lg">
                    {CERT_FEE.toLocaleString("vi-VN")} VND
                  </span>
                </div>
              </div>

              <p className="text-xs text-brand-500">
                Sau khi thanh toán thành công, đơn sẽ được ghi nhận và chúng tôi
                sẽ liên hệ với bạn trong 3–5 ngày làm việc. Phí được hoàn lại nếu
                đơn bị từ chối.
              </p>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-brand-600 px-4 py-2.5 rounded-lg font-medium hover:bg-brand-50 transition-colors border border-brand-200"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleSubmitPayment}
                  disabled={submitting}
                  className="bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? "Đang xử lý..." : "Gửi yêu cầu & Xem hướng dẫn CK"}
                </button>
              </div>
            </>
          )}

          {/* Bank transfer info card */}
          {certBankInfo && !certDone && (
            <div className="bg-white border-2 border-brand-300 rounded-2xl p-6 space-y-5">
              <h3 className="font-semibold text-brand-800">Hướng dẫn chuyển khoản phí xét duyệt</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-brand-200">
                  <span className="text-brand-500">Ngân hàng</span>
                  <span className="font-semibold text-brand-900">{certBankInfo.bankName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-brand-200">
                  <span className="text-brand-500">Số tài khoản</span>
                  <span className="font-semibold text-brand-900 font-mono">{certBankInfo.accountNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-brand-200">
                  <span className="text-brand-500">Chủ tài khoản</span>
                  <span className="font-semibold text-brand-900">{certBankInfo.accountName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-brand-200">
                  <span className="text-brand-500">Số tiền</span>
                  <span className="font-bold text-brand-700 text-base">{formatVND(certBankInfo.amount)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-brand-500">Nội dung CK</span>
                  <span className="font-bold text-brand-900 font-mono bg-brand-50 px-2 py-0.5 rounded">{certBankInfo.description}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                ⚠️ Nhập đúng nội dung CK. Đơn chứng nhận sẽ được xét duyệt sau khi admin xác nhận thanh toán.
              </div>

              <button
                onClick={() => {
                  sessionStorage.removeItem("cert_step1")
                  sessionStorage.removeItem("cert_step2")
                  setCertDone(true)
                }}
                className="w-full bg-brand-700 text-white rounded-xl py-3 font-semibold hover:bg-brand-800 transition-colors"
              >
                Tôi đã chuyển khoản ✓
              </button>
            </div>
          )}

          {/* Done state */}
          {certDone && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-xl font-semibold text-green-800">Đơn đã được ghi nhận!</h2>
              <p className="text-sm text-green-700">Admin sẽ xác nhận thanh toán trong 1–2 ngày làm việc. Sau đó đơn sẽ được đưa vào xét duyệt.</p>
              <Link href="/thanh-toan/lich-su" className="inline-block bg-green-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-green-800 transition-colors">
                Xem lịch sử thanh toán
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
