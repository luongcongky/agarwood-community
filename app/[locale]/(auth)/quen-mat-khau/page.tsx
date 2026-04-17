"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"

export default function QuenMatKhauPage() {
  const t = useTranslations("auth")
  const locale = useLocale()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email) {
      setError(t("enterEmail"))
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? t("genericError"))
        return
      }
      setSubmitted(true)
    } catch {
      setError(t("genericError"))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-brand-200 p-8 space-y-4">
        <h2 className="text-brand-900 text-2xl font-bold text-center">
          {t("checkYourEmail")}
        </h2>
        <p className="text-sm text-brand-600 text-center">
          {t("resetEmailSent")}
        </p>
        <Link
          href={`/${locale}/login`}
          className="block text-center text-brand-700 font-medium hover:underline text-sm"
        >
          {t("backToLogin")}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-brand-200 p-8 space-y-6">
      <div>
        <h2 className="text-brand-900 text-2xl font-bold text-center">
          {t("forgotPasswordTitle")}
        </h2>
        <p className="text-brand-500 text-sm text-center mt-1">
          {t("forgotPasswordDesc")}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-brand-800">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
            className="w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 transition-shadow"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-700 text-white font-semibold py-3 text-sm hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "..." : t("sendResetLinkBtn")}
        </button>
      </form>

      <p className="text-center text-sm text-brand-500">
        <Link href={`/${locale}/login`} className="text-brand-700 font-medium hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  )
}
