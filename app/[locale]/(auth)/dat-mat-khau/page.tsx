"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"

export default function SetPasswordPage() {
  const t = useTranslations("auth")

  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl shadow-lg border border-brand-200 p-8 text-center">
          <p className="text-brand-400">{t("redirecting")}</p>
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  )
}

function SetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("auth")
  const locale = useLocale()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [success, setSuccess] = useState(false)

  // Validate token on mount
  useEffect(() => {
    if (!token || !email) {
      setError(t("invalidLink"))
      setValidating(false)
      return
    }
    fetch(`/api/auth/verify-token?token=${token}&email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setTokenValid(true)
        } else {
          setError(data.error ?? t("linkExpired"))
        }
      })
      .catch(() => setError(t("genericError")))
      .finally(() => setValidating(false))
  }, [token, email, t])

  const strength = getPasswordStrength(password, t)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError(t("minChars"))
      return
    }
    if (password !== confirm) {
      setError(t("passwordMismatch"))
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? t("genericError"))
        return
      }

      setSuccess(true)

      // Auto login after password set
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      // Brief pause so user sees success state
      await new Promise((r) => setTimeout(r, 1500))

      if (signInResult?.error) {
        router.push(`/${locale}/login`)
      } else {
        router.push("/tong-quan")
      }
    } catch {
      setError(t("genericError"))
    } finally {
      setLoading(false)
    }
  }

  // ── Validating state ──────────────────────────────────────────────
  if (validating) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-brand-200 p-8 text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-brand-300 border-t-brand-700 animate-spin mx-auto" />
        <p className="text-brand-500 text-sm">{t("redirecting")}</p>
      </div>
    )
  }

  // ── Invalid token state ───────────────────────────────────────────
  if (!tokenValid) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-brand-200 p-8 space-y-5 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-3xl">!</span>
        </div>
        <div>
          <h2 className="text-brand-900 text-xl font-bold">{t("invalidLink")}</h2>
          <p className="text-sm text-brand-500 mt-2">{error || t("linkExpired")}</p>
        </div>
        <div className="bg-brand-50 rounded-xl p-4 text-sm text-brand-600 space-y-1">
          <p className="font-medium">{t("needNewLink")}</p>
          <p>{t("contactAdmin")}</p>
        </div>
        <Link
          href={`/${locale}/login`}
          className="inline-block text-sm text-brand-600 hover:text-brand-800 font-medium"
        >
          {t("backToLogin")}
        </Link>
      </div>
    )
  }

  // ── Success state ─────────────────────────────────────────────────
  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-brand-200 p-8 space-y-5 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-brand-900 text-xl font-bold">{t("activationSuccess")}</h2>
          <p className="text-sm text-brand-500 mt-2">{t("redirectingToSystem")}</p>
        </div>
        <div className="w-8 h-8 rounded-full border-2 border-brand-300 border-t-brand-700 animate-spin mx-auto" />
      </div>
    )
  }

  // ── Password form ─────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-brand-200 p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-brand-900 text-2xl font-bold">{t("setPassword")}</h2>
        <p className="text-brand-500 text-sm mt-1">
          {t("welcomeJoin")}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label htmlFor="email-display" className="block text-sm font-medium text-brand-800">
            {t("email")}
          </label>
          <input
            id="email-display"
            type="email"
            value={email ?? ""}
            disabled
            className="w-full rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-500 cursor-not-allowed"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-brand-800">
            {t("newPassword")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("minChars")}
            autoComplete="new-password"
            className="w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 transition-shadow"
          />
          {/* Strength indicator */}
          {password.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      strength.level >= level ? strength.color : "bg-brand-100"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm" className="block text-sm font-medium text-brand-800">
            {t("confirmPassword")}
          </label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t("reenterPassword")}
            autoComplete="new-password"
            className="w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 transition-shadow"
          />
          {confirm.length > 0 && password !== confirm && (
            <p className="text-xs text-red-500 mt-1">{t("passwordMismatch")}</p>
          )}
          {confirm.length >= 8 && password === confirm && (
            <p className="text-xs text-green-600 mt-1">{t("passwordMatch")}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || password.length < 8 || password !== confirm}
          className="w-full rounded-xl bg-brand-700 text-white font-semibold py-3 text-sm hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "..." : t("activateAccount")}
        </button>
      </form>

      <p className="text-center text-xs text-brand-400">
        {t("activateNote")}
      </p>
    </div>
  )
}

// ── Password strength helper ──────────────────────────────────────────

function getPasswordStrength(
  pwd: string,
  t: (key: string) => string,
): {
  level: number
  label: string
  color: string
  textColor: string
} {
  if (pwd.length === 0) return { level: 0, label: "", color: "", textColor: "" }
  if (pwd.length < 8) return { level: 1, label: t("strengthWeak"), color: "bg-red-400", textColor: "text-red-500" }

  let score = 0
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++
  if (pwd.length >= 12) score++

  if (score >= 3) return { level: 3, label: t("strengthStrong"), color: "bg-green-500", textColor: "text-green-600" }
  if (score >= 1) return { level: 2, label: t("strengthMedium"), color: "bg-yellow-400", textColor: "text-yellow-600" }
  return { level: 1, label: t("strengthWeak"), color: "bg-red-400", textColor: "text-red-500" }
}
