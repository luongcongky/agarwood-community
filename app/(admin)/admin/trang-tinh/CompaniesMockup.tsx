"use client"

import { cn } from "@/lib/utils"
import type { StaticPageConfig } from "@prisma/client"

interface Props {
  selectedKey: string | null
  onSelect: (key: string) => void
  configMap: Record<string, StaticPageConfig>
  defaultValues: Record<string, string>
}

export function CompaniesMockup({ selectedKey, onSelect, configMap, defaultValues }: Props) {
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
          hoitramhuong.vn/doanh-nghiep
        </div>
      </div>

      <div className="flex flex-col">
        {/* ── 1. Hero (TOP — full edit) ── */}
        <section className="relative py-8 px-6 bg-white border-b border-brand-100">
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[7px] font-bold uppercase tracking-wider">
            Top — chỉnh đầy đủ
          </div>
          <div className="grid grid-cols-12 gap-4 items-end mt-3">
            <div className="col-span-7 space-y-2">
              <EditableArea
                itemKey="heroEyebrow"
                label="Niên giám hội viên"
                value={configMap["heroEyebrow"]?.value}
                defaultValue={defaultValues["heroEyebrow"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-[8px] font-bold uppercase tracking-widest text-brand-600"
              />
              <EditableArea
                itemKey="heroTitle"
                label="Những doanh nghiệp <em>giữ lửa</em>..."
                value={configMap["heroTitle"]?.value}
                defaultValue={defaultValues["heroTitle"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-base font-bold text-brand-900 leading-tight"
              />
              <EditableArea
                itemKey="heroSub"
                label="Niên giám doanh nghiệp được Hội..."
                value={configMap["heroSub"]?.value}
                defaultValue={defaultValues["heroSub"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-[9px] text-brand-500 leading-relaxed"
              />
            </div>

            <div className="col-span-5 space-y-2">
              <div className="grid grid-cols-3 gap-px bg-brand-200 rounded overflow-hidden ring-1 ring-brand-300">
                <div className="bg-white p-2 text-center">
                  <div className="font-bold text-brand-900 text-[10px]">30+</div>
                  <EditableArea
                    itemKey="statCompanies"
                    label="doanh nghiệp"
                    value={configMap["statCompanies"]?.value}
                    defaultValue={defaultValues["statCompanies"]}
                    selectedKey={selectedKey}
                    onSelect={onSelect}
                    className="text-[7px] text-brand-400 uppercase tracking-tighter mt-0.5"
                  />
                </div>
                <div className="bg-white p-2 text-center">
                  <div className="font-bold text-brand-900 text-[10px]">25+</div>
                  <EditableArea
                    itemKey="statCertProducts"
                    label="sản phẩm chứng nhận"
                    value={configMap["statCertProducts"]?.value}
                    defaultValue={defaultValues["statCertProducts"]}
                    selectedKey={selectedKey}
                    onSelect={onSelect}
                    className="text-[7px] text-brand-400 uppercase tracking-tighter mt-0.5"
                  />
                </div>
                <div className="bg-white p-2 text-center">
                  <div className="font-bold text-brand-900 text-[10px]">15+</div>
                  <EditableArea
                    itemKey="statHeritageYears"
                    label="năm di sản"
                    value={configMap["statHeritageYears"]?.value}
                    defaultValue={defaultValues["statHeritageYears"]}
                    selectedKey={selectedKey}
                    onSelect={onSelect}
                    className="text-[7px] text-brand-400 uppercase tracking-tighter mt-0.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <EditableArea
                  itemKey="ctaJoin"
                  label="Đăng ký hội viên doanh nghiệp"
                  value={configMap["ctaJoin"]?.value}
                  defaultValue={defaultValues["ctaJoin"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[8px] font-bold text-white bg-brand-900 rounded px-2 py-1 text-center"
                />
                <EditableArea
                  itemKey="ctaFeatured"
                  label="Đăng ký vị trí Tiêu biểu"
                  value={configMap["ctaFeatured"]?.value}
                  defaultValue={defaultValues["ctaFeatured"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[8px] font-bold text-brand-900 bg-amber-300 rounded px-2 py-1 text-center"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Featured Spotlight (MIDDLE — header only) ── */}
        <section className="relative py-6 px-6 bg-amber-50/40">
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-brand-100 text-brand-600 text-[7px] font-bold uppercase tracking-wider">
            Giữa — chỉ chỉnh tiêu đề
          </div>
          <div className="space-y-1 mt-3">
            <EditableArea
              itemKey="featuredEyebrow"
              label="Tiêu biểu của Hội"
              value={configMap["featuredEyebrow"]?.value}
              defaultValue={defaultValues["featuredEyebrow"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] font-bold uppercase tracking-widest text-amber-700"
            />
            <EditableArea
              itemKey="featuredTitle"
              label="Những đơn vị tiên phong"
              value={configMap["featuredTitle"]?.value}
              defaultValue={defaultValues["featuredTitle"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-sm font-bold text-brand-900 leading-snug"
            />
          </div>
          {/* Decorative featured cards (non-editable) */}
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            <div className="aspect-16/10 bg-brand-200 rounded ring-1 ring-amber-400/40" />
            <div className="aspect-16/10 bg-brand-200 rounded ring-1 ring-amber-400/40" />
            <div className="aspect-16/10 bg-brand-200 rounded ring-1 ring-amber-400/40" />
          </div>
        </section>

        {/* ── 3. Directory (MIDDLE — header only) ── */}
        <section className="relative py-6 px-6 bg-brand-50/30 border-t border-brand-100">
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-brand-100 text-brand-600 text-[7px] font-bold uppercase tracking-wider">
            Giữa — chỉ chỉnh tiêu đề
          </div>
          <div className="flex justify-between items-end gap-2 mt-3">
            <div className="space-y-1 flex-1">
              <EditableArea
                itemKey="directoryEyebrow"
                label="Toàn bộ hội viên"
                value={configMap["directoryEyebrow"]?.value}
                defaultValue={defaultValues["directoryEyebrow"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-[8px] font-bold uppercase tracking-widest text-brand-600"
              />
              <EditableArea
                itemKey="directoryTitle"
                label="Danh bạ doanh nghiệp"
                value={configMap["directoryTitle"]?.value}
                defaultValue={defaultValues["directoryTitle"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-sm font-bold text-brand-900 leading-snug"
              />
            </div>
            <div className="w-32 h-5 bg-white border border-brand-300 rounded-full text-[7px] text-brand-400 px-2 flex items-center">
              🔍 Tìm kiếm…
            </div>
          </div>
          {/* Decorative grid (non-editable) */}
          <div className="grid grid-cols-3 gap-1 mt-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-16/10 bg-white border border-brand-200 rounded" />
            ))}
          </div>
        </section>

        {/* ── 4. Aspiration CTA (BOTTOM — full edit) ── */}
        <section className="relative py-8 px-6 bg-brand-900 text-white">
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[7px] font-bold uppercase tracking-wider">
            Bottom — chỉnh đầy đủ
          </div>
          <div className="grid grid-cols-12 gap-4 mt-3">
            <div className="col-span-7 space-y-2">
              <EditableArea
                itemKey="ctaJoinEyebrow"
                label="Trở thành hội viên"
                value={configMap["ctaJoinEyebrow"]?.value}
                defaultValue={defaultValues["ctaJoinEyebrow"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-[8px] font-bold uppercase tracking-widest text-amber-400"
              />
              <div className="space-y-0.5">
                <EditableArea
                  itemKey="ctaJoinTitle"
                  label="Vị trí tiếp theo trong niên giám —"
                  value={configMap["ctaJoinTitle"]?.value}
                  defaultValue={defaultValues["ctaJoinTitle"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-base font-bold text-white leading-tight"
                />
                <EditableArea
                  itemKey="ctaJoinTitleEm"
                  label="có thể là bạn."
                  value={configMap["ctaJoinTitleEm"]?.value}
                  defaultValue={defaultValues["ctaJoinTitleEm"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-base font-bold italic text-amber-400 leading-tight"
                />
              </div>
              <EditableArea
                itemKey="ctaJoinDesc"
                label="Tham gia Hội để hiện diện cùng những thương hiệu..."
                value={configMap["ctaJoinDesc"]?.value}
                defaultValue={defaultValues["ctaJoinDesc"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-[9px] text-white/70 leading-relaxed"
              />
            </div>
            <div className="col-span-5 space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded border border-white/15 bg-white/5 p-2 space-y-0.5">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold text-[10px]">0{i}</span>
                    <div className="flex-1 space-y-0.5">
                      <EditableArea
                        itemKey={`benefit${i}Title`}
                        label={
                          i === 1 ? "Niên giám điện tử"
                          : i === 2 ? "Chứng nhận sản phẩm"
                          : "Vị trí Tiêu biểu"
                        }
                        value={configMap[`benefit${i}Title`]?.value}
                        defaultValue={defaultValues[`benefit${i}Title`]}
                        selectedKey={selectedKey}
                        onSelect={onSelect}
                        className="text-[8px] font-bold text-white"
                      />
                      <EditableArea
                        itemKey={`benefit${i}Desc`}
                        label={
                          i === 1 ? "Tên doanh nghiệp xuất hiện trong danh bạ chính thức..."
                          : i === 2 ? "Quy trình thẩm định 5 thành viên hội đồng..."
                          : "Cơ hội được Hội đề cử lên đầu trang..."
                        }
                        value={configMap[`benefit${i}Desc`]?.value}
                        defaultValue={defaultValues[`benefit${i}Desc`]}
                        selectedKey={selectedKey}
                        onSelect={onSelect}
                        className="text-[7px] text-white/65 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
