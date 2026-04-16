"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"

interface Props {
  /** Loại tài khoản user đã chọn trên radio — lưu vào cookie để lib/auth.ts đọc
   *  khi tạo user mới qua Google OAuth. */
  accountType?: "BUSINESS" | "INDIVIDUAL"
}

export function GoogleSignUpButton({ accountType = "BUSINESS" }: Props) {
  const [loading, setLoading] = useState(false)

  function handleClick() {
    setLoading(true)
    // Ghi cookie để signIn callback trong lib/auth.ts biết loại tài khoản
    // user đã chọn khi tạo user mới từ Google OAuth. Cookie sống 10 phút
    // (đủ cho flow OAuth redirect về), SameSite=Lax để giữ qua redirect.
    document.cookie = `pending_account_type=${accountType}; Path=/; Max-Age=600; SameSite=Lax`
    // prompt=select_account bắt Google hiện picker để user chọn account
    // đăng ký, thay vì auto-login account cũ đang cached trong trình duyệt.
    signIn("google", { callbackUrl: "/tong-quan" }, { prompt: "select_account" })
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-brand-200 bg-white px-4 py-3 text-sm font-medium text-brand-800 hover:bg-brand-50 hover:border-brand-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {loading ? "Đang chuyển hướng..." : `Đăng ký bằng Google (${accountType === "INDIVIDUAL" ? "Cá nhân" : "Doanh nghiệp"})`}
      </button>

      <p className="text-xs text-brand-400 text-center">
        Tài khoản Google sẽ được kích hoạt ngay sau khi đăng ký.
        Bạn có thể bắt đầu chia sẻ bài viết trên cộng đồng ngay lập tức.
      </p>
    </div>
  )
}
