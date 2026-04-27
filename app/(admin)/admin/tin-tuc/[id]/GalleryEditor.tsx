"use client"

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import Image from "next/image"
import { resolveMediaUrl } from "@/components/editor/extensions/MediaEmbed"

export type GalleryItem = { url: string; caption: string }

export type GalleryEditorHandle = {
  /** Upload tất cả ảnh blob: trong items lên Cloudinary, đồng bộ items state
   *  qua `onChange`, return danh sách items đã upload xong.
   *  - Mode VIDEO: no-op (URL đã sẵn, không upload).
   *  - Lỗi upload 1 file: throw → caller hiển thị error, không save bài.
   *  Caller (NewsEditor.handleSubmit) gọi trước khi POST/PATCH news. */
  processImages: () => Promise<GalleryItem[]>
}

type Props = {
  /** "PHOTO" → bulk upload ảnh + caption mỗi ảnh.
   *  "VIDEO" → bulk paste URL YouTube + caption mỗi video. */
  mode: "PHOTO" | "VIDEO"
  items: GalleryItem[]
  onChange: (items: GalleryItem[]) => void
  /** Folder upload Cloudinary (mode=PHOTO). Default "tin-tuc". */
  uploadFolder?: string
}

/**
 * Gallery editor cho tin ảnh / tin video.
 *
 * UX (Phase 3.3 — 2026-04, refactored):
 *  - Mode PHOTO: input file multiple → tạo blob URL ngay, hiện preview tức thì,
 *    KHÔNG upload Cloudinary. Upload thật chỉ chạy khi NewsEditor save bài
 *    (qua `processImages()` ref). Tránh waste Cloudinary nếu user huỷ.
 *  - Mode VIDEO: input URL → validate via resolveMediaUrl (hỗ trợ
 *    youtu.be/youtube.com/shorts) → append vào list khi click "+ Thêm".
 *  - Caption tự động lấy filename (mode PHOTO) khi upload xong, user sửa.
 */
