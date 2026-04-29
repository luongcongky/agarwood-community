"use client"

import { useState } from "react"
import type { BannerSlot } from "@prisma/client"
import { cn } from "@/lib/utils"
import {
  BANNER_PAGES,
  BANNER_SLOT_META,
  type BannerPageKey,
  getPageOfSlot,
} from "@/lib/banner-slots"

/**
 * Visual picker — admin chọn trang trước, layout mockup hiện ra với các vùng
 * banner có thể chọn. Click vào vùng → highlight vàng + emit onChange.
 *
 * Mỗi trang dùng 1 mockup template. Hiện có 3 template:
 *  - HomepageMockup        (HOMEPAGE)
 *  - ListPageMockup        (NEWS_LIST, RESEARCH_LIST, AGRICULTURE_LIST, PRESS_LIST)
 *  - DetailPageMockup      (NEWS_DETAIL, RESEARCH_DETAIL, AGRICULTURE_DETAIL,
 *                           PRESS_DETAIL, MULTIMEDIA_DETAIL, FEED)
 *
 * Slot không thuộc trang đang xem → không clickable; slot đang chọn → highlight đậm.
 */

type Props = {
  value?: BannerSlot | null
  onChange: (slot: BannerSlot) => void
}

export function BannerSlotPicker({ value, onChange }: Props) {
  const [pageKey, setPageKey] = useState<BannerPageKey>(() =>
    value ? getPageOfSlot(value) : "HOMEPAGE",
  )

  return (
    <div className="space-y-4">
      {/* ── Page selector combobox ───────────────────────────────────── */}
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Trang
        </span>
        <select
          value={pageKey}
          onChange={(e) => setPageKey(e.target.value as BannerPageKey)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-brand-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          {(Object.entries(BANNER_PAGES) as [BannerPageKey, (typeof BANNER_PAGES)[BannerPageKey]][]).map(
            ([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ),
          )}
        </select>
      </label>

      {/* ── Layout mockup ────────────────────────────────────────────── */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
        <p className="mb-3 text-[11px] uppercase tracking-wider text-neutral-500">
          Bố cục trang &quot;{BANNER_PAGES[pageKey].label}&quot; — click vào vùng để chọn
          vị trí banner
        </p>
        <PageLayoutMockup pageKey={pageKey} selectedSlot={value ?? null} onSlotClick={onChange} />
      </div>

      {/* ── Selected slot info ───────────────────────────────────────── */}
      {value && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs">
          <p className="font-semibold text-amber-900">Đã chọn: {BANNER_SLOT_META[value].label}</p>
          <p className="text-amber-800">{BANNER_SLOT_META[value].description}</p>
        </div>
      )}
    </div>
  )
}

// ── Per-page mockup dispatcher ──────────────────────────────────────────

function PageLayoutMockup({
  pageKey,
  selectedSlot,
  onSlotClick,
}: {
  pageKey: BannerPageKey
  selectedSlot: BannerSlot | null
  onSlotClick: (slot: BannerSlot) => void
}) {
  if (pageKey === "HOMEPAGE") {
    return <HomepageMockup selectedSlot={selectedSlot} onSlotClick={onSlotClick} />
  }
  if (pageKey === "FEED") {
    return <FeedMockup selectedSlot={selectedSlot} onSlotClick={onSlotClick} />
  }
  // 4 chuyên mục list (NEWS / RESEARCH / AGRICULTURE / PRESS) dùng chung template
  if (pageKey.endsWith("_LIST")) {
    const slot = BANNER_PAGES[pageKey].slots[0]
    return (
      <ListPageMockup
        pageLabel={BANNER_PAGES[pageKey].label}
        sidebarSlot={slot}
        selectedSlot={selectedSlot}
        onSlotClick={onSlotClick}
      />
    )
  }
  // 5 trang detail (NEWS / RESEARCH / AGRICULTURE / PRESS / MULTIMEDIA) dùng chung template
  if (pageKey.endsWith("_DETAIL") || pageKey === "MULTIMEDIA_DETAIL") {
    const slot = BANNER_PAGES[pageKey].slots[0]
    return (
      <DetailPageMockup
        pageLabel={BANNER_PAGES[pageKey].label}
        sidebarSlot={slot}
        selectedSlot={selectedSlot}
        onSlotClick={onSlotClick}
      />
    )
  }
  return null
}

// ── Reusable slot box ───────────────────────────────────────────────────

function MockupSlot({
  slot,
  label,
  selectedSlot,
  onSlotClick,
  className,
}: {
  /** Slot value — undefined → block không clickable (chỉ là layout placeholder). */
  slot?: BannerSlot
  label: string
  selectedSlot: BannerSlot | null
  onSlotClick: (slot: BannerSlot) => void
  className?: string
}) {
  const isSelectable = !!slot
  const isSelected = !!slot && slot === selectedSlot

  if (!isSelectable) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded border border-dashed border-neutral-300 bg-white/40 text-[10px] font-medium uppercase tracking-wide text-neutral-400",
          className,
        )}
      >
        {label}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSlotClick(slot)}
      aria-pressed={isSelected}
      className={cn(
        "group flex items-center justify-center rounded border-2 text-[10px] font-bold uppercase tracking-wide transition-all",
        isSelected
          ? "border-amber-600 bg-amber-300/70 text-amber-950 shadow-md ring-2 ring-amber-400 ring-offset-1"
          : "border-amber-400/70 bg-amber-50/60 text-amber-700 hover:border-amber-500 hover:bg-amber-100",
        className,
      )}
    >
      <span className="flex items-center gap-1">
        {isSelected && <span aria-hidden>✓</span>}
        {label}
      </span>
    </button>
  )
}

