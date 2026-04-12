"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"

/**
 * React NodeView cho Tiptap Image với drag-to-resize handles.
 *
 * - Click vào ảnh → selected + hiển thị 3 handles
 * - Drag handle góc dưới-phải (SE) để resize giữ aspect ratio
 * - Drag handle giữa-dưới (S) để resize chỉ chiều cao
 * - Drag handle giữa-phải (E) để resize chỉ chiều ngang
 * - Ghi kết quả width/height (px) vào node attributes
 */
export function NodeViewImage({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  // Lưu kích thước drag cuối cùng để commit chính xác (getBoundingClientRect
  // có thể bị cap bởi CSS max-width của container)
  const lastSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })

  const { src, alt, title, width, height, textAlign } = node.attrs as {
    src: string
    alt?: string
    title?: string
    width?: string | null
    height?: string | null
    textAlign?: "left" | "center" | "right" | "justify" | null
  }

  type Handle = "se" | "e" | "s"

  const startResize = useCallback(
    (e: React.MouseEvent, handle: Handle) => {
      e.preventDefault()
      e.stopPropagation()

      const img = imgRef.current
      if (!img) return

      const rect = img.getBoundingClientRect()
      const startX = e.clientX
      const startY = e.clientY
      const startW = rect.width
      const startH = rect.height
      const aspectRatio = startW / startH
      setIsResizing(true)

      lastSizeRef.current = { w: startW, h: startH }

      const onMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        let newW = startW
        let newH = startH

        if (handle === "se") {
          const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy * aspectRatio
          newW = Math.max(50, startW + delta)
          newH = newW / aspectRatio
        } else if (handle === "e") {
          newW = Math.max(50, startW + dx)
          newH = startH
        } else if (handle === "s") {
          newH = Math.max(50, startH + dy)
          newW = startW
        }

        lastSizeRef.current = { w: newW, h: newH }

        img.style.width = `${Math.round(newW)}px`
        img.style.height = `${Math.round(newH)}px`
      }

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)

        const finalW = `${Math.round(lastSizeRef.current.w)}px`
        const finalH = `${Math.round(lastSizeRef.current.h)}px`

        // Defer updateAttributes qua microtask để tránh flushSync-in-lifecycle
        queueMicrotask(() => {
          if (handle === "se" || handle === "e") {
            updateAttributes({ width: finalW, height: handle === "se" ? finalH : null })
          } else {
            updateAttributes({ height: finalH })
          }
        })

        setIsResizing(false)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [updateAttributes],
  )

  // Reset inline style when attrs change (tránh drift giữa DOM + state)
  useEffect(() => {
    const img = imgRef.current
    if (!img || isResizing) return
    img.style.width = width || ""
    img.style.height = height || ""
  }, [width, height, isResizing])

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className="tiptap-image-wrapper block w-full"
      style={{ textAlign: textAlign || undefined }}
    >
      <div className="relative inline-block" data-drag-handle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ""}
          title={title ?? ""}
          className={`editor-image block rounded-md transition-shadow max-w-none! ${
            selected
              ? "ring-4 ring-brand-500 ring-offset-2"
              : "hover:ring-2 hover:ring-brand-300"
          }`}
          style={{
            width: width || undefined,
            height: height || undefined,
            cursor: "pointer",
          }}
          draggable="true"
        />

        {selected && (
          <>
            {/* East (right-middle) — resize width only */}
            <div
              onMouseDown={(e) => startResize(e, "e")}
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 bg-brand-500 border-2 border-white rounded cursor-ew-resize shadow-md hover:scale-110 transition-transform z-10"
              title="Kéo để thay đổi chiều ngang"
            />
            {/* South (bottom-middle) — resize height only */}
            <div
              onMouseDown={(e) => startResize(e, "s")}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-brand-500 border-2 border-white rounded cursor-ns-resize shadow-md hover:scale-110 transition-transform z-10"
              title="Kéo để thay đổi chiều dọc"
            />
            {/* South-East (bottom-right) — resize both keeping aspect */}
            <div
              onMouseDown={(e) => startResize(e, "se")}
              className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-brand-700 border-2 border-white rounded-sm cursor-nwse-resize shadow-md hover:scale-110 transition-transform z-10"
              title="Kéo để thay đổi kích thước (giữ tỉ lệ)"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}
