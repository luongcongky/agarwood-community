"use client"

import { useState } from "react"

interface SettingsFormProps {
  configMap: Record<string, string>
}

const SETTINGS_GROUPS = [
  {
    title: "Thông tin hội",
    keys: [
      { key: "contact_name", label: "Tên Ban quản trị", type: "text" },
      { key: "contact_email", label: "Email liên hệ", type: "email" },
      { key: "contact_phone", label: "Số điện thoại", type: "tel" },
      { key: "contact_address", label: "Địa chỉ", type: "text" },
    ],
  },
  {
    title: "Phí & Giới hạn",
    keys: [
      { key: "membership_fee_min", label: "Phí hội viên tối thiểu (VND)", type: "number" },
      { key: "membership_fee_max", label: "Phí hội viên tối đa (VND)", type: "number" },
      { key: "cert_fee", label: "Phí chứng nhận (VND)", type: "number" },
      { key: "max_vip_accounts", label: "Giới hạn tài khoản VIP", type: "number" },
    ],
  },
  {
    title: "Mạng xã hội",
    keys: [
      { key: "facebook_url", label: "Facebook URL", type: "url" },
      { key: "zalo_url", label: "Zalo URL", type: "url" },
    ],
  },
]

export function SettingsForm({ configMap }: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, string>>(configMap)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSaved(false)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Có lỗi xảy ra")
        return
      }

      setSaved(true)
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {SETTINGS_GROUPS.map((group) => (
        <div
          key={group.title}
          className="rounded-xl border bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-bold text-brand-900">{group.title}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {group.keys.map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-brand-800 mb-1">
                  {label}
                </label>
                <input
                  type={type}
                  value={values[key] ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Đã lưu cài đặt thành công
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>
    </form>
  )
}
