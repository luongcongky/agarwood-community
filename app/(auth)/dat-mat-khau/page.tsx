"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-card rounded-xl shadow-lg p-8 text-center"><p className="text-muted-foreground">Đang tải...</p></div>}>
      <SetPasswordForm />
    </Suspense>
  )
}

function SetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  // Validate token on mount
  useEffect(() => {
    if (!token || !email) {
      setError("Liên kết không hợp lệ.")
      setValidating(false)
      return
    }
    fetch(`/api/auth/verify-token?token=${token}&email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setTokenValid(true)
        } else {
          setError(data.error ?? "Liên kết đã hết hạn hoặc không hợp lệ.")
        }
      })
      .catch(() => setError("Không thể xác minh liên kết."))
      .finally(() => setValidating(false))
  }, [token, email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.")
      return
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.")
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
        setError(data.error ?? "Có lỗi xảy ra.")
        return
      }

      // Auto login after password set
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        router.push("/login")
      } else {
        router.push("/tong-quan")
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="bg-card rounded-xl shadow-lg p-8 text-center">
        <p className="text-muted-foreground">Đang xác minh liên kết...</p>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="bg-card rounded-xl shadow-lg p-8 space-y-4 text-center">
        <h2 className="text-brand-800 text-xl font-semibold">Liên kết không hợp lệ</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <p className="text-sm text-muted-foreground">
          Vui lòng liên hệ ban quản trị để nhận liên kết mới.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-lg p-8 space-y-6">
      <div>
        <h2 className="text-brand-800 text-2xl font-semibold text-center">
          Đặt mật khẩu
        </h2>
        <p className="text-muted-foreground text-sm text-center mt-1">
          Chào mừng bạn gia nhập Hội Trầm Hương Việt Nam!
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email-display" className="block text-sm font-medium text-foreground">Email</label>
          <input
            id="email-display"
            type="email"
            value={email ?? ""}
            disabled
            className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">Mật khẩu mới</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirm" className="block text-sm font-medium text-foreground">Xác nhận mật khẩu</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Đang xử lý..." : "Kích hoạt tài khoản"}
        </button>
      </form>
    </div>
  )
}
