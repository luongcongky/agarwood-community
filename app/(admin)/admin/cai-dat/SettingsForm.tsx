"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface SettingsFormProps {
  configMap: Record<string, string>
}

const SETTINGS_GROUPS = [
  {
    title: "Thông tin Hội",
    description: "Hiển thị trên toàn bộ website",
    keys: [
      { key: "association_name", label: "Tên hội", type: "text" },
      { key: "association_email", label: "Email liên hệ chính thức", type: "email" },
      { key: "association_phone", label: "Số điện thoại", type: "tel" },
      { key: "contact_address", label: "Địa chỉ trụ sở", type: "text" },
      { key: "facebook_url", label: "Link Facebook / Zalo OA", type: "url" },
    ],
  },
  {
    title: "Phí & Giới hạn",
    description: "Thay đổi ở đây sẽ cập nhật trang /gia-han, /dich-vu, /chung-nhan/nop-don",
    keys: [
      { key: "membership_fee_min", label: "Phí membership tối thiểu (VND)", type: "number" },
      { key: "membership_fee_max", label: "Phí membership tối đa (VND)", type: "number" },
      { key: "cert_fee", label: "Phí xét duyệt chứng nhận (VND)", type: "number" },
      { key: "max_vip_accounts", label: "Số slot VIP tối đa", type: "number" },
      { key: "post_cooldown_minutes", label: "Cooldown đăng bài (phút)", type: "number" },
    ],
  },
  {
    title: "Thông tin Chuyển khoản",
    description: "Thay đổi ở đây sẽ cập nhật trang /gia-han và /chung-nhan/nop-don",
    keys: [
      { key: "bank_name", label: "Tên ngân hàng nhận", type: "text" },
      { key: "bank_account_number", label: "Số tài khoản", type: "text" },
      { key: "bank_account_name", label: "Tên chủ tài khoản", type: "text" },
      { key: "bank_branch", label: "Chi nhánh (nếu cần)", type: "text" },
    ],
  },
  {
    title: "Phí & Hạng — Cá nhân / Chuyên gia",
    description: "Áp dụng cho tài khoản loại Cá nhân (INDIVIDUAL)",
    keys: [
      { key: "individual_fee_min", label: "Phí tối thiểu (VND)", type: "number" },
      { key: "individual_fee_max", label: "Phí tối đa (VND)", type: "number" },
      { key: "individual_tier_silver", label: "Ngưỡng ★★ Bạc (VND)", type: "number" },
      { key: "individual_tier_gold", label: "Ngưỡng ★★★ Vàng (VND)", type: "number" },
    ],
  },
  {
    title: "Hạng hội viên — Doanh nghiệp",
    description: "Ngưỡng đóng góp để thăng hạng (tài khoản Doanh nghiệp)",
    keys: [
      { key: "tier_silver_threshold", label: "Ngưỡng ★★ Bạc (VND)", type: "number" },
      { key: "tier_gold_threshold", label: "Ngưỡng ★★★ Vàng (VND)", type: "number" },
      { key: "tier_silver_name", label: "Tên hiển thị hạng Bạc", type: "text" },
      { key: "tier_gold_name", label: "Tên hiển thị hạng Vàng", type: "text" },
    ],
  },
]

export function SettingsForm({ configMap }: SettingsFormProps) {
  const router = useRouter()
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
      router.refresh()
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {SETTINGS_GROUPS.map((group) => (
        <div key={group.title} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-brand-900">{group.title}</h2>
            {group.description && <p className="text-xs text-brand-400 mt-0.5">{group.description}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {group.keys.map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-brand-800 mb-1">{label}</label>
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
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
