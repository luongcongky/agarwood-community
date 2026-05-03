"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"
import { cloudinaryResize, cloudinaryBlur } from "@/lib/cloudinary"
import { AgarwoodPlaceholder } from "./AgarwoodPlaceholder"
import { cn } from "@/lib/utils"

type CloudinaryImageProps = Omit<ImageProps, "src" | "placeholder" | "blurDataURL"> & {
  src: string | null | undefined
  /** Chiều rộng giới hạn để resize qua Cloudinary (mặc định 1024) */
  maxWidth?: number
  /** Tông màu của placeholder khi ảnh lỗi hoặc không có */
  fallbackTone?: "brand" | "light" | "dark"
  /** Kích thước icon trong placeholder */
  fallbackSize?: "xs" | "sm" | "md" | "lg" | "xl"
}

/**
 * Wrapper quanh Next.js Image chuyên dụng cho Cloudinary.
 * - Tự động apply transformation resize (c_limit, w_{maxWidth})
 * - Tự động tạo blurDataURL (LQIP)
 * - Xử lý lỗi (404, network error) bằng cách hiện AgarwoodPlaceholder
 * - Xử lý trường hợp src null/undefined
 */
export function CloudinaryImage({
  src,
  alt,
  maxWidth = 1024,
  fallbackTone = "light",
  fallbackSize = "md",
  className,
  ...props
}: CloudinaryImageProps) {
  const [hasRuntimeError, setHasRuntimeError] = useState(false)

  // Nếu src thay đổi, reset lại trạng thái lỗi
  const [prevSrc, setPrevSrc] = useState(src)
  if (src !== prevSrc) {
    setPrevSrc(src)
    setHasRuntimeError(false)
  }

  const currentSrc = src ? cloudinaryResize(src, maxWidth) : null
  const isInvalid = !src || hasRuntimeError

  if (isInvalid || !currentSrc) {
    return (
      <AgarwoodPlaceholder
        className={cn("w-full h-full", className)}
        tone={fallbackTone}
        size={fallbackSize}
        shape={props.fill ? "square" : "rounded"}
      />
    )
  }

  return (
    <Image
      src={currentSrc}
      alt={alt || ""}
      className={cn("transition-opacity duration-300", className)}
      onError={() => setHasRuntimeError(true)}
      placeholder="blur"
      blurDataURL={cloudinaryBlur(src!)}
      {...props}
    />
  )
}
