"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function ContactForm() {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof fields>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")

  function validate() {
    const errs: Partial<typeof fields> = {}
    if (!fields.name.trim()) errs.name = "Vui lòng nhập họ tên."
    if (!fields.email.trim()) {
      errs.email = "Vui lòng nhập email."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errs.email = "Địa chỉ email không hợp lệ."
    }
    if (!fields.message.trim()) errs.message = "Vui lòng nhập nội dung."
    return errs
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof typeof fields]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setServerError(json.error ?? "Không thể gửi liên hệ. Vui lòng thử lại.")
        return
      }
      setSubmitted(true)
    } catch {
      setServerError("Không thể gửi liên hệ. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-green-200 bg-green-50 p-10 text-center">
        <div className="mb-3 text-4xl">✅</div>
        <h3 className="text-lg font-bold text-green-800">Gửi thành công!</h3>
        <p className="mt-2 text-sm text-green-700">
          Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 1-2 ngày làm việc.
        </p>
        <button
          onClick={() => {
            setSubmitted(false)
            setFields({ name: "", email: "", phone: "", message: "" })
          }}
          className="mt-5 text-sm font-medium text-green-700 underline underline-offset-2 hover:text-green-900"
        >
          Gửi tin nhắn khác
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-brand-800 mb-1">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          id="name" name="name" type="text" autoComplete="name"
          value={fields.name} onChange={handleChange} placeholder="Nguyễn Văn A"
          className={cn(
            "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors",
            "placeholder:text-brand-400 text-brand-900",
            errors.name ? "border-red-400 bg-red-50 focus:border-red-500" : "border-brand-200 bg-white focus:border-brand-500",
          )}
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-brand-800 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email" name="email" type="email" autoComplete="email"
          value={fields.email} onChange={handleChange} placeholder="email@example.com"
          className={cn(
            "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors",
            "placeholder:text-brand-400 text-brand-900",
            errors.email ? "border-red-400 bg-red-50 focus:border-red-500" : "border-brand-200 bg-white focus:border-brand-500",
          )}
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-brand-800 mb-1">
          Số điện thoại
        </label>
        <input
          id="phone" name="phone" type="tel" autoComplete="tel"
          value={fields.phone} onChange={handleChange} placeholder="0901 234 567"
          className="w-full rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 outline-none placeholder:text-brand-400 transition-colors focus:border-brand-500"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-brand-800 mb-1">
          Nội dung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message" name="message" rows={5}
          value={fields.message} onChange={handleChange} placeholder="Nhập nội dung liên hệ..."
          className={cn(
            "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors resize-none",
            "placeholder:text-brand-400 text-brand-900",
            errors.message ? "border-red-400 bg-red-50 focus:border-red-500" : "border-brand-200 bg-white focus:border-brand-500",
          )}
        />
        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
      </div>
      <button
        type="submit" disabled={loading}
        className={cn(
          "w-full rounded-lg bg-brand-700 px-6 py-3 text-base font-semibold text-white",
          "transition-colors hover:bg-brand-800 active:bg-brand-900",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {loading ? "Đang gửi..." : "Gửi liên hệ"}
      </button>
    </form>
  )
}
