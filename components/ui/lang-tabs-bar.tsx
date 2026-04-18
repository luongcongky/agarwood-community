"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export const LANG_LOCALES = ["vi", "en", "zh"] as const
export type Locale = (typeof LANG_LOCALES)[number]

const LABELS: Record<Locale, { tab: string; full: string }> = {
  vi: { tab: "🇻🇳 VI (gốc)", full: "Tiếng Việt" },
  en: { tab: "🇬🇧 EN", full: "English" },
  zh: { tab: "🇨🇳 中文", full: "中文" },
}

export interface LangTabsBarProps {
  activeLocale: Locale
  onLocaleChange: (locale: Locale) => void
  /** Whether each locale has any translated content (for green dot) */
  hasContent: Record<Locale, boolean>
  /**
   * Called when admin clicks "AI dịch". Should call the translate API and
   * populate EN/ZH state. Only invoked for non-VI locales.
   */
  onAiTranslate: (target: Locale) => Promise<void>
  /** Disable all interactions (read-only mode) */
  disabled?: boolean
  /** Optional helper text under the tab bar */
  helperText?: string
  className?: string
}

export function LangTabsBar({
  activeLocale,
  onLocaleChange,
  hasContent,
  onAiTranslate,
  disabled,
  helperText,
  className,
}: LangTabsBarProps) {
  const [translating, setTranslating] = useState<Locale | null>(null)
  const [error, setError] = useState<string>("")

  async function handleTranslate(target: Locale) {
    setError("")
    setTranslating(target)
    try {
      await onAiTranslate(target)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi dịch")
    } finally {
      setTranslating(null)
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-200 pb-3">
        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto">
          {LANG_LOCALES.map((loc) => {
            const isActive = loc === activeLocale
            const hasData = hasContent[loc]
            return (
              <button
                key={loc}
                type="button"
                onClick={() => onLocaleChange(loc)}
                disabled={disabled}
                className={cn(
                  "relative inline-flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "border-brand-600 text-brand-900"
                    : "border-transparent text-brand-500 hover:text-brand-800 hover:bg-brand-50",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <span>{LABELS[loc].tab}</span>
                {hasData && (
                  <span
                    aria-label={`${LABELS[loc].full} có nội dung`}
                    className="inline-block size-2 rounded-full bg-emerald-500"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* AI translate button — only for EN/ZH */}
        {activeLocale !== "vi" && (
          <button
            type="button"
            onClick={() => handleTranslate(activeLocale)}
            disabled={disabled || translating !== null}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed",
              activeLocale === "en"
                ? "bg-linear-to-r from-blue-500 to-purple-500 hover:opacity-90"
                : "bg-linear-to-r from-red-500 to-orange-500 hover:opacity-90",
            )}
          >
            {translating === activeLocale
              ? activeLocale === "en"
                ? "⏳ Đang dịch..."
                : "⏳ 翻译中..."
              : `🤖 Dịch toàn bộ từ VI sang ${activeLocale === "en" ? "EN" : "中文"}`}
          </button>
        )}
      </div>

      {/* Inline status line */}
      {activeLocale !== "vi" && !error && (
        <p className="text-xs text-brand-500">
          {helperText ??
            `Đang chỉnh bản dịch ${LABELS[activeLocale].full}. Nếu để trống, viewer sẽ fallback về bản tiếng Việt.`}
        </p>
      )}
      {activeLocale === "vi" && helperText && (
        <p className="text-xs text-brand-500">{helperText}</p>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          ⚠ {error}
        </div>
      )}
    </div>
  )
}

// ─── Helper hook to manage per-locale field state ──────────────────────────

export interface LangValues<T> {
  vi: T
  en: T
  zh: T
}

/**
 * Derive `hasContent` flags from a list of locale-keyed value objects.
 * Pass any number of { vi, en, zh } records; a locale is "has content"
 * if ANY of them has a non-empty string in that locale.
 */
export function computeHasContent(
  ...records: Array<LangValues<string> | undefined>
): Record<Locale, boolean> {
  const result: Record<Locale, boolean> = { vi: false, en: false, zh: false }
  for (const rec of records) {
    if (!rec) continue
    for (const loc of LANG_LOCALES) {
      if (!result[loc] && typeof rec[loc] === "string" && rec[loc].trim() !== "") {
        result[loc] = true
      }
    }
  }
  return result
}
