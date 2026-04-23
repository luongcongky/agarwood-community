"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor"

import { slugify } from "@/lib/utils"
import {
  useAdminCanPublishNews,
  PUBLISH_LOCKED_TOOLTIP,
} from "@/components/features/admin/AdminReadOnlyContext"
import { LangTabsBar, computeHasContent, type Locale } from "@/components/ui/lang-tabs-bar"
import { SeoEditorPanel } from "./SeoEditorPanel"

// Lazy-load để không kéo DOMPurify (~100KB) + 140 dòng JSX preview vào
// chunk khởi tạo. Admin thường save rồi mới preview → load on-demand.
const NewsPreviewModal = dynamic(() => import("./NewsPreviewModal"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <span className="text-sm text-brand-600">Đang tải xem trước...</span>
    </div>
  ),
})

// Cropper chỉ dùng khi user chọn ảnh bìa mới — lazy để giảm bundle editor.
const CoverImageCropper = dynamic(
  () => import("@/components/ui/CoverImageCropper").then((m) => m.CoverImageCropper),
  { ssr: false },
)

interface NewsData {
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string
  content: string
  category: "GENERAL" | "RESEARCH" | "LEGAL"
  isPublished: boolean
  isPinned: boolean
  publishedAt: string
}

export default function NewsEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const isNew = id === "moi"
  const router = useRouter()
  // INFINITE được mở khóa để soạn/sửa tin tức — editor không còn bị gate
  // chung theo `readOnly` nữa. Chỉ gate riêng toggle Xuất bản (ADMIN only).
  const publishDisabled = !useAdminCanPublishNews()

  const EMPTY_LANG: Record<Locale, string> = { vi: "", en: "", zh: "", ar: "" }
  const [title, setTitle] = useState<Record<Locale, string>>(EMPTY_LANG)
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState<Record<Locale, string>>(EMPTY_LANG)
  const [content, setContent] = useState<Record<Locale, string>>(EMPTY_LANG)
  const [activeLocale, setActiveLocale] = useState<Locale>("vi")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState("")
  const [category, setCategory] = useState<"GENERAL" | "RESEARCH" | "LEGAL">("GENERAL")
  const [isPublished, setIsPublished] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [publishedAt, setPublishedAt] = useState("")
  const [initialContent, setInitialContent] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!isNew)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // SEO state
  const [focusKeyword, setFocusKeyword] = useState("")
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([])
  const [seoTitle, setSeoTitle] = useState<Record<Locale, string>>(EMPTY_LANG)
  const [seoDescription, setSeoDescription] = useState<Record<Locale, string>>(EMPTY_LANG)
  const [coverImageAlt, setCoverImageAlt] = useState<Record<Locale, string>>(EMPTY_LANG)
  const setSeoTitleField = (l: Locale, v: string) => setSeoTitle((p) => ({ ...p, [l]: v }))
  const setSeoDescriptionField = (l: Locale, v: string) => setSeoDescription((p) => ({ ...p, [l]: v }))
  const setCoverImageAltField = (l: Locale, v: string) => setCoverImageAlt((p) => ({ ...p, [l]: v }))

  const editorRef = useRef<RichTextEditorHandle>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Refs used by the throttled editor->content sync. activeLocaleRef lets
  // the stable handler always read the latest locale; editorDebounceRef
  // collapses bursts of keystrokes into one state update.
  const activeLocaleRef = useRef<Locale>(activeLocale)
  useEffect(() => { activeLocaleRef.current = activeLocale }, [activeLocale])
  const editorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Stable forever — relies on refs to read the latest locale on fire.
  // The locale captured at schedule-time is preserved so a mid-debounce
  // tab switch can't write the previous tab's HTML into the new tab.
  const handleEditorUpdate = useRef((html: string) => {
    if (editorDebounceRef.current) clearTimeout(editorDebounceRef.current)
    const localeAtSchedule = activeLocaleRef.current
    editorDebounceRef.current = setTimeout(() => {
      setContent((prev) => ({ ...prev, [localeAtSchedule]: html }))
    }, 300)
  }).current
  useEffect(() => {
    return () => {
      if (editorDebounceRef.current) clearTimeout(editorDebounceRef.current)
    }
  }, [])

  // Load existing news
  useEffect(() => {
    if (isNew) return

    async function fetchNews() {
      try {
        const res = await fetch(`/api/admin/news/${id}`)
        if (!res.ok) return
        const { news }: { news: NewsData } = await res.json()
        setSlug(news.slug)
        setCoverImageUrl(news.coverImageUrl ?? "")
        setCoverPreview(news.coverImageUrl ?? "")
        setCategory(news.category ?? "GENERAL")
        setIsPublished(news.isPublished)
        setIsPinned(news.isPinned)
        setPublishedAt(
          news.publishedAt
            ? new Date(news.publishedAt).toISOString().slice(0, 16)
            : ""
        )
        setInitialContent(news.content ?? "")
        const n = news as unknown as Record<string, unknown>
        setTitle({
          vi: news.title,
          en: (n.title_en as string) ?? "",
          zh: (n.title_zh as string) ?? "",
          ar: (n.title_ar as string) ?? "",
        })
        setExcerpt({
          vi: news.excerpt ?? "",
          en: (n.excerpt_en as string) ?? "",
          zh: (n.excerpt_zh as string) ?? "",
          ar: (n.excerpt_ar as string) ?? "",
        })
        setContent({
          vi: news.content ?? "",
          en: (n.content_en as string) ?? "",
          zh: (n.content_zh as string) ?? "",
          ar: (n.content_ar as string) ?? "",
        })
        setFocusKeyword((n.focusKeyword as string) ?? "")
        setSecondaryKeywords((n.secondaryKeywords as string[]) ?? [])
        setSeoTitle({
          vi: (n.seoTitle as string) ?? "",
          en: (n.seoTitle_en as string) ?? "",
          zh: (n.seoTitle_zh as string) ?? "",
          ar: (n.seoTitle_ar as string) ?? "",
        })
        setSeoDescription({
          vi: (n.seoDescription as string) ?? "",
          en: (n.seoDescription_en as string) ?? "",
          zh: (n.seoDescription_zh as string) ?? "",
          ar: (n.seoDescription_ar as string) ?? "",
        })
        setCoverImageAlt({
          vi: (n.coverImageAlt as string) ?? "",
          en: (n.coverImageAlt_en as string) ?? "",
          zh: (n.coverImageAlt_zh as string) ?? "",
          ar: (n.coverImageAlt_ar as string) ?? "",
        })
      } finally {
        setFetching(false)
      }
    }

    fetchNews()
  }, [isNew, id])

  function setTitleField(locale: Locale, value: string) {
    setTitle((prev) => ({ ...prev, [locale]: value }))
    if (locale === "vi" && isNew) {
      setSlug(slugify(value))
    }
  }

  async function handleLocaleSwitch(next: Locale) {
    if (next === activeLocale) return
    // Save editor HTML to outgoing locale state.
    // If leaving VI, process pending image uploads first so subsequent AI
    // translate (and save) doesn't carry stale blob: URLs into other locales.
    if (activeLocale === "vi") {
      try { await editorRef.current?.processImages() } catch { /* ignore upload errors; user will see on save */ }
    }
    const currentHtml = editorRef.current?.getHTML() ?? ""
    setContent((prev) => ({ ...prev, [activeLocale]: currentHtml }))
    const incoming = next === activeLocale ? currentHtml : content[next] ?? ""
    editorRef.current?.setContent(incoming)
    setActiveLocale(next)
  }

  // Crop flow: chọn file → mở cropper → crop xong → set coverFile + preview
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  function handleCoverSelect(file: File) {
    // Mở cropper với blob URL của ảnh gốc
    const blobUrl = URL.createObjectURL(file)
    setCropSrc(blobUrl)
  }

  function handleCropDone(croppedBlob: Blob) {
    // Cleanup blob cũ
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)

    const croppedFile = new File([croppedBlob], "cover.jpg", { type: "image/jpeg" })
    setCoverFile(croppedFile)
    const previewUrl = URL.createObjectURL(croppedBlob)
    setCoverPreview(previewUrl)
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    if (coverInputRef.current) coverInputRef.current.value = ""
  }

  function handleCoverRemove() {
    if (coverPreview && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverFile(null)
    setCoverPreview("")
    setCoverImageUrl("")
    if (coverInputRef.current) coverInputRef.current.value = ""
  }

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAiTranslate(targetLocale: Locale) {
    if (targetLocale === "vi") return
    // Ensure VI image blobs are uploaded before the VI HTML is shipped to AI.
    let viContent = content.vi
    if (activeLocale === "vi") {
      try { await editorRef.current?.processImages() } catch { /* surface on save */ }
      viContent = editorRef.current?.getHTML() ?? viContent
      setContent((prev) => ({ ...prev, vi: viContent }))
    }
    if (viContent.includes("blob:")) {
      throw new Error("Ảnh trong bài chưa được upload. Quay lại tab VI và lưu bài trước khi dịch.")
    }
    if (!title.vi.trim() && !excerpt.vi.trim() && !viContent.trim()) {
      throw new Error("Vui lòng nhập tiêu đề / tóm tắt / nội dung tiếng Việt trước khi dịch.")
    }

    const res = await fetch("/api/admin/ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: { title: title.vi, excerpt: excerpt.vi, content: viContent },
        targetLocale,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Lỗi khi dịch.")

    const translated = (data.fields ?? {}) as Record<string, string>
    if (translated.title) setTitle((prev) => ({ ...prev, [targetLocale]: translated.title }))
    if (translated.excerpt) setExcerpt((prev) => ({ ...prev, [targetLocale]: translated.excerpt }))
    if (translated.content) {
      setContent((prev) => ({ ...prev, [targetLocale]: translated.content }))
      // If the translated locale is what's currently shown, reflect in editor too
      if (activeLocale === targetLocale) {
        editorRef.current?.setContent(translated.content)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSaved(false)

    try {
      // Upload cover image if a new file was selected
      let finalCoverUrl = coverImageUrl
      if (coverFile) {
        const formData = new FormData()
        formData.append("file", coverFile)
        formData.append("folder", "tin-tuc")
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
        if (!uploadRes.ok) {
          setError("Tải ảnh bìa thất bại. Vui lòng thử lại.")
          setLoading(false)
          return
        }
        const uploadData = await uploadRes.json()
        finalCoverUrl = uploadData.secure_url ?? uploadData.url
        setCoverImageUrl(finalCoverUrl)
        setCoverFile(null)
      }

      // Upload pending editor images (runs against whichever locale is
      // currently loaded in the editor).
      await editorRef.current?.processImages()
      const activeHtml = editorRef.current?.getHTML() ?? ""
      // Sync the currently-active locale's content with what's in the editor now.
      const finalContent = { ...content, [activeLocale]: activeHtml }

      const body = {
        title: title.vi,
        title_en: title.en || null,
        title_zh: title.zh || null,
        title_ar: title.ar || null,
        slug,
        excerpt: excerpt.vi,
        excerpt_en: excerpt.en || null,
        excerpt_zh: excerpt.zh || null,
        excerpt_ar: excerpt.ar || null,
        coverImageUrl: finalCoverUrl,
        content: finalContent.vi,
        content_en: finalContent.en || null,
        content_zh: finalContent.zh || null,
        content_ar: finalContent.ar || null,
        category,
        isPublished,
        isPinned,
        publishedAt: publishedAt || null,
        // SEO
        focusKeyword: focusKeyword || null,
        secondaryKeywords,
        seoTitle: seoTitle.vi || null,
        seoTitle_en: seoTitle.en || null,
        seoTitle_zh: seoTitle.zh || null,
        seoTitle_ar: seoTitle.ar || null,
        seoDescription: seoDescription.vi || null,
        seoDescription_en: seoDescription.en || null,
        seoDescription_zh: seoDescription.zh || null,
        seoDescription_ar: seoDescription.ar || null,
        coverImageAlt: coverImageAlt.vi || null,
        coverImageAlt_en: coverImageAlt.en || null,
        coverImageAlt_zh: coverImageAlt.zh || null,
        coverImageAlt_ar: coverImageAlt.ar || null,
      }

      const res = await fetch(
        isNew ? "/api/admin/news" : `/api/admin/news/${id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? "Có lỗi xảy ra")
        return
      }

      if (isNew) {
        const { news } = await res.json()
        router.push(`/admin/tin-tuc/${news.id}`)
      } else {
        setSaved(true)
        router.refresh()
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Đang tải...
      </div>
    )
  }

  const displayCover = coverPreview || coverImageUrl

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/tin-tuc"
          className="text-brand-600 hover:text-brand-800 text-sm"
        >
          &larr; Danh sách tin tức
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">
          {isNew ? "Tạo tin tức mới" : "Chỉnh sửa tin tức"}
        </h1>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Xem trước
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
              {/* Language tabs — controls title/excerpt/content together */}
              <LangTabsBar
                activeLocale={activeLocale}
                onLocaleChange={(l) => void handleLocaleSwitch(l)}
                hasContent={computeHasContent(title, excerpt, content)}
                helperText={
                  activeLocale === "vi"
                    ? "Bản tiếng Việt là bản gốc — bắt buộc. Dùng nút AI dịch khi chuyển sang EN / 中文 để dịch toàn bộ tiêu đề + tóm tắt + nội dung trong 1 lần."
                    : undefined
                }
                onAiTranslate={handleAiTranslate}
              />

              {/* Title — driven by active locale */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">
                  Tiêu đề {activeLocale === "vi" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={title[activeLocale]}
                  onChange={(e) => setTitleField(activeLocale, e.target.value)}
                  placeholder={activeLocale === "vi" ? "Tiêu đề bài viết" : `Tiêu đề (${activeLocale.toUpperCase()})`}
                  required={activeLocale === "vi"}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>

              {/* Slug — common across locales */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>

              {/* Excerpt — driven by active locale */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">Tóm tắt</label>
                <textarea
                  value={excerpt[activeLocale]}
                  onChange={(e) =>
                    setExcerpt((prev) => ({ ...prev, [activeLocale]: e.target.value }))
                  }
                  rows={3}
                  placeholder={activeLocale === "vi" ? "Tóm tắt nội dung" : `Tóm tắt (${activeLocale.toUpperCase()})`}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-y"
                />
              </div>

              {/* Cover image — file picker */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">
                  Ảnh bìa
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCoverSelect(file)
                  }}
                />
                {displayCover ? (
                  <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayCover}
                      alt="Cover preview"
                      className="w-full h-40 rounded-lg object-cover border border-brand-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-brand-800 shadow hover:bg-brand-50 transition-colors"
                      >
                        Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={handleCoverRemove}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-red-700 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                    {coverFile && (
                      <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        Chưa upload
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full h-32 rounded-lg border-2 border-dashed border-brand-300 hover:border-brand-500 transition-colors flex flex-col items-center justify-center gap-2 text-brand-400 hover:text-brand-600"
                  >
                    <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span className="text-xs font-medium">Chọn ảnh bìa</span>
                  </button>
                )}
              </div>

              {/* Crop modal */}
              {cropSrc && (
                <CoverImageCropper
                  imageSrc={cropSrc}
                  aspect={16 / 9}
                  onCropDone={handleCropDone}
                  onCancel={handleCropCancel}
                />
              )}
            </div>

            {/* Rich text editor — content for the currently-active locale.
                onUpdate is throttled inside the parent so the SEO panel sees
                body-level criteria (H2, density, intro keyword, ...) update
                in real time as the writer types. */}
            <RichTextEditor
              ref={editorRef}
              initialContent={initialContent}
              uploadFolder="tin-tuc"
              onUpdate={handleEditorUpdate}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-brand-900">Cài đặt xuất bản</h2>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-brand-800 mb-1">
                  Phân loại bài
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "GENERAL" | "RESEARCH" | "LEGAL")}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-xs bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <option value="GENERAL">Tin tức (/tin-tuc)</option>
                  <option value="RESEARCH">Nghiên cứu khoa học (/nghien-cuu)</option>
                  <option value="LEGAL">Văn bản pháp lý (/privacy, /terms)</option>
                </select>
                <p className="mt-1 text-[11px] text-brand-400 leading-snug">
                  Tin tức → /tin-tuc. Nghiên cứu khoa học → /nghien-cuu. Văn bản pháp lý chỉ hiển thị
                  ở /privacy hoặc /terms (theo slug <code>chinh-sach-bao-mat</code>, <code>dieu-khoan-su-dung</code>).
                </p>
              </div>

              {/* Published toggle — chỉ ADMIN bật được. INFINITE thấy toggle
                  mờ + tooltip giải thích phải chờ admin duyệt. Server cũng
                  strip `isPublished` khỏi PATCH body nếu user không có
                  quyền, không chỉ dựa vào UI. */}
              <label
                className={`flex items-center gap-3 ${publishDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                title={publishDisabled ? PUBLISH_LOCKED_TOOLTIP : undefined}
              >
                <div
                  onClick={() => {
                    if (publishDisabled) return
                    setIsPublished((v) => !v)
                  }}
                  aria-disabled={publishDisabled}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isPublished ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isPublished ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
                <span className="text-sm text-brand-800">Xuất bản</span>
                {publishDisabled && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    Chỉ Admin
                  </span>
                )}
              </label>
              {publishDisabled && (
                <p className="-mt-2 text-[11px] leading-snug text-amber-700">
                  Tài khoản Infinite soạn bài và lưu nháp. Admin sẽ review + bật
                  xuất bản khi bài sẵn sàng.
                </p>
              )}

              {/* Pinned toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsPinned((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isPinned ? "bg-brand-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isPinned ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
                <span className="text-sm text-brand-800">Ghim bài</span>
              </label>

              {/* Published at */}
              <div>
                <label className="block text-xs font-medium text-brand-800 mb-1">
                  Ngày xuất bản
                </label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            </div>

            <SeoEditorPanel
              excludeId={isNew ? undefined : id}
              activeLocale={activeLocale}
              title={title}
              excerpt={excerpt}
              content={content}
              slug={slug}
              coverImageUrl={coverImageUrl}
              focusKeyword={focusKeyword}
              setFocusKeyword={setFocusKeyword}
              secondaryKeywords={secondaryKeywords}
              setSecondaryKeywords={setSecondaryKeywords}
              seoTitle={seoTitle}
              setSeoTitleField={setSeoTitleField}
              seoDescription={seoDescription}
              setSeoDescriptionField={setSeoDescriptionField}
              coverImageAlt={coverImageAlt}
              setCoverImageAltField={setCoverImageAltField}
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {saved && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                Đã lưu thay đổi
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {loading
                ? "Đang lưu..."
                : isNew
                ? "Tạo tin tức"
                : "Lưu thay đổi"}
            </button>

            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="w-full rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
            >
              Xem trước bài viết
            </button>
          </div>
        </div>
      </form>

      {/* Lazy modal — code-split, DOMPurify chỉ load khi admin bấm Preview. */}
      {showPreview && (
        <NewsPreviewModal
          category={category}
          title={title}
          activeLocale={activeLocale}
          publishedAt={publishedAt}
          displayCover={displayCover}
          previewContent={editorRef.current?.getHTML() ?? ""}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
