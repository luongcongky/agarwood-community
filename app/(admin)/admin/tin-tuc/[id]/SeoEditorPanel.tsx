"use client"

import { useEffect, useRef, useState } from "react"
import type { Locale } from "@/components/ui/lang-tabs-bar"
import type { SeoCheck, SeoResult } from "@/lib/seo/score"

type Props = {
  excludeId?: string
  activeLocale: Locale
  // Article fields the panel needs (current values from NewsEditor state)
  title: Record<Locale, string>
  excerpt: Record<Locale, string>
  content: Record<Locale, string>
  slug: string
  coverImageUrl: string

  // SEO fields the panel owns (lifted state via setters)
  focusKeyword: string
  setFocusKeyword: (v: string) => void
  secondaryKeywords: string[]
  setSecondaryKeywords: (v: string[]) => void
  seoTitle: Record<Locale, string>
  setSeoTitleField: (locale: Locale, v: string) => void
  seoDescription: Record<Locale, string>
  setSeoDescriptionField: (locale: Locale, v: string) => void
  coverImageAlt: Record<Locale, string>
  setCoverImageAltField: (locale: Locale, v: string) => void

  disabled?: boolean
}

function scoreColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-500"
  if (pct >= 50) return "bg-amber-500"
  return "bg-red-500"
}

