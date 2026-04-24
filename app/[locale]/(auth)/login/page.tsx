"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations("auth")
  const locale = useLocale()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError(t("fillAllFields"))
      return
    }
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError(t("invalidCredentials"))
      } else {
        // Khách hàng yêu cầu: mọi role login thành công đều về trang chủ
        // viewer mode trước. Admin tự điều hướng vào /admin, VIP vào
        // /tong-quan, từ menu sau khi vào.
        router.push(`/${locale}`)
      }
    } catch {
      setError(t("genericError"))
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleLogin() {
    setGoogleLoading(true)
    // Cùng rule: Google login cũng về homepage viewer mode.
    signIn("google", { callbackUrl: `/${locale}` })
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-brand-200 p-8 space-y-6">
      <div>
        <h2 className="text-brand-900 text-2xl font-bold text-center">
          {t("loginTitle")}
        </h2>
        <p className="text-brand-500 text-sm text-center mt-1">{t("welcome")}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Google login button */}
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-50 hover:border-brand-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {googleLoading ? t("redirecting") : t("loginWithGoogle")}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-brand-200" />
        <span className="text-xs text-brand-400">{t("orLoginWithEmail")}</span>
        <div className="flex-1 h-px bg-brand-200" />
      </div>

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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-brand-800">
              {t("password")}
            </label>
            <a
              href={`/${locale}/quen-mat-khau`}
              className="text-xs text-brand-700 font-medium hover:underline"
            >
              {t("forgotPassword")}
            </a>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 transition-shadow"
          />
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full rounded-xl bg-brand-700 text-white font-semibold py-3 text-sm hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? t("loggingIn") : t("loginTitle")}
        </button>
      </form>

      <p className="text-center text-sm text-brand-500">
        {t("noAccount")}{" "}
        <a href={`/${locale}/dang-ky`} className="text-brand-700 font-medium hover:underline">
          {t("registerTitle")}
        </a>
      </p>
    </div>
  )
}
