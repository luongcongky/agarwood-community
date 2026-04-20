"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { QuestionType, SurveyQuestion } from "@/lib/survey/types"
import { listAllowedFields } from "@/lib/survey/allowed-fields"
import { useAdminReadOnly, READ_ONLY_TOOLTIP } from "@/components/features/admin/AdminReadOnlyContext"
import { LangTabsBar, computeHasContent, type Locale } from "@/components/ui/lang-tabs-bar"

interface Props {
  /** undefined = create mode */
  initial?: {
    id: string
    slug: string
    title: string
    description: string | null
    audience: string
    status: string
    questions: SurveyQuestion[]
    config: { recommendation?: { silverFrom?: number; goldFrom?: number } } | null
  }
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "text", label: "Câu trả lời ngắn" },
  { value: "textarea", label: "Câu trả lời dài" },
  { value: "number", label: "Số" },
  { value: "select", label: "Chọn 1 đáp án" },
  { value: "multiselect", label: "Chọn nhiều đáp án" },
  { value: "scale", label: "Thang điểm (1-5)" },
  { value: "files", label: "Upload nhiều ảnh" },
]

const ALLOWED_MAPS_TO = listAllowedFields()

function emptyQuestion(): SurveyQuestion {
  return { id: `q_${Date.now().toString(36).slice(-4)}`, label: "", type: "text", required: false }
}

