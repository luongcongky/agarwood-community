"use client"

import { useState } from "react"
import { resolveMediaUrl, type MediaType } from "./extensions/MediaEmbed"

export interface MediaEmbedModalProps {
  onConfirm: (result: { src: string; type: MediaType }) => void
  onCancel: () => void
}

/**
 * Modal dán URL media. Auto-detect YouTube vs direct audio file.
 * Không cần uploading — URL paste thẳng (YouTube đã host, audio host
 * ở Cloudinary/external).
 */
export function MediaEmbedModal({ onConfirm, onCancel }: MediaEmbedModalProps) {
  const [url, setUrl] = useState("")
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
    onConfirm(result)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-brand-200 px-6 py-4">
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
