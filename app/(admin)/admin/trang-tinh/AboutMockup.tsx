"use client"

import { cn } from "@/lib/utils"
import type { StaticPageConfig } from "@prisma/client"

interface Props {
  selectedKey: string | null
  onSelect: (key: string) => void
  configMap: Record<string, StaticPageConfig>
  defaultValues: Record<string, string>
}

export function AboutMockup({ selectedKey, onSelect, configMap, defaultValues }: Props) {
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
          hoitramhuong.vn/gioi-thieu-v2
        </div>
      </div>

      <div className="flex flex-col">
        {/* ── 1. Hero ── */}
        <section className="relative py-12 px-6 text-center bg-brand-50/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border border-brand-900 rounded-full animate-pulse" />
          </div>
          <div className="relative space-y-4 max-w-sm mx-auto">
            <EditableArea
              itemKey="heroEyebrow"
              label="VAWA · Est. 2010"
              value={configMap["heroEyebrow"]?.value}
              defaultValue={defaultValues["heroEyebrow"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] font-bold uppercase tracking-widest text-brand-600"
            />
            <EditableArea
              itemKey="heroTitle"
              label="Về Hội Trầm Hương Việt Nam"
              value={configMap["heroTitle"]?.value}
              defaultValue={defaultValues["heroTitle"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-xl font-bold text-brand-900 leading-tight"
            />
            <EditableArea
              itemKey="heroSub"
              label="Tổ chức xã hội nghề nghiệp kết nối, bảo tồn và nâng tầm giá trị Trầm Hương Việt Nam."
              value={configMap["heroSub"]?.value}
              defaultValue={defaultValues["heroSub"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[9px] text-brand-500 leading-relaxed"
            />
          </div>
        </section>

        {/* ── 2. Stats (Static Decorative) ── */}
        <section className="py-4 border-y border-brand-100 bg-white">
          <div className="grid grid-cols-4 gap-2 px-6">
            {[
              { n: "15+", l: "Năm hoạt động" },
              { n: "600+", l: "Hội viên" },
              { n: "40+", l: "Lãnh đạo" },
              { n: "4", l: "Ngôn ngữ" }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-bold text-brand-900 text-[10px]">{s.n}</div>
                <div className="text-[7px] text-brand-400 uppercase tracking-tighter">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Intro ── */}
        <section className="py-8 px-6 bg-white">
          <div className="grid grid-cols-5 gap-6 items-center">
            <div className="col-span-3 space-y-3">
              <EditableArea
                itemKey="introEyebrow"
                label="Giới thiệu chung"
                value={configMap["introEyebrow"]?.value}
                defaultValue={defaultValues["introEyebrow"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-[8px] font-bold text-brand-600 uppercase tracking-wider"
              />
              <EditableArea
                itemKey="introTitle"
                label="Kết nối tinh hoa, bảo tồn di sản"
                value={configMap["introTitle"]?.value}
                defaultValue={defaultValues["introTitle"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-sm font-bold text-brand-900 leading-snug"
              />
              <div className="space-y-2">
                <EditableArea
                  itemKey="introLead1"
                  label="Hội Trầm Hương Việt Nam thành lập 2010..."
                  value={configMap["introLead1"]?.value}
                  defaultValue={defaultValues["introLead1"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[9px] text-brand-700 leading-relaxed"
                />
                <EditableArea
                  itemKey="introLead2"
                  label="Sứ mệnh của Hội là kết nối cộng đồng..."
                  value={configMap["introLead2"]?.value}
                  defaultValue={defaultValues["introLead2"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[9px] text-brand-700 leading-relaxed"
                />
              </div>
              <div className="pl-3 border-l-2 border-brand-200">
                <EditableArea
                  itemKey="introQuote"
                  label="Trầm Hương Việt Nam — không chỉ là nguyên liệu, mà là di sản."
                  value={configMap["introQuote"]?.value}
                  defaultValue={defaultValues["introQuote"]}
                  selectedKey={selectedKey}
                  onSelect={onSelect}
                  className="text-[9px] italic text-brand-500"
                />
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <button
                type="button"
                onClick={() => onSelect("introImage")}
                className={cn(
                  "block w-full aspect-4/5 rounded-lg overflow-hidden relative border shadow-sm transition-all",
                  selectedKey === "introImage"
                    ? "ring-2 ring-amber-500 ring-offset-2 border-amber-400"
                    : "border-brand-200 hover:ring-2 hover:ring-amber-300 ring-offset-1"
                )}
              >
                {configMap["introImage"]?.value ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={configMap["introImage"].value}
                    alt="intro"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-brand-100 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-brand-500 uppercase">Click để đổi ảnh</span>
                  </div>
                )}
                <span className={cn(
                  "absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider whitespace-nowrap pointer-events-none transition-opacity",
                  selectedKey === "introImage"
                    ? "bg-amber-500 text-white opacity-100"
                    : "bg-amber-200 text-amber-800 opacity-0 hover:opacity-100"
                )}>
                  introImage
                </span>
              </button>
              <EditableArea
                itemKey="introImageCaption"
                label="Rừng gió bầu"
                value={configMap["introImageCaption"]?.value}
                defaultValue={defaultValues["introImageCaption"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-[7px] font-bold text-brand-900 uppercase"
              />
            </div>
          </div>
        </section>

        {/* ── 4. Leadership ── */}
        <section className="py-8 px-6 bg-white text-center border-t border-brand-100">
          <div className="space-y-2 max-w-sm mx-auto">
            <EditableArea
              itemKey="leadershipEyebrow"
              label="Ban lãnh đạo Hội"
              value={configMap["leadershipEyebrow"]?.value}
              defaultValue={defaultValues["leadershipEyebrow"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] font-bold uppercase tracking-widest text-brand-600"
            />
            <EditableArea
              itemKey="leadershipHeading"
              label="Những người <em>dẫn dắt</em>"
              value={configMap["leadershipHeading"]?.value}
              defaultValue={defaultValues["leadershipHeading"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-sm font-bold text-brand-900 leading-snug"
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 max-w-xs mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-brand-100 rounded-full border border-brand-200" />
            ))}
          </div>
        </section>

        {/* ── 5. Org Tree ── */}
        <section className="py-8 px-6 bg-brand-50/20 text-center">
          <div className="space-y-4 max-w-sm mx-auto">
            <div className="space-y-1">
              <EditableArea
                itemKey="orgTitle"
                label="Bộ máy vận hành"
                value={configMap["orgTitle"]?.value}
                defaultValue={defaultValues["orgTitle"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-xs font-bold text-brand-900"
              />
              <EditableArea
                itemKey="orgSub"
                label="Theo Điều lệ sửa đổi, bổ sung 2023"
                value={configMap["orgSub"]?.value}
                defaultValue={defaultValues["orgSub"]}
                selectedKey={selectedKey}
                onSelect={onSelect}
                className="text-[8px] text-brand-400"
              />
            </div>
            <div className="flex flex-col items-center gap-1.5 py-4">
              <div className="px-4 py-1 bg-brand-700 text-white rounded text-[7px] font-bold">Đại hội</div>
              <div className="w-px h-2 bg-brand-200" />
              <div className="px-4 py-1 bg-brand-600 text-white rounded text-[7px] font-bold">Ban Chấp hành</div>
              <div className="w-px h-2 bg-brand-200" />
              <div className="px-4 py-1 bg-white border border-brand-200 text-brand-800 rounded text-[7px] font-bold shadow-sm">Ban Thường vụ</div>
              <div className="w-full flex justify-center gap-4 mt-1">
                 <div className="px-2 py-1 bg-white border border-brand-100 text-brand-600 rounded text-[6px]">Ban Kiểm tra</div>
                 <div className="px-2 py-1 bg-white border border-brand-100 text-brand-600 rounded text-[6px]">Văn phòng</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Members ── */}
        <section className="py-8 px-6 bg-white text-center border-t border-brand-100">
          <div className="space-y-2 max-w-sm mx-auto">
            <EditableArea
              itemKey="membersEyebrow"
              label="Cộng đồng hội viên"
              value={configMap["membersEyebrow"]?.value}
              defaultValue={defaultValues["membersEyebrow"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] font-bold uppercase tracking-widest text-brand-600"
            />
            <EditableArea
              itemKey="membersHeading"
              label="Quy tụ <em>tinh hoa</em>"
              value={configMap["membersHeading"]?.value}
              defaultValue={defaultValues["membersHeading"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-sm font-bold text-brand-900 leading-snug"
            />
            <EditableArea
              itemKey="membersLead"
              label="{count} hội viên VIP · doanh nghiệp · nghệ nhân từ khắp Việt Nam"
              value={configMap["membersLead"]?.value}
              defaultValue={defaultValues["membersLead"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[9px] text-brand-500 leading-relaxed"
            />
          </div>
          <div className="mt-3 grid grid-cols-6 gap-1 max-w-xs mx-auto">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-brand-100 rounded-full border border-brand-200" />
            ))}
          </div>
        </section>

        {/* ── 7. CTA ── */}
        <section className="py-10 px-8 bg-brand-900 text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="relative space-y-3">
            <EditableArea
              itemKey="ctaEyebrow"
              label="Tham gia VAWA"
              value={configMap["ctaEyebrow"]?.value}
              defaultValue={defaultValues["ctaEyebrow"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] font-bold text-brand-300 uppercase tracking-widest"
            />
            <EditableArea
              itemKey="ctaTitle"
              label="Kết nối & Nâng tầm Trầm Hương Việt Nam"
              value={configMap["ctaTitle"]?.value}
              defaultValue={defaultValues["ctaTitle"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-xs font-bold text-white"
            />
            <EditableArea
              itemKey="ctaDesc"
              label="Trở thành hội viên để đồng hành cùng cộng đồng doanh nghiệp Trầm Hương hàng đầu."
              value={configMap["ctaDesc"]?.value}
              defaultValue={defaultValues["ctaDesc"]}
              selectedKey={selectedKey}
              onSelect={onSelect}
              className="text-[8px] text-brand-400 max-w-xs mx-auto leading-normal"
            />
            <div className="inline-block mt-2 px-4 py-1.5 bg-brand-700 text-white font-bold rounded text-[8px] uppercase tracking-wider hover:bg-brand-600 transition-colors">
              Trở thành hội viên
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
        className
      )}
    >
      <span className={cn(
        "block px-2 py-1",
        !displayValue && "text-brand-400 italic font-normal"
      )}>
        {displayValue || label}
      </span>
      
      {/* Label indicator on hover or selected */}
      <span className={cn(
        "absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider whitespace-nowrap transition-opacity pointer-events-none",
        isSelected
          ? "bg-amber-500 text-white opacity-100"
          : "bg-amber-200 text-amber-800 opacity-0 group-hover:opacity-100"
      )}>
        {itemKey}
      </span>

      {/* Edit icon overlay */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center opacity-0 transition-opacity",
        !isSelected && "group-hover:opacity-40"
      )}>
        <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </div>
    </button>
  )
}
