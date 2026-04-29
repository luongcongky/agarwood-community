import type { BannerSlot } from "@prisma/client"

/**
 * Phase 4 (2026-04-29): Banner gắn với (page, vùng) thay vì global position.
 *
 * Slot suffix encode aspect "shape":
 *  - `_TOP_LEFT`/`_TOP_RIGHT` → 485×90 half-leaderboard (2 banner side-by-side)
 *  - `_MID`                   → 5:1 wide (giữa các section)
 *  - `_SIDEBAR`               → 2:3 portrait (rail dọc bên phải)
 *
 * Single source of truth — render component (BannerLeaderboard, BannerCarousel,
 * CoverImageCropper) đều derive aspect/target size từ đây để tránh lệch.
 */

export type SlotShape = "TOP_HALF" | "MID" | "SIDEBAR"

export type SlotShapeConfig = {
  aspectRatio: number
  targetWidth: number
  targetHeight: number
  /** Tailwind aspect utility cho preview/crop UI. */
  previewClassName: string
  /** Cap width preview admin form — portrait cần giới hạn, landscape full. */
  previewMaxWidthClass: string
}

export const SHAPE_CONFIG: Record<SlotShape, SlotShapeConfig> = {
  TOP_HALF: {
    aspectRatio: 485 / 90,
    targetWidth: 970,
    targetHeight: 180,
    previewClassName: "aspect-[485/90]",
    previewMaxWidthClass: "max-w-full",
  },
  MID: {
    aspectRatio: 5,
    targetWidth: 2560,
    targetHeight: 512,
    previewClassName: "aspect-[5/1]",
    previewMaxWidthClass: "max-w-full",
  },
  SIDEBAR: {
    aspectRatio: 2 / 3,
    targetWidth: 600,
    targetHeight: 900,
    previewClassName: "aspect-[2/3]",
    previewMaxWidthClass: "max-w-xs",
  },
}

export function getSlotShape(slot: BannerSlot): SlotShape {
  if (slot === "HOMEPAGE_TOP_LEFT" || slot === "HOMEPAGE_TOP_RIGHT") return "TOP_HALF"
  if (slot.endsWith("_MID")) return "MID"
  return "SIDEBAR"
}

export function getSlotShapeConfig(slot: BannerSlot): SlotShapeConfig {
  return SHAPE_CONFIG[getSlotShape(slot)]
}

// ── Per-slot metadata ─────────────────────────────────────────────────

export type BannerSlotMeta = {
  label: string
  description: string
}

export const BANNER_SLOT_META: Record<BannerSlot, BannerSlotMeta> = {
  HOMEPAGE_TOP_LEFT: {
    label: "Trang chủ — Top trái (485×90)",
    description: "Banner top trái trang chủ, song song với top phải. Tổng 970×90.",
  },
  HOMEPAGE_TOP_RIGHT: {
    label: "Trang chủ — Top phải (485×90)",
    description: "Banner top phải trang chủ, song song với top trái.",
  },
  HOMEPAGE_MID: {
    label: "Trang chủ — Giữa (5:1)",
    description: "Giữa các section nội dung trang chủ, carousel 5s/banner.",
  },
  HOMEPAGE_RESEARCH_SIDEBAR: {
    label: "Trang chủ — Sidebar Nghiên cứu (2:3)",
    description: "Cột phải section Nghiên cứu khoa học trên trang chủ.",
  },
  HOMEPAGE_MULTIMEDIA_SIDEBAR: {
    label: "Trang chủ — Sidebar Multimedia (2:3)",
    description: "Cột phải section Multimedia trên trang chủ.",
  },
  NEWS_LIST_SIDEBAR: {
    label: "Tin tức — Danh sách / Sidebar (2:3)",
    description: "Cột phải trang /tin-tuc.",
  },
  NEWS_DETAIL_SIDEBAR: {
    label: "Tin tức — Chi tiết / Sidebar (2:3)",
    description: "Cột phải trang chi tiết bài /tin-tuc/[slug].",
  },
  RESEARCH_LIST_SIDEBAR: {
    label: "Nghiên cứu — Danh sách / Sidebar (2:3)",
    description: "Cột phải trang /nghien-cuu.",
  },
  RESEARCH_DETAIL_SIDEBAR: {
    label: "Nghiên cứu — Chi tiết / Sidebar (2:3)",
    description: "Cột phải trang chi tiết bài /nghien-cuu/[slug].",
  },
  AGRICULTURE_LIST_SIDEBAR: {
    label: "Khuyến nông — Danh sách / Sidebar (2:3)",
    description: "Cột phải trang /khuyen-nong.",
  },
  AGRICULTURE_DETAIL_SIDEBAR: {
    label: "Khuyến nông — Chi tiết / Sidebar (2:3)",
    description: "Cột phải trang chi tiết bài /khuyen-nong/[slug].",
  },
  PRESS_LIST_SIDEBAR: {
    label: "Tin báo chí — Danh sách / Sidebar (2:3)",
    description: "Cột phải trang /tin-bao-chi.",
  },
  PRESS_DETAIL_SIDEBAR: {
    label: "Tin báo chí — Chi tiết / Sidebar (2:3)",
    description: "Cột phải trang chi tiết bài /tin-bao-chi/[slug].",
  },
  MULTIMEDIA_DETAIL_SIDEBAR: {
    label: "Multimedia — Chi tiết / Sidebar (2:3)",
    description: "Cột phải trang chi tiết bài /multimedia/[slug].",
  },
  FEED_SIDEBAR: {
    label: "MXH (Feed) — Sidebar (2:3)",
    description: "Cột phải trang /feed (sticky khi scroll).",
  },
}

