"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { GoogleSignUpButton } from "./GoogleSignUpButton"
import { RegisterForm } from "./RegisterForm"

export type AccountType = "BUSINESS" | "INDIVIDUAL"

export function RegisterSection() {
  const t = useTranslations("registerSection")
  const [accountType, setAccountType] = useState<AccountType>("BUSINESS")

  return (
    <div className="space-y-6">
      <div>
        <p className="block text-sm font-medium text-brand-800 mb-1">
          {t("selectRole")} <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            type="button"
            onClick={() => setAccountType("INDIVIDUAL")}
            className={cn(
              "rounded-lg border-2 p-3 text-left transition-colors",
              accountType === "INDIVIDUAL"
                ? "border-brand-600 bg-brand-50"
                : "border-brand-200 hover:border-brand-400",
            )}
          >
            <p className="font-semibold text-brand-900 text-sm">{t("individualLabel")}</p>
            <p className="text-xs text-brand-500 mt-0.5">{t("individualDesc")}</p>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("BUSINESS")}
            className={cn(
              "rounded-lg border-2 p-3 text-left transition-colors",
              accountType === "BUSINESS"
                ? "border-brand-600 bg-brand-50"
                : "border-brand-200 hover:border-brand-400",
            )}
          >
            <p className="font-semibold text-brand-900 text-sm">{t("businessLabel")}</p>
            <p className="text-xs text-brand-500 mt-0.5">{t("businessDesc")}</p>
          </button>
        </div>
      </div>

      <GoogleSignUpButton accountType={accountType} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-brand-200" />
        <span className="text-xs text-brand-400">{t("orFillForm")}</span>
        <div className="flex-1 h-px bg-brand-200" />
      </div>

      <RegisterForm accountType={accountType} />
    </div>
  )
}
