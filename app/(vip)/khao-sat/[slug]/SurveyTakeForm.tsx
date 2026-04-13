"use client"

import { useState } from "react"
import type { SurveyAnswers, SurveyQuestion } from "@/lib/survey/types"
import { ResultPanel } from "./ResultPanel"

interface Props {
  slug: string
  questions: SurveyQuestion[]
  initialAnswers: SurveyAnswers
  existingTier: string | null
}

export function SurveyTakeForm({ slug, questions, initialAnswers, existingTier }: Props) {
  const [answers, setAnswers] = useState<SurveyAnswers>(initialAnswers)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ score: number; recommendedTier: string } | null>(
    existingTier ? { score: 0, recommendedTier: existingTier } : null
  )

  function setAnswer(id: string, value: SurveyAnswers[string]) {
    setAnswers((a) => ({ ...a, [id]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/khao-sat/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Lỗi không xác định")
      setResult({ score: data.score, recommendedTier: data.recommendedTier })
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
        onEdit={() => setResult(null)}
      />
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {questions.map((q) => (
        <QuestionField key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
      ))}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {submitting ? "Đang gửi..." : "Gửi câu trả lời"}
        </button>
      </div>
    </form>
  )
}

function QuestionField({
  q, value, onChange,
}: {
  q: SurveyQuestion
  value: SurveyAnswers[string]
  onChange: (v: SurveyAnswers[string]) => void
}) {
  const inp = "w-full rounded-md border border-brand-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"

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
                <input
                  type="radio"
                  name={q.id}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
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
