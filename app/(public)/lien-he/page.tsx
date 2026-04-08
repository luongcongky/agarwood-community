"use client"

import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

// ── Contact Form (client component) ─────────────────────────────────────────

function ContactForm() {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof fields>>({})

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof typeof fields]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-green-200 bg-green-50 p-10 text-center">
        <div className="mb-3 text-4xl">✅</div>
        <h3 className="text-lg font-bold text-green-800">
          Gửi thành công!
        </h3>
        <p className="mt-2 text-sm text-green-700">
          Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 1-2 ngày
          làm việc.
        </p>
        <button
          type="button"
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
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-brand-800 mb-1"
        >
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={fields.name}
          onChange={handleChange}
          placeholder="Nguyễn Văn A"
          className={cn(
            "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors",
            "placeholder:text-brand-400 text-brand-900",
            errors.name
              ? "border-red-400 bg-red-50 focus:border-red-500"
              : "border-brand-200 bg-white focus:border-brand-500"
          )}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-brand-800 mb-1"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={handleChange}
          placeholder="email@example.com"
          className={cn(
            "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors",
            "placeholder:text-brand-400 text-brand-900",
            errors.email
              ? "border-red-400 bg-red-50 focus:border-red-500"
              : "border-brand-200 bg-white focus:border-brand-500"
          )}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-brand-800 mb-1"
        >
          Số điện thoại
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={fields.phone}
          onChange={handleChange}
          placeholder="0901 234 567"
          className="w-full rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 outline-none placeholder:text-brand-400 transition-colors focus:border-brand-500"
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-brand-800 mb-1"
        >
          Nội dung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={fields.message}
          onChange={handleChange}
          placeholder="Nhập nội dung liên hệ..."
          className={cn(
            "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors resize-none",
            "placeholder:text-brand-400 text-brand-900",
            errors.message
              ? "border-red-400 bg-red-50 focus:border-red-500"
              : "border-brand-200 bg-white focus:border-brand-500"
          )}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-500">{errors.message}</p>
        )}
      </div>

      <button
        type="submit"
        className={cn(
          "w-full rounded-lg bg-brand-700 px-6 py-3 text-base font-semibold text-white",
          "transition-colors hover:bg-brand-800 active:bg-brand-900"
        )}
      >
        Gửi liên hệ
      </button>
    </form>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LienHePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-brand-800 text-white py-16">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="mb-4 text-sm text-brand-300" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Liên hệ</span>
          </nav>
          <h1 className="text-3xl font-bold sm:text-4xl">Liên hệ với chúng tôi</h1>
          <p className="mt-3 text-brand-200 max-w-xl">
            Chúng tôi luôn sẵn sàng hỗ trợ và giải đáp mọi thắc mắc của bạn.
          </p>
        </div>
      </section>

      {/* ── Contact Info + Form ── */}
      <section className="bg-brand-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-start">
            {/* Left: Contact info */}
            <div>
              <h2 className="text-xl font-bold text-brand-900 mb-6">
                Thông tin liên hệ
              </h2>

              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-xl">📞</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">
                      Điện thoại
                    </p>
                    <a
                      href="tel:+842812345678"
                      className="text-brand-800 font-medium hover:text-brand-600 hover:underline"
                    >
                      028 1234 5678
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-xl">📧</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">
                      Email
                    </p>
                    <a
                      href="mailto:hoitramhuong@vietnam.vn"
                      className="text-brand-800 font-medium hover:text-brand-600 hover:underline break-all"
                    >
                      hoitramhuong@vietnam.vn
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-xl">📍</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">
                      Địa chỉ
                    </p>
                    <p className="text-brand-800 font-medium">
                      123 Đường Trầm Hương, Quận 1,
                      <br />
                      TP. Hồ Chí Minh
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-xl">🕐</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">
                      Giờ làm việc
                    </p>
                    <p className="text-brand-800 font-medium">
                      Thứ 2 - Thứ 6: 8:00 - 17:00
                    </p>
                  </div>
                </li>
              </ul>

              {/* Social links */}
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-3">
                  Mạng xã hội
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white",
                      "px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                    )}
                  >
                    Facebook
                  </a>
                  <a
                    href="https://zalo.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white",
                      "px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                    )}
                  >
                    Zalo
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Quick form */}
            <div className="rounded-xl border border-brand-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-brand-900 mb-6">
                Gửi tin nhắn nhanh
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Map ── */}
      <section className="bg-white pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-xl border border-brand-200 shadow-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125411.87690118406!2d106.62966155!3d10.7544272!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4670702e31%3A0xa25c43e2beaadca4!2zVFAuIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1svi!2svn!4v1700000000000"
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              allow=""
              title="Bản đồ trụ sở Hội Trầm Hương Việt Nam"
            />
          </div>
        </div>
      </section>
    </>
  )
}
