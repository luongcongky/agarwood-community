"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function TaoMoiVIPPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
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

      router.push("/admin/hoi-vien")
      router.refresh()
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/hoi-vien"
          className="text-brand-600 hover:text-brand-800 text-sm"
        >
          &larr; Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">
          Tạo tài khoản VIP
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border bg-white p-6 shadow-sm space-y-4"
      >
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-brand-800 mb-1">
            Họ và tên *
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-800 mb-1">
            Email *
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-800 mb-1">
            Số điện thoại
          </label>
          <input
            type="tel"
            name="phone"
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-800 mb-1">
            Mật khẩu tạm thời *
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Đang tạo..." : "Tạo tài khoản"}
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
