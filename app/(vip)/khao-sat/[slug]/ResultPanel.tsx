"use client"

import { useState } from "react"
import Link from "next/link"

interface Props {
  slug: string
  recommendedTier: string
  onEdit: () => void
}

const TIER_CONFIG: Record<string, { label: string; color: string; benefits: string[] }> = {
  GOLD: {
    label: "Hội viên Vàng",
    color: "from-amber-400 to-amber-600",
    benefits: [
      "Đăng bài KHÔNG GIỚI HẠN trên Cộng đồng",
      "Hiển thị Top trang chủ — ưu tiên cao nhất",
      "Banner quảng cáo độc quyền",
      "Chứng nhận sản phẩm không giới hạn",
      "Hỗ trợ truyền thông + sự kiện trực tiếp từ Hội",
      "Quyền biểu quyết, ứng cử trong Đại hội",
    ],
  },
  SILVER: {
    label: "Hội viên Bạc",
    color: "from-slate-300 to-slate-500",
    benefits: [
      "Đăng 30 bài/tháng trên Cộng đồng",
      "Hiển thị trang chủ — ưu tiên trung bình",
      "Chứng nhận tối đa 5 sản phẩm",
      "Truyền thông định kỳ từ Hội",
      "Quyền biểu quyết trong Đại hội",
    ],
  },
  BASIC: {
    label: "Hội viên cơ bản",
    color: "from-brand-400 to-brand-600",
    benefits: [
      "Đăng 15 bài/tháng",
      "Hồ sơ doanh nghiệp/cá nhân trên hệ thống",
      "Tham gia cộng đồng, kết nối hội viên khác",
    ],
  },
}

export function ResultPanel({ slug, recommendedTier, onEdit }: Props) {
  const tier = TIER_CONFIG[recommendedTier] ?? TIER_CONFIG.BASIC
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function sendConsultation(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/tu-van", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, phone, note,
          context: `survey:${slug}`,
          recommendedTier,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gửi thất bại")
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Recommendation header */}
      <div className={`rounded-2xl bg-gradient-to-r ${tier.color} p-6 text-white shadow-lg`}>
        <p className="text-sm uppercase tracking-wide opacity-90">Dựa trên câu trả lời của bạn</p>
        <h2 className="text-3xl font-bold mt-1">Gói phù hợp: {tier.label}</h2>
        <p className="mt-2 opacity-95 text-sm">
          Nâng cấp gói để khai thác tối đa lợi ích từ nền tảng số của Hội Trầm Hương Việt Nam.
        </p>
      </div>

      {/* Benefits */}
      <div className="rounded-xl border border-brand-200 bg-white p-6">
        <h3 className="font-semibold text-brand-900 mb-3">Quyền lợi gói {tier.label}</h3>
        <ul className="space-y-2">
          {tier.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-emerald-600 font-bold mt-0.5">✓</span>
              <span className="text-brand-700">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      {!showForm && !submitted && (
        <div className="rounded-xl border-2 border-brand-300 bg-brand-50 p-6 text-center">
          <h3 className="font-semibold text-brand-900 mb-2">Quan tâm đến gói {tier.label}?</h3>
          <p className="text-sm text-brand-600 mb-4">
            Đăng ký để Ban Quản trị Hội liên hệ tư vấn quyền lợi và quy trình nâng cấp.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="rounded-md bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Đăng ký tư vấn
            </button>
            <button
              onClick={onEdit}
              className="rounded-md border border-brand-300 px-6 py-3 text-sm font-medium text-brand-700 hover:bg-white"
            >
              Sửa câu trả lời
            </button>
            <Link
              href="/khao-sat"
              className="rounded-md border border-brand-300 px-6 py-3 text-sm font-medium text-brand-700 hover:bg-white text-center"
            >
              Để sau
            </Link>
          </div>
        </div>
      )}

      {showForm && !submitted && (
        <form onSubmit={sendConsultation} className="rounded-xl border border-brand-200 bg-white p-6 space-y-4">
          <h3 className="font-semibold text-brand-900">Thông tin liên hệ</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Họ và tên *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-brand-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Số điện thoại *"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-brand-300 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            placeholder="Ghi chú thêm (tùy chọn)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-brand-300 px-3 py-2 text-sm"
          />
          {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-brand-300 px-6 py-2.5 text-sm text-brand-700"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {submitted && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <h3 className="font-semibold text-emerald-800 mb-1">Đã ghi nhận ✓</h3>
          <p className="text-sm text-emerald-700">
            Ban Quản trị Hội sẽ liên hệ với bạn trong thời gian sớm nhất.
          </p>
          <Link href="/tong-quan" className="inline-block mt-4 text-sm font-semibold text-brand-700 hover:underline">
            Về tổng quan →
          </Link>
        </div>
      )}
    </div>
  )
}
