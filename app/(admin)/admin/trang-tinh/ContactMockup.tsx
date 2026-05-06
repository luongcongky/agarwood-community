"use client"

import { cn } from "@/lib/utils"
import type { StaticPageConfig } from "@prisma/client"

interface Props {
  selectedKey: string | null
  onSelect: (key: string) => void
  configMap: Record<string, StaticPageConfig>
  defaultValues: Record<string, string>
}

export function ContactMockup({ selectedKey, onSelect, configMap, defaultValues }: Props) {
  return (
    <div className="bg-white border border-brand-200 rounded-lg shadow-sm overflow-hidden text-[10px]">
      {/* ── Browser Header ── */}
      <div className="bg-brand-50 border-b border-brand-100 px-3 py-1.5 flex items-center gap-1.5">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="bg-white border border-brand-100 rounded px-2 py-0.5 flex-1 mx-4 text-center text-brand-400 truncate">
          hoitramhuong.vn/lien-he
        </div>
      </div>

      <div className="px-6 py-8 grid grid-cols-2 gap-6">
        {/* ── Left: Contact info ── */}
        <div className="space-y-3">
          <EditableArea
            itemKey="contactInfo"
            label="Thông tin liên hệ"
            value={configMap["contactInfo"]?.value}
            defaultValue={defaultValues["contactInfo"]}
            selectedKey={selectedKey}
            onSelect={onSelect}
            className="text-sm font-bold text-brand-900"
          />

          <ul className="space-y-2.5">
            {/* Phone */}
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-sm">📞</span>
              <div className="flex-1 space-y-0.5">
                <EditableArea
                  itemKey="phone"
                  label="Điện thoại"
                  value={configMap["phone"]?.value}
                  defaultValue={defaultValues["phone"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[7px] font-bold uppercase tracking-wide text-brand-500"
                />
                <div className="text-[9px] font-medium text-brand-800">0913 810 060</div>
                <div className="text-[7px] text-brand-400 italic">
                  Số ĐT trong code (không CMS)
                </div>
              </div>
            </li>

            {/* Email */}
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-sm">📧</span>
              <div className="flex-1 space-y-0.5">
                <EditableArea
                  itemKey="email"
                  label="Email"
                  value={configMap["email"]?.value}
                  defaultValue={defaultValues["email"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[7px] font-bold uppercase tracking-wide text-brand-500"
                />
                <div className="text-[9px] font-medium text-brand-800 break-all">
                  hoitramhuongvietnam2010@gmail.com
                </div>
              </div>
            </li>

            {/* Address */}
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-sm">📍</span>
              <div className="flex-1 space-y-0.5">
                <EditableArea
                  itemKey="address"
                  label="Địa chỉ"
                  value={configMap["address"]?.value}
                  defaultValue={defaultValues["address"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[7px] font-bold uppercase tracking-wide text-brand-500"
                />
                <div className="text-[9px] font-medium text-brand-800 leading-tight">
                  Số 150, Đường Lý Chính Thắng,
                  <br />
                  Phường Xuân Hòa, TP. HCM
                </div>
              </div>
            </li>

            {/* Website */}
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-sm">🌐</span>
              <div className="flex-1 space-y-0.5">
                <EditableArea
                  itemKey="website"
                  label="Website"
                  value={configMap["website"]?.value}
                  defaultValue={defaultValues["website"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[7px] font-bold uppercase tracking-wide text-brand-500"
                />
                <div className="text-[9px] font-medium text-brand-800">hoitramhuong.vn</div>
              </div>
            </li>

            {/* Working hours */}
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-sm">🕐</span>
              <div className="flex-1 space-y-0.5">
                <EditableArea
                  itemKey="workingHours"
                  label="Giờ làm việc"
                  value={configMap["workingHours"]?.value}
                  defaultValue={defaultValues["workingHours"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[7px] font-bold uppercase tracking-wide text-brand-500"
                />
                <EditableArea
                  itemKey="workingHoursValue"
                  label="Thứ 2 - Thứ 6: 8:00 - 17:00"
                  value={configMap["workingHoursValue"]?.value}
                  defaultValue={defaultValues["workingHoursValue"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[9px] font-medium text-brand-800"
                />
              </div>
            </li>
          </ul>

          {/* Social */}
          <div className="pt-2 space-y-1">
            <EditableArea
              itemKey="socialMedia"
              label="Mạng xã hội"
              value={configMap["socialMedia"]?.value}
              defaultValue={defaultValues["socialMedia"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[7px] font-bold uppercase tracking-wide text-brand-500"
            />
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded border border-brand-200 bg-white text-[8px] font-medium text-brand-700">
              Facebook
            </div>
          </div>
        </div>

        {/* ── Right: Quick form ── */}
        <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-4 space-y-2">
          <EditableArea
            itemKey="quickMessage"
            label="Gửi tin nhắn nhanh"
            value={configMap["quickMessage"]?.value}
            defaultValue={defaultValues["quickMessage"]}
            selectedKey={selectedKey}
            onSelect={onSelect}
            className="text-sm font-bold text-brand-900"
          />
          {/* Decorative form fields (non-editable) */}
          <div className="space-y-1.5">
            {[
              { label: "Họ và tên *", h: "h-5" },
              { label: "Email *", h: "h-5" },
              { label: "Số điện thoại", h: "h-5" },
              { label: "Nội dung *", h: "h-12" },
            ].map((f, i) => (
              <div key={i} className="space-y-0.5">
                <div className="text-[7px] font-medium text-brand-700">{f.label}</div>
                <div className={cn("rounded border border-brand-200 bg-white", f.h)} />
              </div>
            ))}
            <div className="rounded bg-brand-700 text-white text-[8px] font-bold text-center py-1.5 mt-2">
              Gửi liên hệ
            </div>
            <div className="text-[7px] text-brand-400 italic text-center">
              Form text → namespace `contactForm`
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditableArea({
  itemKey,
  label,
  value,
  defaultValue,
  selectedKey,
  onSelect,
  className,
}: {
  itemKey: string
  label: string
  value?: string
  defaultValue?: string
  selectedKey: string | null
  onSelect: (key: string) => void
  className?: string
}) {
  const isSelected = selectedKey === itemKey
  const displayValue = value || defaultValue

  return (
    <button
      type="button"
      onClick={() => onSelect(itemKey)}
      className={cn(
        "group relative block w-full rounded-md transition-all duration-200 min-h-[1.5em] text-left",
        isSelected
          ? "bg-amber-100 ring-2 ring-amber-500 ring-offset-2 z-10"
          : "hover:bg-amber-50/50 hover:ring-2 hover:ring-amber-300 ring-offset-1",
        !displayValue && "bg-brand-100/30",
        className,
      )}
    >
      <span className={cn("block px-2 py-1", !displayValue && "text-brand-400 italic font-normal")}>
        {displayValue || label}
      </span>
      <span
        className={cn(
          "absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider whitespace-nowrap transition-opacity pointer-events-none z-20",
          isSelected
            ? "bg-amber-500 text-white opacity-100"
            : "bg-amber-200 text-amber-800 opacity-0 group-hover:opacity-100",
        )}
      >
        {itemKey}
      </span>
    </button>
  )
}