export function SurveyEditor({ initial }: Props) {
  const router = useRouter()
  const readOnly = useAdminReadOnly()
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const rec = initial as Record<string, unknown> | undefined
  const [title, setTitle] = useState<Record<Locale, string>>({
    vi: initial?.title ?? "",
    en: (rec?.title_en as string) ?? "",
    zh: (rec?.title_zh as string) ?? "",
    ar: (rec?.title_ar as string) ?? "",
  })
  const [description, setDescription] = useState<Record<Locale, string>>({
    vi: initial?.description ?? "",
    en: (rec?.description_en as string) ?? "",
    zh: (rec?.description_zh as string) ?? "",
    ar: (rec?.description_ar as string) ?? "",
  })
  const [activeLocale, setActiveLocale] = useState<Locale>("vi")
  const [audience, setAudience] = useState(initial?.audience ?? "BOTH_VIP")
  const [status, setStatus] = useState(initial?.status ?? "DRAFT")
  const [questions, setQuestions] = useState<SurveyQuestion[]>(initial?.questions ?? [])
  const [silverFrom, setSilverFrom] = useState(initial?.config?.recommendation?.silverFrom ?? 5)
  const [goldFrom, setGoldFrom] = useState(initial?.config?.recommendation?.goldFrom ?? 12)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function updateQ(idx: number, patch: Partial<SurveyQuestion>) {
    setQuestions((arr) => arr.map((q, i) => (i === idx ? { ...q, ...patch } : q)))
  }
  function moveQ(idx: number, dir: -1 | 1) {
    setQuestions((arr) => {
      const next = [...arr]
      const t = idx + dir
      if (t < 0 || t >= next.length) return next
      ;[next[idx], next[t]] = [next[t], next[idx]]
      return next
    })
  }
  function removeQ(idx: number) {
    setQuestions((arr) => arr.filter((_, i) => i !== idx))
  }
  function addQ() {
    setQuestions((arr) => [...arr, emptyQuestion()])
  }

  async function save() {
    setSaving(true)
    setError("")
    const body = {
      slug,
      title: title.vi,
      title_en: title.en || null,
      title_zh: title.zh || null,
      description: description.vi,
      description_en: description.en || null,
      description_zh: description.zh || null,
      audience,
      status,
      questions,
      config: { recommendation: { silverFrom, goldFrom } },
    }
    try {
      const url = initial ? `/api/admin/khao-sat/${initial.id}` : `/api/admin/khao-sat`
      const method = initial ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Lỗi không xác định")
      if (!initial) router.push(`/admin/khao-sat/${data.survey.id}`)
      else router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleAiTranslate(target: Locale) {
    if (target === "vi") return
    if (!title.vi.trim() && !description.vi.trim()) {
      throw new Error("Vui lòng nhập tiêu đề / mô tả tiếng Việt trước khi dịch.")
    }
    const res = await fetch("/api/admin/ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: { title: title.vi, description: description.vi },
        targetLocale: target,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Lỗi khi dịch.")
    const tx = (data.fields ?? {}) as Record<string, string>
    if (tx.title) setTitle((prev) => ({ ...prev, [target]: tx.title }))
    if (tx.description) setDescription((prev) => ({ ...prev, [target]: tx.description }))
  }

  async function remove() {
    if (!initial) return
    if (!confirm("Xóa khảo sát này? Tất cả câu trả lời cũng sẽ bị xóa.")) return
    const res = await fetch(`/api/admin/khao-sat/${initial.id}`, { method: "DELETE" })
    if (res.ok) router.push("/admin/khao-sat")
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Meta */}
      <section className="rounded-xl border border-brand-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold text-brand-900">Thông tin chung</h2>

        <LangTabsBar
          activeLocale={activeLocale}
          onLocaleChange={setActiveLocale}
          hasContent={computeHasContent(title, description)}
          disabled={readOnly}
          onAiTranslate={handleAiTranslate}
          helperText={
            activeLocale === "vi"
              ? "Tiêu đề + mô tả tiếng Việt bắt buộc. Dùng nút AI dịch khi chuyển sang EN / 中文 để tự dịch cả 2 cùng lúc."
              : undefined
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Tiêu đề ${activeLocale === "vi" ? "*" : `(${activeLocale.toUpperCase()})`}`}>
            <input
              value={title[activeLocale]}
              onChange={(e) => setTitle((prev) => ({ ...prev, [activeLocale]: e.target.value }))}
              placeholder={activeLocale === "vi" ? "Tiêu đề khảo sát" : "Translated title"}
              className={inp}
              disabled={readOnly}
              required={activeLocale === "vi"}
            />
          </Field>
          <Field label="Slug (URL) *" hint="VD: khao-sat-hoi-vien-2026">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inp} disabled={!!initial} />
          </Field>
        </div>
        <Field label={`Mô tả ${activeLocale === "vi" ? "" : `(${activeLocale.toUpperCase()})`}`}>
          <textarea
            value={description[activeLocale]}
            onChange={(e) =>
              setDescription((prev) => ({ ...prev, [activeLocale]: e.target.value }))
            }
            rows={3}
            placeholder={activeLocale === "vi" ? "Mô tả khảo sát" : "Translated description"}
            className={inp}
            disabled={readOnly}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Đối tượng">
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className={inp}>
              <option value="ALL">Tất cả user</option>
              <option value="BOTH_VIP">Hội viên (BUSINESS + INDIVIDUAL)</option>
              <option value="BUSINESS">Chỉ doanh nghiệp</option>
              <option value="INDIVIDUAL">Chỉ cá nhân</option>
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inp}>
              <option value="DRAFT">Nháp</option>
              <option value="ACTIVE">Đang chạy</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Recommendation */}
      <section className="rounded-xl border border-brand-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold text-brand-900">Ngưỡng gợi ý gói (theo điểm)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bạc từ (điểm)">
            <input type="number" value={silverFrom} onChange={(e) => setSilverFrom(+e.target.value)} className={inp} />
          </Field>
          <Field label="Vàng từ (điểm)">
            <input type="number" value={goldFrom} onChange={(e) => setGoldFrom(+e.target.value)} className={inp} />
          </Field>
        </div>
      </section>

      {/* Questions */}
      <section className="rounded-xl border border-brand-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-brand-900">Câu hỏi ({questions.length})</h2>
          <button onClick={addQ} disabled={readOnly} title={readOnly ? READ_ONLY_TOOLTIP : undefined} className="text-sm font-semibold text-brand-700 hover:underline disabled:opacity-50">+ Thêm câu</button>
        </div>
        {questions.length === 0 && (
          <p className="text-sm text-brand-500 italic">Chưa có câu hỏi nào.</p>
        )}
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionRow
              key={q.id}
              q={q}
              idx={i}
              total={questions.length}
              onChange={(p) => updateQ(i, p)}
              onMove={(d) => moveQ(i, d)}
              onRemove={() => removeQ(i)}
            />
          ))}
        </div>
      </section>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving || readOnly} title={readOnly ? READ_ONLY_TOOLTIP : undefined} className="rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
          {saving ? "Đang lưu..." : initial ? "Lưu thay đổi" : "Tạo khảo sát"}
        </button>
        {initial && (
          <button onClick={remove} disabled={readOnly} title={readOnly ? READ_ONLY_TOOLTIP : undefined} className="text-sm text-red-600 hover:underline disabled:opacity-50">Xóa</button>
        )}
      </div>
    </div>
  )
}

const inp = "w-full rounded-md border border-brand-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-brand-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-brand-500 mt-1">{hint}</span>}
    </label>
  )
}

function QuestionRow({
  q, idx, total, onChange, onMove, onRemove,
}: {
  q: SurveyQuestion
  idx: number
  total: number
  onChange: (p: Partial<SurveyQuestion>) => void
  onMove: (d: -1 | 1) => void
  onRemove: () => void
}) {
  const needsOptions = q.type === "select" || q.type === "multiselect"
  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold text-brand-500 mt-2">#{idx + 1}</span>
        <div className="flex-1 grid gap-3 sm:grid-cols-2">
          <Field label="Câu hỏi">
            <input value={q.label} onChange={(e) => onChange({ label: e.target.value })} className={inp} />
          </Field>
          <Field label="Loại">
            <select value={q.type} onChange={(e) => onChange({ type: e.target.value as QuestionType })} className={inp}>
              {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          {needsOptions && (
            <Field label="Lựa chọn (mỗi dòng 1 cái)">
              <textarea
                value={(q.options ?? []).join("\n")}
                onChange={(e) => onChange({ options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                className={inp}
                rows={4}
              />
            </Field>
          )}
          <Field label="Đồng bộ vào field" hint="(tùy chọn — câu trả lời sẽ tự cập nhật vào hồ sơ)">
            <select value={q.mapsTo ?? ""} onChange={(e) => onChange({ mapsTo: e.target.value || undefined })} className={inp}>
              <option value="">— Không —</option>
              {ALLOWED_MAPS_TO.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          {needsOptions && (
            <Field label="Điểm cho từng lựa chọn (option=số, mỗi dòng)" hint="VD: 50-200=4">
              <textarea
                value={Object.entries(q.scoreRule ?? {}).map(([k, v]) => `${k}=${v}`).join("\n")}
                onChange={(e) => {
                  const rule: Record<string, number> = {}
                  e.target.value.split("\n").forEach((line) => {
                    const [k, v] = line.split("=")
                    if (k && v && !Number.isNaN(+v)) rule[k.trim()] = +v
                  })
                  onChange({ scoreRule: Object.keys(rule).length ? rule : undefined })
                }}
                className={inp}
                rows={3}
              />
            </Field>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => onMove(-1)} disabled={idx === 0} className="text-xs px-2 py-1 text-brand-600 disabled:opacity-30 hover:bg-brand-100 rounded">↑</button>
          <button onClick={() => onMove(1)} disabled={idx === total - 1} className="text-xs px-2 py-1 text-brand-600 disabled:opacity-30 hover:bg-brand-100 rounded">↓</button>
          <button onClick={onRemove} className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded">×</button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-brand-700">
        <input type="checkbox" checked={!!q.required} onChange={(e) => onChange({ required: e.target.checked })} />
        Bắt buộc
      </label>
    </div>
  )
}
