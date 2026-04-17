"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

type FormState = {
  name: string
  email: string
  phone: string
  companyName: string
  serviceType: string
  requirements: string
  targetKeywords: string
  referenceUrl: string
  budget: string
  deadline: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const SEO_SUGGESTIONS = [
  "trầm hương Khánh Hòa",
  "trầm hương tự nhiên",
  "mua trầm hương uy tín",
  "tinh dầu trầm hương",
  "nhang trầm hương",
  "trầm hương Quảng Nam",
  "vòng trầm hương",
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9]{9,11}$/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeValidator(t: any) {
  return function validateField(name: keyof FormState, value: string): string {
    switch (name) {
      case "name":
        return !value ? t("nameRequired") : value.trim().length < 2 ? t("nameMin") : ""
      case "email":
        return !value ? t("emailRequired") : !EMAIL_RE.test(value) ? t("emailInvalid") : ""
      case "phone":
        return !value ? t("phoneRequired") : !PHONE_RE.test(value) ? t("phoneInvalid") : ""
      case "serviceType":
        return !value ? t("serviceRequired") : ""
      case "requirements":
        return !value ? t("requirementsRequired") : value.length < 50 ? t("requirementsMin", { count: value.length }) : ""
      default:
        return ""
    }
  }
}

export function MediaOrderForm() {
  const t = useTranslations("mediaOrderForm")
  const validateField = makeValidator(t)

  const serviceOptions = [
    { value: "ARTICLE_COMPANY", label: t("svcArticleCompany") },
    { value: "ARTICLE_PRODUCT", label: t("svcArticleProduct") },
    { value: "PRESS_RELEASE", label: t("svcPressRelease") },
    { value: "SOCIAL_CONTENT", label: t("svcSocialContent") },
  ]

  const budgetOptions = [
    t("budgetUnder5"),
    t("budget5to10"),
    t("budget10to20"),
    t("budgetOver20"),
    t("budgetNegotiate"),
  ]

  const [form, setForm] = useState<FormState>({
    name: "", email: "", phone: "", companyName: "",
    serviceType: "", requirements: "", targetKeywords: "",
    referenceUrl: "", budget: "", deadline: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [orderRef, setOrderRef] = useState("")
  const [serverError, setServerError] = useState("")

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    const err = validateField(name as keyof FormState, value)
    setErrors((prev) => ({ ...prev, [name]: err }))
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: validateField(name as keyof FormState, value) }))
  }

  function addKeyword(kw: string) {
    const current = form.targetKeywords
    if (current.includes(kw)) return
    setForm((prev) => ({
      ...prev,
      targetKeywords: current ? `${current}, ${kw}` : kw,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")

    const required: (keyof FormState)[] = ["name", "email", "phone", "serviceType", "requirements"]
    const newErrors: FormErrors = {}
    let hasError = false
    for (const field of required) {
      const err = validateField(field, form[field])
      if (err) { newErrors[field] = err; hasError = true }
    }
    if (hasError) { setErrors(newErrors); return }

    setLoading(true)
    try {
      const res = await fetch("/api/media-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setOrderRef(data.orderRef ?? "")
        setSubmitted(true)
      } else {
        setServerError(data.error ?? t("submitError"))
      }
    } catch {
      setServerError(t("submitError"))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-3">
        <p className="text-2xl">✅</p>
        <p className="font-semibold text-green-800 text-lg">{t("successTitle")}</p>
        {orderRef && <p className="text-sm text-green-700">{t("referenceCode")} <span className="font-mono font-bold">{orderRef}</span></p>}
        <p className="text-green-700 text-sm">{t("successDesc")} {form.email}.</p>
      </div>
    )
  }

  const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
  const labelClass = "block text-sm font-medium text-foreground mb-1"
  const errorClass = "text-xs text-red-600 mt-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm">{serverError}</div>
      )}

      {/* Contact info section */}
      <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide">{t("contactInfo")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="order-name" className={labelClass}>{t("nameLabel")} <span className="text-red-500">*</span></label>
          <input id="order-name" type="text" name="name" value={form.name} onChange={handleChange} onBlur={handleBlur} placeholder={t("namePlaceholder")} className={inputClass} />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="order-companyName" className={labelClass}>{t("companyLabel")}</label>
          <input id="order-companyName" type="text" name="companyName" value={form.companyName} onChange={handleChange} placeholder={t("companyPlaceholder")} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="order-email" className={labelClass}>{t("emailLabel")} <span className="text-red-500">*</span></label>
          <input id="order-email" type="email" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur} placeholder="email@example.com" className={inputClass} />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="order-phone" className={labelClass}>{t("phoneLabel")} <span className="text-red-500">*</span></label>
          <input id="order-phone" type="tel" name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur} placeholder="0901234567" className={inputClass} />
          {errors.phone && <p className={errorClass}>{errors.phone}</p>}
        </div>
      </div>

      {/* Service request section */}
      <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide pt-2">{t("serviceSection")}</p>

      <div>
        <label htmlFor="order-serviceType" className={labelClass}>{t("serviceLabel")} <span className="text-red-500">*</span></label>
        <select id="order-serviceType" name="serviceType" value={form.serviceType} onChange={handleChange} onBlur={handleBlur} className={inputClass}>
          <option value="">{t("serviceDefault")}</option>
          {serviceOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {errors.serviceType && <p className={errorClass}>{errors.serviceType}</p>}
      </div>

      <div>
        <label htmlFor="order-requirements" className={labelClass}>{t("requirementsLabel")} <span className="text-red-500">*</span></label>
        <textarea
          id="order-requirements" name="requirements" value={form.requirements} onChange={handleChange} onBlur={handleBlur}
          placeholder={t("requirementsPlaceholder")}
          rows={5} className={inputClass}
        />
        {errors.requirements && <p className={errorClass}>{errors.requirements}</p>}
      </div>

      <div>
        <label htmlFor="order-targetKeywords" className={labelClass}>{t("seoLabel")}</label>
        <input id="order-targetKeywords" type="text" name="targetKeywords" value={form.targetKeywords} onChange={handleChange} placeholder={t("seoPlaceholder")} className={inputClass} />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {SEO_SUGGESTIONS.map((kw) => (
            <button key={kw} type="button" onClick={() => addKeyword(kw)} className="text-sm bg-brand-50 text-brand-600 border border-brand-200 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors">
              + {kw}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="order-referenceUrl" className={labelClass}>{t("refUrlLabel")}</label>
        <input id="order-referenceUrl" type="url" name="referenceUrl" value={form.referenceUrl} onChange={handleChange} placeholder="https://..." className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="order-budget" className={labelClass}>{t("budgetLabel")}</label>
          <select id="order-budget" name="budget" value={form.budget} onChange={handleChange} className={inputClass}>
            <option value="">{t("budgetDefault")}</option>
            {budgetOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="order-deadline" className={labelClass}>{t("deadlineLabel")}</label>
          <input id="order-deadline" type="date" name="deadline" value={form.deadline} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-700 text-brand-100 font-semibold py-3 text-sm hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? t("submitting") : t("submitBtn")}
      </button>
    </form>
  )
}