function scoreBadgeClass(pct: number): string {
  if (pct >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200"
  if (pct >= 50) return "text-amber-700 bg-amber-50 border-amber-200"
  return "text-red-700 bg-red-50 border-red-200"
}

const CATEGORY_LABEL: Record<SeoCheck["category"], string> = {
  title: "Tiêu đề",
  sapo: "Sapo / mô tả",
  heading: "Heading H2",
  image: "Hình ảnh cover",
  content: "Nội dung",
  modern: "SEO nâng cao (bonus)",
}

export function SeoEditorPanel(props: Props) {
  const {
    excludeId,
    activeLocale,
    title, excerpt, content, slug, coverImageUrl,
    focusKeyword, setFocusKeyword,
    secondaryKeywords, setSecondaryKeywords,
    seoTitle, setSeoTitleField,
    seoDescription, setSeoDescriptionField,
    coverImageAlt, setCoverImageAltField,
    disabled,
  } = props

  const [result, setResult] = useState<SeoResult | null>(null)
  const [scoring, setScoring] = useState(false)
  const [secInput, setSecInput] = useState("")
  const [showAllChecks, setShowAllChecks] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastReqRef = useRef(0)

  // Debounced scoring against VI fields (source-of-truth for scoring).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const reqId = ++lastReqRef.current
      setScoring(true)
      try {
        const res = await fetch("/api/admin/news/seo-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            excludeId,
            title: title.vi,
            seoTitle: seoTitle.vi,
            excerpt: excerpt.vi,
            seoDescription: seoDescription.vi,
            content: content.vi,
            focusKeyword,
            secondaryKeywords,
            coverImageUrl,
            coverImageAlt: coverImageAlt.vi,
            slug,
            translatedLocaleCount: [title.en, title.zh, title.ar].filter((t) => t.trim()).length,
          }),
        })
        if (!res.ok || reqId !== lastReqRef.current) return
        const data = (await res.json()) as SeoResult
        setResult(data)
      } finally {
        if (reqId === lastReqRef.current) setScoring(false)
      }
    }, 600)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [
    excludeId,
    title.vi, title.en, title.zh, title.ar,
    excerpt.vi,
    content.vi,
    seoTitle.vi, seoDescription.vi, coverImageAlt.vi,
    focusKeyword, secondaryKeywords,
    slug, coverImageUrl,
  ])

  function addSecondary() {
    const v = secInput.trim()
    if (!v) return
    if (secondaryKeywords.includes(v)) {
      setSecInput("")
      return
    }
    if (secondaryKeywords.length >= 5) return
    setSecondaryKeywords([...secondaryKeywords, v])
    setSecInput("")
  }

  function removeSecondary(kw: string) {
    setSecondaryKeywords(secondaryKeywords.filter((k) => k !== kw))
  }

  const legacyPct = result ? Math.round((result.legacyScore / Math.max(1, result.legacyMax)) * 100) : 0
  const modernPct = result ? Math.round((result.modernScore / Math.max(1, result.modernMax)) * 100) : 0
  const failedChecks = result ? result.checks.filter((c) => !c.passed) : []

  // Group checks by category for the "all checks" view
  const checksByCategory = result
    ? (Object.keys(CATEGORY_LABEL) as SeoCheck["category"][]).map((cat) => ({
        category: cat,
        label: CATEGORY_LABEL[cat],
        checks: result.checks.filter((c) => c.category === cat),
      })).filter((g) => g.checks.length > 0)
    : []

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-brand-900">Tối ưu SEO</h2>
        {result && (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${scoreBadgeClass(legacyPct)}`}>
            {result.legacyScore} / {result.legacyMax}
          </span>
        )}
      </div>

      {/* ── Inputs ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-brand-800 mb-1">
            Từ khóa chính <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={focusKeyword}
            onChange={(e) => setFocusKeyword(e.target.value)}
            placeholder="vd: trầm hương kỳ nam"
            disabled={disabled}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <p className="mt-1 text-[11px] text-brand-400">Cụm từ chính bạn muốn bài viết được tìm thấy trên Google.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-800 mb-1">
            Từ khóa phụ <span className="text-brand-400 font-normal">(tối đa 5)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={secInput}
              onChange={(e) => setSecInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addSecondary()
                }
              }}
              placeholder="Nhập rồi Enter"
              disabled={disabled || secondaryKeywords.length >= 5}
              className="flex-1 rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <button
              type="button"
              onClick={addSecondary}
              disabled={disabled || secondaryKeywords.length >= 5}
              className="rounded-lg border border-brand-200 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
            >
              Thêm
            </button>
          </div>
          {secondaryKeywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {secondaryKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-xs text-brand-700"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeSecondary(kw)}
                    disabled={disabled}
                    className="hover:text-red-600 font-bold"
                    aria-label={`Xóa từ khóa ${kw}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-800 mb-1">
            SEO Title <span className="text-brand-400 font-normal">({activeLocale.toUpperCase()})</span>
          </label>
          <input
            type="text"
            value={seoTitle[activeLocale]}
            onChange={(e) => setSeoTitleField(activeLocale, e.target.value)}
            placeholder={`Để trống → dùng tiêu đề bài viết`}
            disabled={disabled}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <p className="mt-1 text-[11px] text-brand-400">
            Hiện trên Google. Tối ưu: 50–60 ký tự ({seoTitle[activeLocale].length} hiện tại).
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-800 mb-1">
            SEO Description <span className="text-brand-400 font-normal">({activeLocale.toUpperCase()})</span>
          </label>
          <textarea
            value={seoDescription[activeLocale]}
            onChange={(e) => setSeoDescriptionField(activeLocale, e.target.value)}
            placeholder="Để trống → dùng tóm tắt bài viết"
            rows={2}
            disabled={disabled}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-y"
          />
          <p className="mt-1 text-[11px] text-brand-400">
            Hiện trên Google. Tối ưu: 140–160 ký tự ({seoDescription[activeLocale].length} hiện tại).
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-800 mb-1">
            Alt text ảnh cover <span className="text-brand-400 font-normal">({activeLocale.toUpperCase()})</span>
          </label>
          <input
            type="text"
            value={coverImageAlt[activeLocale]}
            onChange={(e) => setCoverImageAltField(activeLocale, e.target.value)}
            placeholder={`Để trống → dùng tiêu đề bài viết`}
            disabled={disabled}
            className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <p className="mt-1 text-[11px] text-brand-400">Mô tả ảnh cho Google Image + người dùng khiếm thị. Nên có từ khóa.</p>
        </div>
      </div>

      {/* ── Score panel ────────────────────────────────────────────────── */}
      <div className="border-t border-brand-100 pt-4 space-y-3">
        {!result && (
          <p className="text-xs text-brand-400 italic">
            {scoring ? "Đang chấm điểm..." : "Chưa đủ thông tin để chấm."}
          </p>
        )}

        {result && (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-brand-700">Điểm cơ bản (19 tiêu chí)</span>
                <span className="font-mono text-brand-600">
                  {result.legacyScore}/{result.legacyMax} ({legacyPct}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-brand-100 overflow-hidden">
                <div
                  className={`h-full transition-all ${scoreColor(legacyPct)}`}
                  style={{ width: `${legacyPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-brand-700">Điểm SEO nâng cao (bonus)</span>
                <span className="font-mono text-brand-600">
                  {result.modernScore}/{result.modernMax} ({modernPct}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-brand-100 overflow-hidden">
                <div
                  className={`h-full transition-all ${scoreColor(modernPct)}`}
                  style={{ width: `${modernPct}%` }}
                />
              </div>
            </div>

            {/* Failed checks (action items) */}
            {failedChecks.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-brand-800">
                  Cần cải thiện ({failedChecks.length}):
                </p>
                <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {failedChecks.slice(0, 8).map((c) => (
                    <li key={c.id} className="flex items-start gap-1.5 text-[11px] leading-snug">
                      <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                      <div>
                        <span className="text-brand-700 font-medium">{c.label}</span>
                        {c.hint && (
                          <span className="text-brand-500 block">{c.hint}</span>
                        )}
                      </div>
                    </li>
                  ))}
                  {failedChecks.length > 8 && (
                    <li className="text-[11px] text-brand-400 italic">
                      ... và {failedChecks.length - 8} tiêu chí khác
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Toggle: all checks */}
            <button
              type="button"
              onClick={() => setShowAllChecks((v) => !v)}
              className="text-[11px] text-brand-600 hover:text-brand-800 underline"
            >
              {showAllChecks ? "Ẩn chi tiết" : "Xem tất cả tiêu chí"}
            </button>

            {showAllChecks && (
              <div className="space-y-3 pt-2">
                {checksByCategory.map((g) => (
                  <div key={g.category}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-500 mb-1">
                      {g.label}
                    </p>
                    <ul className="space-y-0.5">
                      {g.checks.map((c) => (
                        <li key={c.id} className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <span className={c.passed ? "text-emerald-500" : "text-red-500"}>
                              {c.passed ? "✓" : "✗"}
                            </span>
                            <span className={c.passed ? "text-brand-700" : "text-brand-500"}>
                              {c.label}
                            </span>
                          </span>
                          <span className="font-mono text-brand-400 shrink-0 ml-2">
                            {c.earned}/{c.maxPoints}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
