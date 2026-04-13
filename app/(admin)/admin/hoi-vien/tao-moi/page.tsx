"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

type CreateMode = "password" | "invite"

export default function TaoMoiHoiVienPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [mode, setMode] = useState<CreateMode>("password")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const form = e.currentTarget
    const data: Record<string, unknown> = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value || undefined,
    }

    if (mode === "password") {
      data.password = (form.elements.namedItem("password") as HTMLInputElement).value
    } else {
      data.sendInvite = true
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Có lỗi xảy ra")
        return
      }

      const result = await res.json()
      if (result.inviteSent) {
        setSuccess(`Đã tạo tài khoản và gửi email mời đến ${data.email}`)
        form.reset()
      } else {
        router.push("/admin/hoi-vien")
        router.refresh()
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/hoi-vien" className="text-brand-600 hover:text-brand-800 text-sm">
          &larr; Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">Tạo tài khoản hội viên</h1>
      </div>

      {/* Mode selector */}
      <div className="flex gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            mode === "password" ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-100",
          )}
        >
          Tạo với mật khẩu
        </button>
        <button
          type="button"
          onClick={() => setMode("invite")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            mode === "invite" ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-100",
          )}
        >
          Gửi email mời
        </button>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">{success}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-brand-800 mb-1">Họ và tên *</label>
          <input
            type="text"
            name="name"
            required
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-800 mb-1">Email *</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-800 mb-1">Số điện thoại</label>
          <input
            type="tel"
            name="phone"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        {mode === "password" && (
          <div>
            <label className="block text-sm font-medium text-brand-800 mb-1">Mật khẩu tạm thời *</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <p className="text-xs text-brand-400 mt-1">Hội viên sẽ dùng mật khẩu này để đăng nhập lần đầu.</p>
          </div>
        )}

        {mode === "invite" && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            Hệ thống sẽ gửi email mời đến hội viên với link đặt mật khẩu. Link có hiệu lực 48 giờ.
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang tạo..." : mode === "invite" ? "Tạo & Gửi email mời" : "Tạo tài khoản"}
          </button>
          <Link
            href="/admin/hoi-vien"
            className="rounded-lg border border-brand-300 px-5 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
          >
            Huỷ
          </Link>
        </div>
      </form>
    </div>
  )
}