// ── Page grouping (cho admin picker) ──────────────────────────────────

export type BannerPageKey =
  | "HOMEPAGE"
  | "NEWS_LIST"
  | "NEWS_DETAIL"
  | "RESEARCH_LIST"
  | "RESEARCH_DETAIL"
  | "AGRICULTURE_LIST"
  | "AGRICULTURE_DETAIL"
  | "PRESS_LIST"
  | "PRESS_DETAIL"
  | "MULTIMEDIA_DETAIL"
  | "FEED"

export type BannerPageInfo = {
  label: string
  /** Slot keys khả dụng trên trang này. */
  slots: BannerSlot[]
}

export const BANNER_PAGES: Record<BannerPageKey, BannerPageInfo> = {
  HOMEPAGE: {
    label: "Trang chủ",
    slots: [
      "HOMEPAGE_TOP_LEFT",
      "HOMEPAGE_TOP_RIGHT",
      "HOMEPAGE_MID",
      "HOMEPAGE_RESEARCH_SIDEBAR",
      "HOMEPAGE_MULTIMEDIA_SIDEBAR",
    ],
  },
  NEWS_LIST: {
    label: "Tin tức — danh sách",
    slots: ["NEWS_LIST_SIDEBAR"],
  },
  NEWS_DETAIL: {
    label: "Tin tức — chi tiết",
    slots: ["NEWS_DETAIL_SIDEBAR"],
  },
  RESEARCH_LIST: {
    label: "Nghiên cứu — danh sách",
    slots: ["RESEARCH_LIST_SIDEBAR"],
  },
  RESEARCH_DETAIL: {
    label: "Nghiên cứu — chi tiết",
    slots: ["RESEARCH_DETAIL_SIDEBAR"],
  },
  AGRICULTURE_LIST: {
    label: "Khuyến nông — danh sách",
    slots: ["AGRICULTURE_LIST_SIDEBAR"],
  },
  AGRICULTURE_DETAIL: {
    label: "Khuyến nông — chi tiết",
    slots: ["AGRICULTURE_DETAIL_SIDEBAR"],
  },
  PRESS_LIST: {
    label: "Tin báo chí — danh sách",
    slots: ["PRESS_LIST_SIDEBAR"],
  },
  PRESS_DETAIL: {
    label: "Tin báo chí — chi tiết",
    slots: ["PRESS_DETAIL_SIDEBAR"],
  },
  MULTIMEDIA_DETAIL: {
    label: "Multimedia — chi tiết",
    slots: ["MULTIMEDIA_DETAIL_SIDEBAR"],
  },
  FEED: {
    label: "MXH (Feed)",
    slots: ["FEED_SIDEBAR"],
  },
}

/** Reverse lookup: slot → page key. */
export function getPageOfSlot(slot: BannerSlot): BannerPageKey {
  for (const [pageKey, info] of Object.entries(BANNER_PAGES) as [BannerPageKey, BannerPageInfo][]) {
    if (info.slots.includes(slot)) return pageKey
  }
  return "HOMEPAGE"
}
