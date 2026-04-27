"use client"

import { useState } from "react"
import { resolveMediaUrl, type MediaType } from "./extensions/MediaEmbed"

export interface MediaEmbedModalProps {
  onConfirm: (result: { src: string; type: MediaType; caption: string }) => void
  onCancel: () => void
}

/**
 * Modal dán URL media. Auto-detect YouTube vs direct audio file.
 * Không cần uploading — URL paste thẳng (YouTube đã host, audio host
 * ở Cloudinary/external).
 */
export function MediaEmbedModal({ onConfirm, onCancel }: MediaEmbedModalProps) {
  const [url, setUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [error, setError] = useState<string | null>(null)

  const trimmed = url.trim()
  const detected = trimmed ? resolveMediaUrl(trimmed) : null
  const showUnsupported = trimmed.length > 0 && !detected

  function handleConfirm() {
    const result = resolveMediaUrl(url)
    if (!result) {
      setError("URL không được hỗ trợ. Chỉ chấp nhận YouTube hoặc audio file (.mp3/.m4a/.ogg/.wav).")
      return
    }
    onConfirm({ ...result, caption: caption.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Close button góc phải — đóng nhanh không cần kéo chuột xuống nút Hủy. */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Đóng"
          className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M4.28 4.28a.75.75 0 011.06 0L10 8.94l4.66-4.66a.75.75 0 111.06 1.06L11.06 10l4.66 4.66a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.66a.75.75 0 11-1.06-1.06L8.94 10 4.28 5.34a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="border-b border-brand-200 px-6 py-4 pr-14">
          <h3 className="text-lg font-bold text-brand-900">Chèn media</h3>
          <p className="mt-1 text-xs text-brand-500">
            Dán URL YouTube (video/shorts) hoặc link audio direct
            (.mp3/.m4a/.ogg/.wav). Reader sẽ xem/nghe trực tiếp ngay trong bài.
          </p>
        </div>

        <div className="space-y-3 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-900">
              URL media
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && detected) handleConfirm()
              }}
              className="w-full rounded-lg border border-brand-300 px-3 py-2 font-mono text-sm"
              placeholder="https://youtu.be/... hoặc https://example.com/track.mp3"
              autoFocus
            />
          </div>

          {detected && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="font-semibold text-emerald-800">
                ✓ Phát hiện: {detected.type === "youtube" ? "Video YouTube" : "File audio"}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-emerald-700">
                {detected.src}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-brand-900">
              Chú thích{" "}
              <span className="text-xs font-normal text-brand-500">
                (tùy chọn — hiển thị dưới video/audio)
              </span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-brand-300 px-3 py-2 text-sm"
              placeholder="Ví dụ: Toàn cảnh hội thảo trầm hương 04/2026."
            />
          </div>

          {showUnsupported && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              URL không hỗ trợ. Chỉ chấp nhận YouTube (youtu.be, youtube.com/watch,
              shorts) hoặc audio direct (.mp3/.m4a/.ogg/.wav).
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!detected}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
          >
            Chèn
          </button>
        </div>
      </div>
    </div>
  )
}
