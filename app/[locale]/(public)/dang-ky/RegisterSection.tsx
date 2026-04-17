"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { GoogleSignUpButton } from "./GoogleSignUpButton"
import { RegisterForm } from "./RegisterForm"

export type AccountType = "BUSINESS" | "INDIVIDUAL"

/**
 * Wrapper cho flow đăng ký — quản lý state accountType dùng chung cho cả
 * đăng ký bằng Google và form thủ công. Radio chọn loại tài khoản được
 * đưa lên đầu để áp dụng cho cả 2 path.
 */
export function RegisterSection() {
  const [accountType, setAccountType] = useState<AccountType>("BUSINESS")

  return (
    <div className="space-y-6">
      {/* Account type selector — dùng chung cho Google + form thủ công */}
      <div>
        <p className="block text-sm font-medium text-brand-800 mb-1">
          Bạn đăng ký với tư cách <span className="text-red-500">*</span>
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
            <p className="font-semibold text-brand-900 text-sm">Cá nhân / Chuyên gia</p>
            <p className="text-xs text-brand-500 mt-0.5">Kết nối, chia sẻ kinh nghiệm</p>
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
            <p className="font-semibold text-brand-900 text-sm">Doanh nghiệp</p>
            <p className="text-xs text-brand-500 mt-0.5">Có công ty, sản phẩm, cần chứng nhận</p>
          </button>
        </div>
      </div>

      <GoogleSignUpButton accountType={accountType} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-brand-200" />
        <span className="text-xs text-brand-400">hoặc điền form đăng ký</span>
        <div className="flex-1 h-px bg-brand-200" />
      </div>

      <RegisterForm accountType={accountType} />
    </div>
  )
}
