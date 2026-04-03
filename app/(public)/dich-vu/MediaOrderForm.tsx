"use client"

import { useState } from "react"

type FormState = {
  name: string
  email: string
  phone: string
  serviceType: string
  requirements: string
  budget: string
  deadline: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const SERVICE_OPTIONS = [
  { value: "ARTICLE_COMPANY", label: "Bài viết giới thiệu doanh nghiệp" },
  { value: "ARTICLE_PRODUCT", label: "Bài viết giới thiệu sản phẩm" },
  { value: "PRESS_RELEASE", label: "Thông cáo báo chí" },
  { value: "SOCIAL_CONTENT", label: "Nội dung mạng xã hội" },
]

const BUDGET_OPTIONS = [
  "Dưới 5 triệu",
  "5-10 triệu",
  "10-20 triệu",
  "Trên 20 triệu",
  "Thương lượng",
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9]{9,11}$/

function validateField(name: keyof FormState, value: string): string {
  switch (name) {
    case "name":
      if (!value) return "Vui lòng nhập họ và tên"
      if (value.trim().length < 2) return "Tên cần ít nhất 2 ký tự"
      return ""
    case "email":
      if (!value) return "Vui lòng nhập email"
      if (!EMAIL_RE.test(value)) return "Email không hợp lệ"
      return ""
    case "phone":
      if (!value) return "Vui lòng nhập số điện thoại"
      if (!PHONE_RE.test(value)) return "Số điện thoại phải từ 9–11 chữ số"
      return ""
    case "serviceType":
      if (!value) return "Vui lòng chọn loại dịch vụ"
      return ""
    case "requirements":
      if (!value) return "Vui lòng mô tả yêu cầu"
      if (value.length < 50)
        return `Mô tả cần ít nhất 50 ký tự (hiện tại: ${value.length})`
      return ""
    default:
      return ""
  }
}

export function MediaOrderForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    serviceType: "",
    requirements: "",
    budget: "",
    deadline: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState("")

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    const err = validateField(name as keyof FormState, value)
    setErrors((prev) => ({ ...prev, [name]: err }))
  }

  function handleBlur(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    const err = validateField(name as keyof FormState, value)
    setErrors((prev) => ({ ...prev, [name]: err }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")

    // Validate all required fields
    const requiredFields: (keyof FormState)[] = [
      "name",
      "email",
      "phone",
      "serviceType",
      "requirements",
    ]
    const newErrors: FormErrors = {}
    let hasError = false
    for (const field of requiredFields) {
      const err = validateField(field, form[field])
      if (err) {
        newErrors[field] = err
        hasError = true
      }
    }
    if (hasError) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/media-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        setServerError("Có lỗi xảy ra. Vui lòng thử lại sau.")
      }
    } catch {
      setServerError("Có lỗi xảy ra. Vui lòng thử lại sau.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-semibold text-green-800 text-lg">
          Đơn hàng đã được gửi thành công!
        </p>
        <p className="text-green-700 mt-2 text-sm">
          Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.
        </p>
      </div>
    )
  }

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
  const labelClass = "block text-sm font-medium text-foreground mb-1"
  const errorClass = "text-xs text-red-600 mt-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm">
          {serverError}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="order-name" className={labelClass}>
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          id="order-name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Nguyễn Văn A"
          className={inputClass}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="order-email" className={labelClass}>
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="order-email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="email@example.com"
          className={inputClass}
        />
        {errors.email && <p className={errorClass}>{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="order-phone" className={labelClass}>
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <input
          id="order-phone"
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0901234567"
          className={inputClass}
        />
        {errors.phone && <p className={errorClass}>{errors.phone}</p>}
      </div>

      {/* Service Type */}
      <div>
        <label htmlFor="order-serviceType" className={labelClass}>
          Loại dịch vụ <span className="text-red-500">*</span>
        </label>
        <select
          id="order-serviceType"
          name="serviceType"
          value={form.serviceType}
          onChange={handleChange}
          onBlur={handleBlur}
          className={inputClass}
        >
          <option value="">-- Chọn loại dịch vụ --</option>
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.serviceType && <p className={errorClass}>{errors.serviceType}</p>}
      </div>

      {/* Requirements */}
      <div>
        <label htmlFor="order-requirements" className={labelClass}>
          Mô tả yêu cầu <span className="text-red-500">*</span>
        </label>
        <textarea
          id="order-requirements"
          name="requirements"
          value={form.requirements}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Mô tả chi tiết về sản phẩm, dịch vụ, đối tượng khách hàng, mục tiêu truyền thông... (tối thiểu 50 ký tự)"
          rows={5}
          className={inputClass}
        />
        {errors.requirements && <p className={errorClass}>{errors.requirements}</p>}
      </div>

      {/* Budget */}
      <div>
        <label htmlFor="order-budget" className={labelClass}>
          Ngân sách dự kiến
        </label>
        <select
          id="order-budget"
          name="budget"
          value={form.budget}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">-- Chọn ngân sách --</option>
          {BUDGET_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Deadline */}
      <div>
        <label htmlFor="order-deadline" className={labelClass}>
          Deadline mong muốn
        </label>
        <input
          id="order-deadline"
          type="date"
          name="deadline"
          value={form.deadline}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-700 text-brand-100 font-semibold py-3 text-sm hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Đang gửi..." : "Gửi đơn hàng"}
      </button>
    </form>
  )
}
