"use client"

import { useTranslations } from "next-intl"

export function PrintButton() {
  const t = useTranslations("printCard")
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
    >
      {t("printButton")}
    </button>
  )
}
