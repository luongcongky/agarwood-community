"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const LOCALES = [
  { code: "vi", label: "🇻🇳 VI", full: "Tiếng Việt" },
  { code: "en", label: "🇬🇧 EN", full: "English" },
  { code: "zh", label: "🇨🇳 中文", full: "中文" },
  { code: "ar", label: "🇦🇪 AR", full: "العربية" },
] as const

type LocaleCode = (typeof LOCALES)[number]["code"]

interface MultiLangValues {
  vi: string
  en: string
  zh: string
  ar: string
}

/** Suffix for the _en / _zh / _ar DB columns (vi has no suffix) */
function fieldKey(baseName: string, locale: LocaleCode): string {
  return locale === "vi" ? baseName : `${baseName}_${locale}`
}

// ─── MultiLangInput ─────────────────────────────────────────────────────

interface MultiLangInputProps {
  /** Base field name (e.g. "label", "title") */
  name: string
  /** Display label shown above the tabs */
  label: string
  /** Current values: { vi, en, zh, ar } */
  values: MultiLangValues
  /** Called with (fieldKey, value) — fieldKey is "title", "title_en", "title_zh", or "title_ar" */
  onChange: (fieldKey: string, value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function MultiLangInput({
  name,
  label,
  values,
  onChange,
  placeholder,
  required,
  disabled,
  className,
}: MultiLangInputProps) {
  const [tab, setTab] = useState<LocaleCode>("vi")

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-brand-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <LangTabs active={tab} onSelect={setTab} values={values} />
      </div>
      <input
        type="text"
        value={values[tab]}
        onChange={(e) => onChange(fieldKey(name, tab), e.target.value)}
        placeholder={tab === "vi" ? placeholder : `${placeholder} (${LOCALES.find((l) => l.code === tab)?.full})`}
        required={required && tab === "vi"}
        disabled={disabled}
        dir={tab === "ar" ? "rtl" : "ltr"}
        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-colors disabled:opacity-50"
      />
    </div>
  )
}

// ─── MultiLangTextarea ──────────────────────────────────────────────────

interface MultiLangTextareaProps {
  name: string
  label: string
  values: MultiLangValues
  onChange: (fieldKey: string, value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
}

export function MultiLangTextarea({
  name,
  label,
  values,
  onChange,
  placeholder,
  required,
  disabled,
  rows = 4,
  className,
}: MultiLangTextareaProps) {
  const [tab, setTab] = useState<LocaleCode>("vi")

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-brand-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <LangTabs active={tab} onSelect={setTab} values={values} />
      </div>
      <textarea
        value={values[tab]}
        onChange={(e) => onChange(fieldKey(name, tab), e.target.value)}
        placeholder={tab === "vi" ? placeholder : `${placeholder} (${LOCALES.find((l) => l.code === tab)?.full})`}
        required={required && tab === "vi"}
        disabled={disabled}
        rows={rows}
        dir={tab === "ar" ? "rtl" : "ltr"}
        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-colors resize-none disabled:opacity-50"
      />
    </div>
  )
}

// ─── Lang Tabs (shared) ─────────────────────────────────────────────────

function LangTabs({
  active,
  onSelect,
  values,
}: {
  active: LocaleCode
  onSelect: (code: LocaleCode) => void
  values: MultiLangValues
}) {
  return (
    <div className="flex items-center gap-0.5 bg-brand-100 rounded-md p-0.5">
      {LOCALES.map(({ code, label }) => {
        const hasValue = code !== "vi" && values[code].trim().length > 0
        return (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            className={cn(
              "px-2 py-0.5 rounded text-xs font-medium transition-colors relative",
              active === code
                ? "bg-white text-brand-900 shadow-sm"
                : "text-brand-500 hover:text-brand-700",
            )}
          >
            {label}
            {hasValue && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Helper: extract MultiLangValues from a form state object ────────

export function extractLangValues(
  formState: Record<string, unknown>,
  baseName: string,
): MultiLangValues {
  return {
    vi: (formState[baseName] as string) ?? "",
    en: (formState[`${baseName}_en`] as string) ?? "",
    zh: (formState[`${baseName}_zh`] as string) ?? "",
    ar: (formState[`${baseName}_ar`] as string) ?? "",
  }
}
