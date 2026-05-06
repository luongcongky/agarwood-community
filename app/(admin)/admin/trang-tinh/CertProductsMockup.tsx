"use client"

import { cn } from "@/lib/utils"
import type { StaticPageConfig } from "@prisma/client"

interface Props {
  selectedKey: string | null
  onSelect: (key: string) => void
  configMap: Record<string, StaticPageConfig>
  defaultValues: Record<string, string>
}

export function CertProductsMockup({ selectedKey, onSelect, configMap, defaultValues }: Props) {
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
          hoitramhuong.vn/san-pham-chung-nhan
        </div>
      </div>

      <div className="flex flex-col">
        {/* ── 1. Hero (TOP — full edit) ── */}
        <section className="relative py-8 px-6 bg-brand-900 text-white">
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[7px] font-bold uppercase tracking-wider">
            Top — chỉnh đầy đủ
          </div>
          <div className="space-y-2 mt-3">
            <EditableArea
              itemKey="heroEyebrow"
              label="Chứng nhận chính thức · Hội Trầm Hương Việt Nam"
              value={configMap["heroEyebrow"]?.value}
              defaultValue={defaultValues["heroEyebrow"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] font-bold uppercase tracking-widest text-emerald-300"
            />
            <div className="space-y-0.5">
              <EditableArea
                itemKey="heroTitle1"
                label="Mỗi sản phẩm trên đây"
                value={configMap["heroTitle1"]?.value}
                defaultValue={defaultValues["heroTitle1"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-base font-bold text-white leading-tight"
              />
              <EditableArea
                itemKey="heroTitle2"
                label="đã đi qua hội đồng thẩm định"
                value={configMap["heroTitle2"]?.value}
                defaultValue={defaultValues["heroTitle2"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-base font-bold text-white leading-tight"
              />
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <EditableArea
                  itemKey="heroTitleCouncil"
                  label="5 thành viên"
                  value={configMap["heroTitleCouncil"]?.value}
                  defaultValue={defaultValues["heroTitleCouncil"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-base font-bold text-emerald-300 leading-tight inline-block"
                />
                <EditableArea
                  itemKey="heroTitleSuffix"
                  label="của Hội."
                  value={configMap["heroTitleSuffix"]?.value}
                  defaultValue={defaultValues["heroTitleSuffix"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-base font-bold text-white leading-tight inline-block"
                />
              </div>
            </div>
            <EditableArea
              itemKey="heroSub"
              label="Không phải tự công bố. Đây là chứng nhận có giá trị {validity} năm..."
              value={configMap["heroSub"]?.value}
              defaultValue={defaultValues["heroSub"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[9px] text-white/70 leading-relaxed"
            />

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/15 pt-2 mt-2">
              <div className="space-y-0.5">
                <div className="font-bold text-emerald-300 text-base tabular-nums">25</div>
                <EditableArea
                  itemKey="statProducts"
                  label="sản phẩm đã chứng nhận"
                  value={configMap["statProducts"]?.value}
                  defaultValue={defaultValues["statProducts"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[7px] text-white/70"
                />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-emerald-300 text-base tabular-nums">12</div>
                <EditableArea
                  itemKey="statCompanies"
                  label="doanh nghiệp tham gia"
                  value={configMap["statCompanies"]?.value}
                  defaultValue={defaultValues["statCompanies"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[7px] text-white/70"
                />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-emerald-300 text-base tabular-nums">18</div>
                <EditableArea
                  itemKey="statMonthsActive"
                  label="tháng hoạt động"
                  value={configMap["statMonthsActive"]?.value}
                  defaultValue={defaultValues["statMonthsActive"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[7px] text-white/70"
                />
              </div>
            </div>

            {/* CTA buttons */}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <EditableArea
                itemKey="ctaSubmit"
                label="Nộp đơn chứng nhận sản phẩm"
                value={configMap["ctaSubmit"]?.value}
                defaultValue={defaultValues["ctaSubmit"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-[8px] font-bold text-white bg-emerald-600 rounded px-2 py-1 text-center"
              />
              <EditableArea
                itemKey="ctaProcess"
                label="Xem quy trình {validity} năm hiệu lực"
                value={configMap["ctaProcess"]?.value}
                defaultValue={defaultValues["ctaProcess"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-[8px] font-medium text-white/80 px-2 py-1 text-center"
              />
            </div>
          </div>
        </section>

        {/* ── 2. Process Timeline (MIDDLE — header only) ── */}
        <section className="relative py-6 px-6 bg-stone-50">
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-brand-100 text-brand-600 text-[7px] font-bold uppercase tracking-wider">
            Giữa — chỉ chỉnh tiêu đề
          </div>
          <div className="text-center space-y-1 mt-3">
            <EditableArea
              itemKey="processEyebrow"
              label="Quy trình chứng nhận"
              value={configMap["processEyebrow"]?.value}
              defaultValue={defaultValues["processEyebrow"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] font-bold uppercase tracking-widest text-emerald-700"
            />
            <EditableArea
              itemKey="processTitle"
              label="4 bước để có chứng nhận chính thức"
              value={configMap["processTitle"]?.value}
              defaultValue={defaultValues["processTitle"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-sm font-bold text-brand-900 leading-snug"
            />
          </div>
          {/* Decorative steps timeline (non-editable) */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {["📋", "👥", "🔍", "🏅"].map((icon, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full border border-emerald-300 bg-white flex items-center justify-center text-sm">
                  {icon}
                </div>
                <div className="mt-1 h-0.5 w-3/4 bg-emerald-200/40" />
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Featured Certified (MIDDLE — header only) ── */}
        <section className="relative py-6 px-6 bg-brand-900 text-white border-t border-emerald-900/30">
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-brand-100 text-brand-600 text-[7px] font-bold uppercase tracking-wider">
            Giữa — chỉ chỉnh tiêu đề
          </div>
          <div className="space-y-1 mt-3">
            <EditableArea
              itemKey="featuredEyebrow"
              label="Mới được cấp chứng nhận"
              value={configMap["featuredEyebrow"]?.value}
              defaultValue={defaultValues["featuredEyebrow"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] font-bold uppercase tracking-widest text-emerald-300"
            />
            <EditableArea
              itemKey="featuredTitle"
              label="Sản phẩm tiêu biểu"
              value={configMap["featuredTitle"]?.value}
              defaultValue={defaultValues["featuredTitle"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-sm font-bold text-white leading-snug"
            />
          </div>
          {/* Decorative product cards (non-editable) */}
          <div className="grid grid-cols-5 gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-4/5 bg-white/5 ring-1 ring-white/10 rounded" />
            ))}
          </div>
        </section>

        {/* ── 4. Directory (MIDDLE — header only) ── */}
        <section className="relative py-6 px-6 bg-stone-50 border-t border-stone-200">
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-brand-100 text-brand-600 text-[7px] font-bold uppercase tracking-wider">
            Giữa — chỉ chỉnh tiêu đề
          </div>
          <div className="space-y-1 mt-3">
            <EditableArea
              itemKey="directoryEyebrow"
              label="Kho sản phẩm chứng nhận"
              value={configMap["directoryEyebrow"]?.value}
              defaultValue={defaultValues["directoryEyebrow"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] font-bold uppercase tracking-widest text-emerald-700"
            />
            <EditableArea
              itemKey="directoryTitle"
              label="Toàn bộ sản phẩm"
              value={configMap["directoryTitle"]?.value}
              defaultValue={defaultValues["directoryTitle"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-sm font-bold text-brand-900 leading-snug"
            />
          </div>
          {/* Decorative grid (non-editable) */}
          <div className="grid grid-cols-4 gap-1 mt-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-4/5 bg-white border border-stone-200 rounded" />
            ))}
          </div>
        </section>

        {/* ── 5. Aspiration CTA (BOTTOM — full edit) ── */}
        <section className="relative py-8 px-6 bg-emerald-950 text-white">
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[7px] font-bold uppercase tracking-wider">
            Bottom — chỉnh đầy đủ
          </div>
          <div className="text-center space-y-2 mt-3 max-w-md mx-auto">
            <EditableArea
              itemKey="aspirationEyebrow"
              label="Bắt đầu ngay"
              value={configMap["aspirationEyebrow"]?.value}
              defaultValue={defaultValues["aspirationEyebrow"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] font-bold uppercase tracking-widest text-amber-300"
            />
            <div className="flex items-baseline justify-center gap-1 flex-wrap">
              <EditableArea
                itemKey="aspirationTitle"
                label="Đưa sản phẩm của bạn vào"
                value={configMap["aspirationTitle"]?.value}
                defaultValue={defaultValues["aspirationTitle"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-base font-bold text-white leading-tight inline-block"
              />
              <EditableArea
                itemKey="aspirationTitleEm"
                label="danh sách trên"
                value={configMap["aspirationTitleEm"]?.value}
                defaultValue={defaultValues["aspirationTitleEm"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-base font-bold text-amber-300 leading-tight inline-block"
              />
            </div>
            <EditableArea
              itemKey="aspirationDesc"
              label="Quá trình chứng nhận đang mở. Không yêu cầu doanh nghiệp lớn..."
              value={configMap["aspirationDesc"]?.value}
              defaultValue={defaultValues["aspirationDesc"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[9px] text-emerald-100/70 leading-relaxed"
            />

            {/* Mini steps */}
            <div className="flex items-center justify-between gap-2 mt-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                  <span className="text-base">
                    {i === 1 ? "📋" : i === 2 ? "👥" : i === 3 ? "🔍" : "🏅"}
                  </span>
                  <EditableArea
                    itemKey={`miniStep${i}`}
                    label={
                      i === 1 ? "Nộp đơn"
                      : i === 2 ? "Hội đồng"
                      : i === 3 ? "Thẩm định"
                      : "Chứng nhận"
                    }
                    value={configMap[`miniStep${i}`]?.value}
                    defaultValue={defaultValues[`miniStep${i}`]}
                    selectedKey={selectedKey}
                    onSelect={onSelect}
                    className="text-[7px] text-emerald-200/85 uppercase tracking-wider"
                  />
                </div>
              ))}
            </div>

            <EditableArea
              itemKey="aspirationCta"
              label="Nộp đơn chứng nhận ngay"
              value={configMap["aspirationCta"]?.value}
              defaultValue={defaultValues["aspirationCta"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[9px] font-bold text-emerald-950 bg-amber-500 rounded px-3 py-1.5 inline-block mt-2"
            />
            <EditableArea
              itemKey="aspirationNote"
              label="Phí thẩm định hoàn lại 100% nếu đơn bị từ chối."
              value={configMap["aspirationNote"]?.value}
              defaultValue={defaultValues["aspirationNote"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[7px] text-emerald-100/55"
            />
          </div>
        </section>
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
        "group relative block w-full rounded-md transition-all duration-200 min-h-[1.5em]",
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
