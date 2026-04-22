"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

/**
 * Error boundary cho mọi route under /[locale]/*.
 * Khác với root `app/error.tsx`, file này nằm BÊN TRONG NextIntlClientProvider
 * (provider gắn ở app/[locale]/layout.tsx) nên `useTranslations` dùng được.
 *
 * Root error.tsx chỉ trigger khi error xảy ra NGOÀI [locale] subtree (vd
 * /admin, /api, hoặc top-level routing error) — nơi không có locale context.
 */
export default function LocaleError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  const t = useTranslations("errors")
  const tc = useTranslations("common")

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center",
        "bg-brand-50 px-4 text-center",
      )}
    >
      <div className="mb-6 text-6xl">⚠️</div>

      <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
        {t("genericError")}
      </h1>

      <p className="mt-3 max-w-md text-brand-600">{t("genericErrorDesc")}</p>

      {error.digest && (
        <p className="mt-2 text-xs text-brand-400">
          {t("errorCode", { code: error.digest })}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className={cn(
            "inline-flex items-center justify-center rounded-lg",
            "bg-brand-700 px-6 py-3 text-base font-semibold text-white",
            "transition-colors hover:bg-brand-800 active:bg-brand-900",
          )}
        >
          {tc("retry")}
        </button>

        <Link
          href="/"
          className={cn(
            "inline-flex items-center justify-center rounded-lg",
            "border border-brand-400 bg-white px-6 py-3 text-base font-semibold text-brand-700",
            "transition-colors hover:bg-brand-100",
          )}
        >
          {tc("backToHome")}
        </Link>
      </div>
    </div>
  )
}