export const GalleryEditor = forwardRef<GalleryEditorHandle, Props>(
  function GalleryEditor(
    { mode, items, onChange, uploadFolder = "tin-tuc" },
    ref,
  ) {
    const [error, setError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [videoUrl, setVideoUrl] = useState("")
    const [videoCaption, setVideoCaption] = useState("")

    // Map blob URL → File chờ upload. Sống trong ref để không gây re-render.
    // Cleanup: khi user xoá item / unmount component → revokeObjectURL.
    const pendingFilesRef = useRef<Map<string, File>>(new Map())

    // Cleanup blob URLs khi component unmount để tránh memory leak.
    useEffect(() => {
      const map = pendingFilesRef.current
      return () => {
        for (const url of map.keys()) URL.revokeObjectURL(url)
        map.clear()
      }
    }, [])

    // Expose processImages cho NewsEditor gọi trước khi save.
    useImperativeHandle(
      ref,
      () => ({
        processImages: async () => {
          if (mode !== "PHOTO") return items
          const out: GalleryItem[] = []
          for (const it of items) {
            if (it.url.startsWith("blob:")) {
              const file = pendingFilesRef.current.get(it.url)
              if (!file) {
                // Blob URL không có File trong map → bỏ qua (state lệch)
                continue
              }
              const formData = new FormData()
              formData.append("file", file)
              formData.append("folder", uploadFolder)
              const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              })
              if (!res.ok) {
                throw new Error(`Upload thất bại cho 1 ảnh trong gallery.`)
              }
              const data = await res.json()
              const cloudUrl = (data.secure_url ?? data.url) as string
              out.push({ url: cloudUrl, caption: it.caption })
              URL.revokeObjectURL(it.url)
              pendingFilesRef.current.delete(it.url)
            } else {
              out.push(it)
            }
          }
          // Đồng bộ items state với URL thật để re-render hiện ảnh Cloudinary.
          onChange(out)
          return out
        },
      }),
      [mode, items, onChange, uploadFolder],
    )

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
      const files = Array.from(e.target.files ?? [])
      if (files.length === 0) return
      setError(null)
      // Tạo blob URL local cho mỗi file — preview ngay, không gọi network.
      const newItems: GalleryItem[] = files.map((f) => {
        const blobUrl = URL.createObjectURL(f)
        pendingFilesRef.current.set(blobUrl, f)
        return {
          url: blobUrl,
          caption: f.name.replace(/\.[^.]+$/, ""),
        }
      })
      onChange([...items, ...newItems])
      if (fileInputRef.current) fileInputRef.current.value = ""
    }

    function addVideoUrl() {
      const trimmed = videoUrl.trim()
      if (!trimmed) return
      const resolved = resolveMediaUrl(trimmed)
      if (!resolved || resolved.type !== "youtube") {
        setError(
          "URL không hợp lệ. Chỉ chấp nhận YouTube (youtu.be / youtube.com / shorts).",
        )
        return
      }
      onChange([
        ...items,
        { url: resolved.src, caption: videoCaption.trim() },
      ])
      setVideoUrl("")
      setVideoCaption("")
      setError(null)
    }

    function removeAt(i: number) {
      const removed = items[i]
      // Free blob URL nếu là pending file
      if (removed?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url)
        pendingFilesRef.current.delete(removed.url)
      }
      onChange(items.filter((_, idx) => idx !== i))
    }

    function updateCaption(i: number, caption: string) {
      onChange(items.map((it, idx) => (idx === i ? { ...it, caption } : it)))
    }

    function move(i: number, dir: -1 | 1) {
      const j = i + dir
      if (j < 0 || j >= items.length) return
      const next = items.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      onChange(next)
    }

    // YouTube embed → thumbnail từ youtube img CDN cho preview gallery.
    function ytThumb(src: string): string | null {
      const m = src.match(/youtube\.com\/embed\/([\w-]{11})/)
      return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null
    }

    // Đếm số ảnh chưa upload — hiển thị badge cảnh báo
    const pendingCount = items.filter((it) => it.url.startsWith("blob:")).length

    return (
      <div className="space-y-3">
        {/* Add new section */}
        {mode === "PHOTO" ? (
          <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="text-sm text-brand-600"
            />
            <p className="mt-1 text-[11px] text-brand-500">
              Chọn nhiều ảnh cùng lúc — preview ngay tại trình duyệt. Ảnh sẽ
              upload lên Cloudinary khi bạn bấm <strong>Lưu / Xuất bản</strong>{" "}
              bài viết.
            </p>
            {pendingCount > 0 && (
              <p className="mt-1 text-[11px] font-semibold text-amber-700">
                {pendingCount} ảnh chờ upload — chưa lưu lên Cloudinary.
              </p>
            )}
            {uploading && (
              <p className="mt-1 text-xs text-brand-400">Đang tải lên…</p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50/50 p-4 space-y-2">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="URL YouTube (youtu.be/... hoặc youtube.com/watch?v=...)"
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm font-mono"
            />
            <input
              type="text"
              value={videoCaption}
              onChange={(e) => setVideoCaption(e.target.value)}
              placeholder="Chú thích (tuỳ chọn)"
              className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addVideoUrl}
              className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
            >
              + Thêm video
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* List */}
        {items.length === 0 ? (
          <p className="text-center text-sm italic text-brand-400 py-6">
            Chưa có {mode === "PHOTO" ? "ảnh" : "video"} nào trong gallery.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it, i) => {
              const thumb = mode === "PHOTO" ? it.url : ytThumb(it.url)
              const isPending = it.url.startsWith("blob:")
              const isBlobThumb = mode === "PHOTO" && isPending
              return (
                <li
                  key={`${it.url}-${i}`}
                  className="flex gap-3 rounded-lg border border-brand-200 bg-white p-2"
                >
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded bg-brand-100">
                    {thumb ? (
                      isBlobThumb ? (
                        // Blob URL không qua next/image (next/image yêu cầu
                        // domain whitelist) → dùng <img> thuần. Cloudinary
                        // URLs vẫn dùng next/image bên dưới.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          sizes="128px"
                          className="object-cover"
                          unoptimized={mode === "VIDEO"}
                        />
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">
                        ▶️
                      </div>
                    )}
                    {isPending && (
                      <span className="absolute top-1 left-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                        Chờ lưu
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      type="text"
                      value={it.caption ?? ""}
                      onChange={(e) => updateCaption(i, e.target.value)}
                      placeholder="Chú thích…"
                      className="w-full rounded border border-brand-200 px-2 py-1 text-sm"
                    />
                    <p className="text-[10px] text-brand-400 truncate font-mono">
                      {isPending ? "(local — chưa lưu Cloudinary)" : it.url}
                    </p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded px-2 py-0.5 text-xs text-brand-500 hover:bg-brand-50 disabled:opacity-30"
                      title="Chuyển lên"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1}
                      className="rounded px-2 py-0.5 text-xs text-brand-500 hover:bg-brand-50 disabled:opacity-30"
                      title="Chuyển xuống"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-50"
                      title="Xoá"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  },
)
