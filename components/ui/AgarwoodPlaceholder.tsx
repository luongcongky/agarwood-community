import { cn } from "@/lib/utils"

type Props = {
  /** Kích thước của icon text: "xs" | "sm" | "md" | "lg" | "xl" | custom className */
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Dạng khối: "square" (vuông — thumbnail), "rounded" (bo góc), "full" (tròn — avatar) */
  shape?: "square" | "rounded" | "full"
  /** Thêm className cho container (vd: "w-full h-full", "w-16 h-16") */
  className?: string
  /** Tông màu nền: "brand" (nâu sepia — mặc định), "light" (sáng), "dark" (tối) */
  tone?: "brand" | "light" | "dark"
}

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  xs: "text-sm",
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
}

const SHAPE_CLASSES: Record<NonNullable<Props["shape"]>, string> = {
  square: "rounded-none",
  rounded: "rounded-xl",
  full: "rounded-full",
}

const TONE_CLASSES: Record<NonNullable<Props["tone"]>, string> = {
  brand: "bg-brand-700 text-brand-300",
  light: "bg-brand-100 text-brand-400",
  dark: "bg-brand-900 text-brand-400",
}

/**
 * Fallback placeholder cho tất cả các vị trí thiếu ảnh: avatar user, logo DN,
 * thumbnail sản phẩm, cover bài viết, ảnh tin tức,...
 *
 * Icon mặc định: 🌿 (lá trầm hương)
 *
 * Ví dụ:
 *   <AgarwoodPlaceholder className="w-16 h-16" shape="full" size="sm" />  // avatar
 *   <AgarwoodPlaceholder className="w-full h-44" shape="rounded" size="lg" />  // thumbnail
 *   <AgarwoodPlaceholder className="w-full h-full" size="xl" />  // cover bài viết
 */
export function AgarwoodPlaceholder({
  size = "md",
  shape = "rounded",
  tone = "brand",
  className,
}: Props) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center shrink-0 select-none",
        SHAPE_CLASSES[shape],
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className={cn("leading-none", SIZE_CLASSES[size])}>🌿</span>
    </div>
  )
}
