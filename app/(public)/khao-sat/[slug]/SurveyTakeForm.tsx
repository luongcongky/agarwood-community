"use client"

import { useState } from "react"
import type { SurveyAnswers, SurveyQuestion } from "@/lib/survey/types"
import { ResultPanel } from "./ResultPanel"
import { ImageUpload } from "./ImageUpload"

interface Prefill {
  name: string
  email: string
  phone: string
  avatarUrl?: string
  companyName: string
  logoUrl: string
}

interface Props {
  slug: string
  submitterType: "BUSINESS" | "INDIVIDUAL" | null
  questions: SurveyQuestion[]
  prefill?: Prefill | null
}

interface ContactData {
  name: string
  email: string
  phone: string
  avatarUrl: string
  companyName: string
  logoUrl: string
}

type Step = "contact" | "questions"

export function SurveyTakeForm({ slug, submitterType, questions, prefill }: Props) {
  const isBusiness = submitterType === "BUSINESS"

  const [step, setStep] = useState<Step>("contact")
  const [contact, setContact] = useState<ContactData>({
    name: prefill?.name ?? "",
    email: prefill?.email ?? "",
    phone: prefill?.phone ?? "",
    avatarUrl: prefill?.avatarUrl ?? "",
    companyName: prefill?.companyName ?? "",
    logoUrl: prefill?.logoUrl ?? "",
  })
  const [answers, setAnswers] = useState<SurveyAnswers>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ score: number; recommendedTier: string; contact: ContactData } | null>(null)

  function setAnswer(id: string, value: SurveyAnswers[string]) {
    setAnswers((a) => ({ ...a, [id]: value }))
  }

  function goToQuestions(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (contact.name.trim().length < 2) return setError("Vui lòng nhập họ tên")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) return setError("Email không hợp lệ")
    if (!/^[\d\s+()-]{8,15}$/.test(contact.phone.trim())) return setError("Số điện thoại không hợp lệ")
    if (isBusiness && contact.companyName.trim().length < 2) return setError("Vui lòng nhập tên doanh nghiệp")
    setStep("questions")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/khao-sat/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          contact: {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            avatarUrl: !isBusiness ? contact.avatarUrl : undefined,
            companyName: isBusiness ? contact.companyName : undefined,
            logoUrl: isBusiness ? contact.logoUrl : undefined,
            submitterType,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Lỗi không xác định")
      setResult({ score: data.score, recommendedTier: data.recommendedTier, contact })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <ResultPanel
        slug={slug}
        recommendedTier={result.recommendedTier}
        contact={result.contact}
      />
    )
  }

  if (step === "contact") {
    return (
      <form onSubmit={goToQuestions} className="space-y-5">
        <div className="rounded-xl border border-brand-200 bg-white p-6">
          <h2 className="font-bold text-brand-900 text-lg mb-1">Bước 1/2 — Thông tin liên hệ</h2>
          <p className="text-sm text-brand-500 mb-5">
            Thông tin này sẽ được dùng để cập nhật hồ sơ hội viên &amp; liên hệ tư vấn sau khi khảo sát.
          </p>

          <div className="space-y-4">
            <Field label="Họ và tên *">
              <input required value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={inp} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email *">
                <input required type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={inp} />
              </Field>
              <Field label="Số điện thoại *">
                <input required value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={inp} />
              </Field>
            </div>

            {!isBusiness && (
              <Field label="Ảnh đại diện" hint="Ảnh chân dung, tối đa 3MB. Không bắt buộc nhưng giúp Hội nhận diện bạn tốt hơn.">
                <ImageUpload
                  sub="avatar"
                  value={contact.avatarUrl}
                  onChange={(url) => setContact({ ...contact, avatarUrl: url })}
                  label="Chọn ảnh đại diện"
                />
              </Field>
            )}

            {isBusiness && (
              <>
                <Field label="Tên doanh nghiệp đang công tác *">
                  <input required value={contact.companyName} onChange={(e) => setContact({ ...contact, companyName: e.target.value })} className={inp} />
                </Field>
                <Field label="Logo doanh nghiệp" hint="Tối đa 3MB. Không bắt buộc.">
                  <ImageUpload
                    sub="logo"
                    value={contact.logoUrl}
                    onChange={(url) => setContact({ ...contact, logoUrl: url })}
                    label="Chọn ảnh logo"
                  />
                </Field>
              </>
            )}
          </div>
        </div>

        {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-md bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800">
            Tiếp tục →
          </button>
        </div>
      </form>
    )
  }

  // Step: questions
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-brand-900 text-lg">Bước 2/2 — Các câu hỏi chuyên môn</h2>
        <button type="button" onClick={() => setStep("contact")} className="text-sm text-brand-600 hover:underline">
          ← Sửa thông tin
        </button>
      </div>

      {questions.map((q) => (
        <QuestionField key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
      ))}

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {submitting ? "Đang gửi..." : "Gửi khảo sát"}
        </button>
      </div>
    </form>
  )
}

const inp = "w-full rounded-md border border-brand-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"

/** Đoán sub-folder từ label câu hỏi để ảnh được phân loại hợp lý trên Cloudinary. */
function mapLabelToSub(label: string): "store" | "team" | "board" | "other" {
  const l = label.toLowerCase()
  if (l.includes("cửa hàng") || l.includes("showroom") || l.includes("xưởng")) return "store"
  if (l.includes("ban giám đốc") || l.includes("lãnh đạo")) return "board"
  if (l.includes("thành viên") || l.includes("nhân sự") || l.includes("đội ngũ")) return "team"
  return "other"
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-brand-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-brand-500 mt-1">{hint}</span>}
    </label>
  )
}

function QuestionField({
  q, value, onChange,
}: {
  q: SurveyQuestion
  value: SurveyAnswers[string]
  onChange: (v: SurveyAnswers[string]) => void
}) {
  return (
    <div className="rounded-xl border border-brand-200 bg-white p-5">
      <label className="block">
        <div className="font-medium text-brand-900 mb-2">
          {q.label}
          {q.required && <span className="text-red-600 ml-1">*</span>}
        </div>
        {q.helpText && <div className="text-xs text-brand-500 mb-2">{q.helpText}</div>}

        {q.type === "text" && (
          <input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={inp} />
        )}
        {q.type === "textarea" && (
          <textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={inp} rows={4} />
        )}
        {q.type === "number" && (
          <input
            type="number"
            value={(value as number | undefined) ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className={inp}
          />
        )}
        {q.type === "scale" && (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`flex-1 rounded-md border-2 py-3 font-semibold ${
                  value === n ? "border-brand-700 bg-brand-50 text-brand-900" : "border-brand-200 text-brand-500 hover:border-brand-400"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        {q.type === "select" && q.options && (
          <div className="space-y-2">
            {q.options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={q.id} checked={value === opt} onChange={() => onChange(opt)} className="w-4 h-4" />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        )}
        {q.type === "files" && (
          <ImageUpload
            multi
            sub={mapLabelToSub(q.label)}
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={onChange}
            maxFiles={q.maxFiles ?? 5}
          />
        )}
        {q.type === "multiselect" && q.options && (
          <div className="space-y-2">
            {q.options.map((opt) => {
              const arr = (value as string[]) ?? []
              const checked = arr.includes(opt)
              return (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange(checked ? arr.filter((x) => x !== opt) : [...arr, opt])}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              )
            })}
          </div>
        )}
      </label>
    </div>
  )
}
