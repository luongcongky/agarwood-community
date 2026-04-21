"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Upload, X, Loader2, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type GalleryImage = {
  id: string
  imageUrl: string
  caption: string | null
}

interface Props {
  companyId: string
  images: GalleryImage[]
  canEdit: boolean
}

const MAX_FILE_MB = 5

export function CompanyGallery({ companyId, images, canEdit }: Props) {
  const t = useTranslations("companyTabs")
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null)

  const onUpload = useCallback(
    async (file: File) => {
      setError(null)
      if (!file.type.startsWith("image/")) {
        setError(t("galleryErrorFormat"))
        return
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setError(t("galleryErrorSize", { max: MAX_FILE_MB }))
        return
      }

      setUploading(true)
      try {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch(`/api/companies/${companyId}/gallery`, {
          method: "POST",
          body: fd,
        })
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({ error: null }))
          throw new Error(msg ?? t("galleryErrorUpload"))
        }
        startTransition(() => router.refresh())
      } catch (e) {
        setError(e instanceof Error ? e.message : t("galleryErrorUpload"))
      } finally {
        setUploading(false)
      }
    },
    [companyId, router, t],
  )

  const onDelete = useCallback(
    async (imageId: string) => {
      if (!confirm(t("galleryConfirmDelete"))) return
      setError(null)
      try {
        const res = await fetch(`/api/companies/${companyId}/gallery/${imageId}`, {
          method: "DELETE",
        })
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({ error: null }))
          throw new Error(msg ?? t("galleryErrorDelete"))
        }
        startTransition(() => router.refresh())
      } catch (e) {
        setError(e instanceof Error ? e.message : t("galleryErrorDelete"))
      }
    },
    [companyId, router, t],
  )

  return (
    <div>
      {canEdit && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            disabled={uploading || isPending}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-brand-700 text-white px-4 py-2 text-sm font-medium hover:bg-brand-800 transition-colors",
              (uploading || isPending) && "opacity-60 cursor-wait",
            )}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4" aria-hidden />
            )}
            {uploading ? t("galleryUploading") : t("galleryUploadBtn")}
          </button>
          <span className="text-xs text-brand-500">
            {t("galleryUploadHint", { max: MAX_FILE_MB })}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onUpload(f)
              e.target.value = "" // reset để upload cùng file lại được
            }}
          />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-10 text-center">
          <p className="text-brand-500 italic text-sm">{t("galleryEmpty")}</p>
          {canEdit && (
            <p className="mt-2 text-xs text-brand-400">{t("galleryEmptyHint")}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-lg bg-brand-100 border border-brand-200"
            >
              <button
                type="button"
                onClick={() => setLightbox(img)}
                className="absolute inset-0 w-full h-full"
                aria-label={img.caption ?? t("galleryViewImage")}
              >
                <Image
                  src={img.imageUrl}
                  alt={img.caption ?? ""}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <span className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/85 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-4 w-4 text-brand-800" aria-hidden />
                </span>
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => onDelete(img.id)}
                  className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  aria-label={t("galleryDelete")}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label={t("galleryClose")}
            className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-w-5xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox.imageUrl}
              alt={lightbox.caption ?? ""}
              width={1600}
              height={1600}
              sizes="100vw"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            {lightbox.caption && (
              <p className="mt-3 text-center text-sm text-white/90">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
