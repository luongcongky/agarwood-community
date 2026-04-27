"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import type { MediaType } from "./extensions/MediaEmbed"

const MIN_WIDTH = 240
const MAX_WIDTH = 960

/**
 * React NodeView cho MediaEmbed — render iframe/audio trực tiếp trong editor
 * (WYSIWYG) + nút xóa khi được select. Same markup như output public page
 * nên admin thấy đúng UX viewer sẽ nhận.
 *
 * YouTube: drag handle mép phải để co/giãn width. Height tự derive qua
 * `aspect-ratio: 16/9` ở CSS, nên tỉ lệ luôn giữ nguyên.
 * Audio: không resize (control bar auto-fit full width).
 */
export function NodeViewMediaEmbed({ node, selected, updateAttributes, deleteNode }: NodeViewProps) {
  const src = node.attrs.src as string
  const type = node.attrs.type as MediaType
  const width = node.attrs.width as string | null
  const caption = (node.attrs.caption as string) || ""

  const wrapperRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const lastWidthRef = useRef<number>(0)

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const frame = frameRef.current
      if (!frame) return

      const rect = frame.getBoundingClientRect()
      const startX = e.clientX
      const startW = rect.width
      setIsResizing(true)
      lastWidthRef.current = startW

      const onMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX
        const newW = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + dx))
        lastWidthRef.current = newW
        frame.style.width = `${Math.round(newW)}px`
      }

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
        const finalW = `${Math.round(lastWidthRef.current)}px`
        queueMicrotask(() => updateAttributes({ width: finalW }))
        setIsResizing(false)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [updateAttributes],
  )

  // Sync style khi attrs đổi (tránh drift giữa DOM + state sau khi commit)
  useEffect(() => {
    const frame = frameRef.current
    if (!frame || isResizing) return
    frame.style.width = width || ""
  }, [width, isResizing])

  if (!src) {
    return (
      <NodeViewWrapper className="media-embed-placeholder">
        <div className="border-2 border-dashed border-red-300 bg-red-50 p-4 text-center text-sm text-red-700 rounded-lg">
          Media không hợp lệ (thiếu URL).
          <button
            type="button"
            onClick={() => deleteNode()}
            className="ml-2 font-semibold underline"
          >
            Xóa
          </button>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`media-embed-nodeview relative my-6 ${
        selected ? "ring-2 ring-brand-500 ring-offset-2 rounded-lg" : ""
      }`}
    >
      {type === "youtube" ? (
        <div
          ref={frameRef}
          className="relative mx-auto w-full max-w-[960px] aspect-video overflow-hidden rounded-lg bg-black"
          style={{ width: width || undefined }}
        >
          <iframe
            src={src}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            title="YouTube embed"
          />
          {/* Overlay bắt click xuyên qua iframe trong lúc resize để không mất
              chuột (iframe nuốt pointer events). */}
          {isResizing && <div className="absolute inset-0 z-10 cursor-ew-resize" />}
          {selected && (
            <div
              onMouseDown={startResize}
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-10 bg-brand-500 border-2 border-white rounded cursor-ew-resize shadow-md hover:scale-110 transition-transform z-20"
              title="Kéo để thay đổi chiều ngang (giữ tỉ lệ 16:9)"
            />
          )}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[720px] rounded-lg bg-brand-50 p-3 border border-brand-200">
          <audio src={src} controls preload="metadata" className="w-full" />
          <p className="mt-1 font-mono text-[11px] text-brand-500 truncate">{src}</p>
        </div>
      )}

      {selected && (
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => deleteNode()}
          className="absolute top-2 right-2 z-30 rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow hover:bg-red-700"
          title="Xóa media"
        >
          ✕ Xóa
        </button>
      )}

      {/* Caption — input khi selected (cho admin sửa nhanh), <p> tĩnh khi không
          select. Dùng contentEditable=false để ProseMirror không nhầm là text
          node bên trong; lưu qua updateAttributes onBlur. */}
      <div className="mx-auto mt-1 max-w-[960px]" contentEditable={false}>
        {selected ? (
          <input
            type="text"
            defaultValue={caption}
            onBlur={(e) => updateAttributes({ caption: e.target.value })}
            placeholder="Nhập chú thích cho video/audio…"
            className="w-full text-center text-[13px] italic text-neutral-600 placeholder:text-neutral-400 bg-transparent border-0 border-b border-dashed border-brand-300 focus:border-brand-600 focus:outline-none px-2 py-0.5"
          />
        ) : caption ? (
          <p className="text-center text-[13px] italic text-neutral-600 leading-snug">
            {caption}
          </p>
        ) : null}
      </div>
    </NodeViewWrapper>
  )
}
