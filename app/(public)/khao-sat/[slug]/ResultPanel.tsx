"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { TierComparisonTable } from "@/components/features/survey/TierComparisonTable"

interface Contact {
  name: string
  email: string
  phone: string
  companyName: string
  logoUrl: string
}

interface Props {
  slug: string
  recommendedTier: string
  contact: Contact
}

const TIER_LABEL: Record<string, string> = {
  GOLD: "Hội viên Vàng",
  SILVER: "Hội viên Bạc",
  BASIC: "Hội viên cơ bản",
}

export function ResultPanel({ slug, recommendedTier, contact }: Props) {
  const tierLabel = TIER_LABEL[recommendedTier] ?? TIER_LABEL.BASIC
  const [note, setNote] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showToast, setShowToast] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowToast(false), 5000)
    return () => clearTimeout(t)
  }, [])

  async function sendConsultation() {
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/tu-van", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: contact.name,
          phone: contact.phone,
          email: contact.email,
          companyName: contact.companyName || undefined,
          note,
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
    <div className="space-y-8 relative">
      {/* Toast cảm ơn — hiện 5s rồi tự ẩn */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-2 fade-in"
        >
          <div className="flex items-start gap-3 rounded-xl border-2 border-emerald-300 bg-white shadow-xl p-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-800">Khảo sát đã gửi thành công!</p>
              <p className="text-sm text-brand-600 mt-0.5">
                Cảm ơn {contact.name.split(" ").slice(-1)[0]} đã dành thời gian đồng hành cùng Hội Trầm Hương VN 🌿
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-brand-400 hover:text-brand-600 text-xl leading-none"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-amber-600 p-8 text-white shadow-xl text-center">
        <p className="text-sm uppercase tracking-wider opacity-90">Cảm ơn {contact.name}!</p>
        <h2 className="text-3xl font-bold mt-2">Dựa trên câu trả lời của bạn</h2>
        <p className="mt-3 text-lg">
          Gói phù hợp: <span className="font-bold text-amber-200 text-2xl">{tierLabel}</span>
        </p>
      </div>

      {/* Tier comparison highlight recommended */}
      <TierComparisonTable recommended={recommendedTier as "BASIC" | "SILVER" | "GOLD"} />

      {/* Consultation CTA */}
      {!submitted ? (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 p-6">
          <h3 className="text-xl font-bold text-brand-900">
            Muốn tìm hiểu chi tiết phí &amp; quy trình nâng cấp gói {tierLabel}?
          </h3>
          <p className="text-sm text-brand-700 mt-2">
            Để lại ghi chú cho Ban Quản trị Hội — chúng tôi sẽ liên hệ bạn qua <strong>{contact.phone}</strong> / <strong>{contact.email}</strong> để tư vấn cụ thể.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú thêm (tùy chọn) — VD: Tôi muốn được tư vấn riêng về xuất khẩu Trung Đông..."
            rows={3}
            className="w-full rounded-md border border-brand-300 px-3 py-2 text-sm mt-4"
          />

          {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 mt-3">{error}</div>}

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={sendConsultation}
              disabled={submitting}
              className="rounded-md bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Đăng ký tư vấn"}
            </button>
            <Link
              href="/"
              className="rounded-md border border-brand-300 px-6 py-3 text-sm font-medium text-brand-700 hover:bg-white text-center"
            >
              Để sau
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-8 text-center">
          <div className="text-5xl mb-3">✓</div>
          <h3 className="text-2xl font-bold text-emerald-800">Đã ghi nhận!</h3>
          <p className="text-sm text-emerald-700 mt-2 max-w-md mx-auto">
            Ban Quản trị Hội Trầm Hương Việt Nam sẽ liên hệ với bạn trong vòng 2-3 ngày làm việc
            qua số <strong>{contact.phone}</strong>.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/" className="rounded-md bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
              Về trang chủ
            </Link>
            <Link href="/landing" className="rounded-md border border-brand-300 px-6 py-2.5 text-sm font-medium text-brand-700 hover:bg-white">
              Tìm hiểu Hội Trầm Hương VN
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