// ── Mockup: Homepage ─────────────────────────────────────────────────────

function HomepageMockup({
  selectedSlot,
  onSlotClick,
}: {
  selectedSlot: BannerSlot | null
  onSlotClick: (slot: BannerSlot) => void
}) {
  return (
    <div className="space-y-2 rounded border border-neutral-300 bg-white p-3">
      {/* Header strip */}
      <div className="h-6 rounded bg-neutral-200/70" aria-hidden />
      {/* Menu strip */}
      <div className="h-4 rounded bg-brand-700/80" aria-hidden />

      {/* TOP banners — 2 banner trái/phải song song (mỗi banner 485×90) */}
      <div className="grid grid-cols-2 gap-2">
        <MockupSlot
          slot="HOMEPAGE_TOP_LEFT"
          label="Top trái (485×90)"
          selectedSlot={selectedSlot}
          onSlotClick={onSlotClick}
          className="h-10"
        />
        <MockupSlot
          slot="HOMEPAGE_TOP_RIGHT"
          label="Top phải (485×90)"
          selectedSlot={selectedSlot}
          onSlotClick={onSlotClick}
          className="h-10"
        />
      </div>

      {/* News grid + member rail (no banner ở vùng này) */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-9 space-y-1.5">
          <div className="h-24 rounded bg-neutral-200/60" aria-hidden />
          <div className="grid grid-cols-3 gap-1.5">
            <div className="h-12 rounded bg-neutral-200/60" aria-hidden />
            <div className="h-12 rounded bg-neutral-200/60" aria-hidden />
            <div className="h-12 rounded bg-neutral-200/60" aria-hidden />
          </div>
        </div>
        <div
          className="col-span-3 flex items-center justify-center rounded border border-dashed border-neutral-300 bg-white/40 text-[10px] text-neutral-400"
          aria-hidden
        >
          Member rail
        </div>
      </div>

      {/* Section: Multimedia — content trái + sidebar phải */}
      <div className="rounded border border-neutral-200 bg-neutral-50/40 p-1.5 space-y-1.5">
        <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 px-1">
          Section: Multimedia
        </p>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-9 space-y-1.5">
            <div className="h-12 rounded bg-neutral-200/60" aria-hidden />
            <div className="h-12 rounded bg-neutral-200/60" aria-hidden />
          </div>
          <MockupSlot
            slot="HOMEPAGE_MULTIMEDIA_SIDEBAR"
            label="Sidebar (2:3)"
            selectedSlot={selectedSlot}
            onSlotClick={onSlotClick}
            className="col-span-3 h-24"
          />
        </div>
      </div>

      {/* MID banner — wide 5:1 */}
      <MockupSlot
        slot="HOMEPAGE_MID"
        label="Banner Mid (5:1)"
        selectedSlot={selectedSlot}
        onSlotClick={onSlotClick}
        className="h-12"
      />

      {/* Section: Nghiên cứu khoa học — content trái + sidebar phải */}
      <div className="rounded border border-neutral-200 bg-neutral-50/40 p-1.5 space-y-1.5">
        <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 px-1">
          Section: Nghiên cứu khoa học
        </p>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-9 space-y-1.5">
            <div className="h-12 rounded bg-neutral-200/60" aria-hidden />
            <div className="h-12 rounded bg-neutral-200/60" aria-hidden />
          </div>
          <MockupSlot
            slot="HOMEPAGE_RESEARCH_SIDEBAR"
            label="Sidebar (2:3)"
            selectedSlot={selectedSlot}
            onSlotClick={onSlotClick}
            className="col-span-3 h-24"
          />
        </div>
      </div>
    </div>
  )
}

// ── Mockup: List page (chuyên mục/danh sách) ─────────────────────────────

function ListPageMockup({
  pageLabel,
  sidebarSlot,
  selectedSlot,
  onSlotClick,
}: {
  pageLabel: string
  sidebarSlot: BannerSlot
  selectedSlot: BannerSlot | null
  onSlotClick: (slot: BannerSlot) => void
}) {
  return (
    <div className="space-y-2 rounded border border-neutral-300 bg-white p-3">
      <div className="h-6 rounded bg-neutral-200/70" aria-hidden />
      <div className="h-4 rounded bg-brand-700/80" aria-hidden />

      {/* Page heading */}
      <div className="px-1 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          {pageLabel}
        </p>
      </div>

      {/* Hero + sidebar grid */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-9 space-y-1.5">
          {/* Hero article */}
          <div className="h-32 rounded bg-neutral-200/60" aria-hidden />
          {/* Latest list */}
          <div className="space-y-1">
            <div className="h-8 rounded bg-neutral-200/60" aria-hidden />
            <div className="h-8 rounded bg-neutral-200/60" aria-hidden />
            <div className="h-8 rounded bg-neutral-200/60" aria-hidden />
          </div>
        </div>
        <div className="col-span-3 space-y-2">
          {/* Pinned sidebar block */}
          <div className="h-20 rounded bg-neutral-200/60" aria-hidden />
          {/* Banner */}
          <MockupSlot
            slot={sidebarSlot}
            label="Sidebar (2:3)"
            selectedSlot={selectedSlot}
            onSlotClick={onSlotClick}
            className="h-32"
          />
        </div>
      </div>
    </div>
  )
}

// ── Mockup: Detail page ──────────────────────────────────────────────────

function DetailPageMockup({
  pageLabel,
  sidebarSlot,
  selectedSlot,
  onSlotClick,
}: {
  pageLabel: string
  sidebarSlot: BannerSlot
  selectedSlot: BannerSlot | null
  onSlotClick: (slot: BannerSlot) => void
}) {
  return (
    <div className="space-y-2 rounded border border-neutral-300 bg-white p-3">
      <div className="h-6 rounded bg-neutral-200/70" aria-hidden />
      <div className="h-4 rounded bg-brand-700/80" aria-hidden />

      <div className="px-1 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          {pageLabel}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-2">
        {/* Article body */}
        <div className="col-span-9 space-y-1.5">
          <div className="h-6 rounded bg-neutral-300/70" aria-hidden /> {/* title */}
          <div className="h-32 rounded bg-neutral-200/60" aria-hidden /> {/* cover */}
          <div className="h-3 rounded bg-neutral-200/60" aria-hidden />
          <div className="h-3 rounded bg-neutral-200/60" aria-hidden />
          <div className="h-3 w-2/3 rounded bg-neutral-200/60" aria-hidden />
          <div className="h-3 rounded bg-neutral-200/60" aria-hidden />
          <div className="h-3 w-3/4 rounded bg-neutral-200/60" aria-hidden />
        </div>
        {/* Sidebar */}
        <div className="col-span-3 space-y-2">
          <div className="h-20 rounded bg-neutral-200/60" aria-hidden /> {/* pinned */}
          <MockupSlot
            slot={sidebarSlot}
            label="Sidebar (2:3)"
            selectedSlot={selectedSlot}
            onSlotClick={onSlotClick}
            className="h-32"
          />
        </div>
      </div>
    </div>
  )
}

// ── Mockup: Feed (MXH) ───────────────────────────────────────────────────

function FeedMockup({
  selectedSlot,
  onSlotClick,
}: {
  selectedSlot: BannerSlot | null
  onSlotClick: (slot: BannerSlot) => void
}) {
  return (
    <div className="space-y-2 rounded border border-neutral-300 bg-white p-3">
      <div className="h-6 rounded bg-neutral-200/70" aria-hidden />
      <div className="h-4 rounded bg-brand-700/80" aria-hidden />

      <div className="px-1 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          MXH (Feed)
        </p>
      </div>

      <div className="grid grid-cols-12 gap-2">
        {/* Sidebar trái — friend list */}
        <div className="col-span-3 space-y-1.5">
          <div className="h-8 rounded bg-neutral-200/60" aria-hidden />
          <div className="h-8 rounded bg-neutral-200/60" aria-hidden />
          <div className="h-8 rounded bg-neutral-200/60" aria-hidden />
        </div>
        {/* Center feed */}
        <div className="col-span-6 space-y-1.5">
          <div className="h-12 rounded bg-neutral-200/60" aria-hidden />
          <div className="h-20 rounded bg-neutral-200/60" aria-hidden />
          <div className="h-20 rounded bg-neutral-200/60" aria-hidden />
        </div>
        {/* Sidebar phải — banner */}
        <div className="col-span-3 space-y-2">
          <MockupSlot
            slot="FEED_SIDEBAR"
            label="Sidebar (2:3)"
            selectedSlot={selectedSlot}
            onSlotClick={onSlotClick}
            className="h-40"
          />
        </div>
      </div>
    </div>
  )
}
