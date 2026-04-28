"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor"

import { slugify, cn } from "@/lib/utils"
import {
  useAdminCanPublishNews,
  useAdminCurrentUser,
  useHasAdminPerm,
} from "@/components/features/admin/AdminReadOnlyContext"
import { LangTabsBar, computeHasContent, type Locale } from "@/components/ui/lang-tabs-bar"
import { SeoEditorPanel } from "./SeoEditorPanel"
import { UserPicker } from "@/app/(admin)/admin/ban-lanh-dao/UserPicker"
import {
  CompanyPicker,
  type CompanySummary,
  type ProductSummary,
} from "./CompanyProductPickers"
import { GalleryEditor, type GalleryItem, type GalleryEditorHandle } from "./GalleryEditor"
import { ProductSidecar, type ProductSidecarHandle } from "./ProductSidecar"

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

type NewsCategoryUI =
  | "GENERAL"
  | "RESEARCH"
  | "LEGAL"
  | "BUSINESS"
  | "PRODUCT"
  | "EXTERNAL_NEWS"
  | "AGRICULTURE"
type NewsTemplateUI = "NORMAL" | "PHOTO" | "VIDEO"

interface NewsData {
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string
  content: string
  category: NewsCategoryUI
  // Phase 3.7 round 4 (2026-04): max 3 secondary categories.
  secondaryCategories?: NewsCategoryUI[]
  // Phase 3.7 round 4 (2026-04): admin-only pin per-section trên trang chủ.
  pinnedInCategories?: NewsCategoryUI[]
  template: NewsTemplateUI
  relatedCompanyId: string | null
  relatedProductId: string | null
  gallery: GalleryItem[] | null
  isPublished: boolean
  isPinned: boolean
  publishedAt: string
  // Phase 3.5 (2026-04): EXTERNAL_NEWS — admin curate tin báo chí ngoài.
  sourceName?: string | null
  sourceUrl?: string | null
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
  const currentUser = useAdminCurrentUser()
  const canPickAuthor = useHasAdminPerm("admin:full")

  const EMPTY_LANG: Record<Locale, string> = { vi: "", en: "", zh: "", ar: "" }
  const [title, setTitle] = useState<Record<Locale, string>>(EMPTY_LANG)
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState<Record<Locale, string>>(EMPTY_LANG)
  const [content, setContent] = useState<Record<Locale, string>>(EMPTY_LANG)
  const [activeLocale, setActiveLocale] = useState<Locale>("vi")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState("")
  const [category, setCategory] = useState<NewsCategoryUI>("GENERAL")
  // Phase 3.7 round 4 (2026-04): max 3 phân loại phụ — bài hiện thêm ở các
  // list page khác (vd primary=BUSINESS + secondary=RESEARCH → /tin-tuc + /nghien-cuu).
  const [secondaryCategories, setSecondaryCategories] = useState<NewsCategoryUI[]>([])
  // Phase 3.7 round 4 (2026-04): admin-only ghim bài lên section homepage cụ
  // thể (mở rộng visibility cross-list). Khác secondaryCategories: không
  // ràng buộc max, không exclude primary, server cũng strip nếu non-admin.
  const [pinnedInCategories, setPinnedInCategories] = useState<NewsCategoryUI[]>([])
  const [template, setTemplate] = useState<NewsTemplateUI>("NORMAL")
  const [relatedCompany, setRelatedCompany] = useState<CompanySummary | null>(null)
  const [relatedProduct, setRelatedProduct] = useState<ProductSummary | null>(null)
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [publishedAt, setPublishedAt] = useState("")

  /** Format Date thành chuỗi `YYYY-MM-DDTHH:MM` theo LOCAL timezone — đúng
   *  format mà `<input type="datetime-local">` expect. Trước đây dùng
   *  `.toISOString().slice(0, 16)` ra UTC nên giờ hiển thị sai múi giờ
   *  (hoặc trống nếu DB null mà user thấy `mm/dd/yyyy --:-- --`). */
  function toLocalDatetimeInput(input: string | Date): string {
    const d = typeof input === "string" ? new Date(input) : input
    if (Number.isNaN(d.getTime())) return ""
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  // Author selector — default = current user khi tạo mới; load từ news.author
  // khi sửa. Chỉ admin:full được chọn author khác → UserPicker disable cho
  // INFINITE/Ban Thư ký.
  type AuthorSummary = {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    role: string
    accountType: string
    isActive: boolean
    company: { name: string } | null
  }
  const [author, setAuthor] = useState<AuthorSummary | null>(null)
  const [initialContent, setInitialContent] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!isNew)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Phase 3.3 Q5 (2026-04): "Lời giới thiệu" cho category=PRODUCT — đoạn mở
  // đầu admin viết riêng cho bài tin (1-2 câu). Server prepend vào News.content
  // trước Product.description khi save. VI-only (rare cần dịch riêng intro).
  const [newsIntro, setNewsIntro] = useState("")

  // Phase 3.5 (2026-04): source attribution cho category=EXTERNAL_NEWS —
  // admin curate tin báo chí ngoài, bắt buộc tên báo + URL bài gốc.
  const [sourceName, setSourceName] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")

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
  const galleryRef = useRef<GalleryEditorHandle>(null)
  const productSidecarRef = useRef<ProductSidecarHandle>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // ── Auto-translate cache (VI blur → EN/ZH/AR silent) ───────────────────
  //
  // Ba field (title/excerpt/content) × ba locale (en/zh/ar) = 9 slot. Mỗi
  // slot lưu `viHash` (hash của VI source lúc dịch) + kết quả. Dedupe logic:
  //  - Nếu blur mà VI hash trùng slot hiện có → skip (không gọi lại AI).
  //  - Nếu có request inFlight cùng key → skip.
  //  - Nếu state locale đã có value (user tự gõ) → skip luôn, không overwrite.
  //
  // Khi request xong: update cache + auto-fill nếu state locale vẫn rỗng.
  // Server-side `after()` sẽ bắt các locale còn thiếu khi Save (xem API route).
  type AutoLocale = "en" | "zh" | "ar"
  type FieldKey = "title" | "excerpt" | "content"
  type CacheSlot = { viHash: string; translated: string }
  type TranslationCache = Record<FieldKey, Partial<Record<AutoLocale, CacheSlot>>>
  const translationCacheRef = useRef<TranslationCache>({
    title: {}, excerpt: {}, content: {},
  })
  const translationInFlightRef = useRef<Set<string>>(new Set())
  const [translating, setTranslating] = useState<Record<AutoLocale, boolean>>({
    en: false, zh: false, ar: false,
  })

  // Hash đơn giản (djb2) — đủ để dedupe, không cần crypto.
  function hashString(s: string): string {
    let h = 5381
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
    }
    return h.toString(36)
  }

  // Refs để closure translation đọc state mới nhất (tránh tái-tạo handler).
  const titleRef = useRef(title)
  const excerptRef = useRef(excerpt)
  const contentRef = useRef(content)
  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { excerptRef.current = excerpt }, [excerpt])
  useEffect(() => { contentRef.current = content }, [content])

  /** Chạy 1 fetch dịch cho 1 field × 1 locale. Dedupe bằng in-flight set. */
  async function translateFieldToLocale(
    field: FieldKey,
    locale: AutoLocale,
    viValue: string,
    viHash: string,
  ) {
    const inFlightKey = `${field}:${locale}:${viHash}`
    if (translationInFlightRef.current.has(inFlightKey)) return
    translationInFlightRef.current.add(inFlightKey)
    setTranslating((prev) => ({ ...prev, [locale]: true }))
    try {
      const res = await fetch("/api/admin/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: { [field]: viValue },
          targetLocale: locale,
        }),
      })
      if (!res.ok) return
      const data = (await res.json()) as { fields?: Record<string, string> }
      const translated = data.fields?.[field]
      if (!translated) return

      // Update cache (kể cả user đã gõ — để Save payload có sẵn).
      translationCacheRef.current[field][locale] = { viHash, translated }

      // Auto-fill: chỉ khi state locale đó CÒN trống (không overwrite user-typed).
      const stateMap =
        field === "title" ? titleRef.current
        : field === "excerpt" ? excerptRef.current
        : contentRef.current
      const currentValue = stateMap[locale]?.trim() ?? ""
      if (currentValue.length > 0) return // user đã gõ

      if (field === "content") {
        // Nếu đang ở tab locale này → cần cập nhật editor ref nữa (state
        // thôi chưa đủ vì editor chạy qua ref, không re-render theo state).
        if (activeLocaleRef.current === locale) {
          const liveHtml = editorRef.current?.getHTML()?.trim() ?? ""
          // Double-check: nếu editor có content non-empty (user mới gõ trong
          // khi đang wait network), skip.
          if (liveHtml && liveHtml !== "<p></p>") return
          editorRef.current?.setContent(translated)
        }
        setContent((prev) =>
          prev[locale]?.trim() ? prev : { ...prev, [locale]: translated },
        )
      } else if (field === "title") {
        setTitle((prev) =>
          prev[locale]?.trim() ? prev : { ...prev, [locale]: translated },
        )
      } else {
        setExcerpt((prev) =>
          prev[locale]?.trim() ? prev : { ...prev, [locale]: translated },
        )
      }
    } catch (e) {
      console.warn(`[auto-translate] ${field}/${locale} failed`, e)
      // Silent: user có nút AI thủ công để retry khi cần.
    } finally {
      translationInFlightRef.current.delete(inFlightKey)
      // Reset "translating" flag chỉ khi không còn task nào cho locale này.
      const stillWorking = [...translationInFlightRef.current].some((k) =>
        k.includes(`:${locale}:`),
      )
      if (!stillWorking) {
        setTranslating((prev) => ({ ...prev, [locale]: false }))
      }
    }
  }

  /** Blur handler chung cho title/excerpt/content. Fan out 3 locale.
   *  Call site chỉ trigger khi viValue là VI (không phải tab ngoại ngữ). */
  function scheduleAutoTranslate(field: FieldKey, viValue: string) {
    const trimmed = viValue?.trim() ?? ""
    if (!trimmed) return
    const viHash = hashString(trimmed)
    const cacheForField = translationCacheRef.current[field]
    const locales: AutoLocale[] = ["en", "zh", "ar"]
    for (const locale of locales) {
      // Skip nếu cache đã có kết quả cùng hash.
      if (cacheForField[locale]?.viHash === viHash) continue
      // Skip nếu user đã tự gõ vào locale đó — không overwrite.
      const stateMap =
        field === "title" ? titleRef.current
        : field === "excerpt" ? excerptRef.current
        : contentRef.current
      if (stateMap[locale]?.trim()) continue
      void translateFieldToLocale(field, locale, viValue, viHash)
    }
  }

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

  // Default author = current user khi tạo mới — admin có thể đổi via UserPicker.
  useEffect(() => {
    if (!isNew || author || !currentUser) return
    setAuthor({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      avatarUrl: currentUser.avatarUrl,
      role: "",
      accountType: "",
      isActive: true,
      company: null,
    })
  }, [isNew, author, currentUser])

  // Load existing news
  useEffect(() => {
    if (isNew) return

    async function fetchNews() {
      try {
        const res = await fetch(`/api/admin/news/${id}`)
        if (!res.ok) return
        const { news, author: authorData }: { news: NewsData; author: AuthorSummary | null } = await res.json()
        if (authorData) {
          // Backfill optional fields nếu API không trả (UserPicker cần)
          setAuthor({
            ...authorData,
            role: authorData.role ?? "",
            accountType: authorData.accountType ?? "",
            isActive: authorData.isActive ?? true,
            company: authorData.company ?? null,
          })
        }
        setSlug(news.slug)
        setCoverImageUrl(news.coverImageUrl ?? "")
        setCoverPreview(news.coverImageUrl ?? "")
        setCategory(news.category ?? "GENERAL")
        setSecondaryCategories(
          Array.isArray(news.secondaryCategories)
            ? (news.secondaryCategories as NewsCategoryUI[])
            : [],
        )
        setPinnedInCategories(
          Array.isArray(news.pinnedInCategories)
            ? (news.pinnedInCategories as NewsCategoryUI[])
            : [],
        )
        setTemplate(news.template ?? "NORMAL")
        // Normalize gallery items: đảm bảo caption luôn là string (legacy
        // data có thể thiếu field) → tránh React warning "uncontrolled to
        // controlled" khi binding vào <input value>.
        if (Array.isArray(news.gallery)) {
          const raw = news.gallery as Array<Record<string, unknown>>
          setGallery(
            raw
              .filter((g) => !!g && typeof g === "object")
              .map((g) => ({
                url: typeof g.url === "string" ? g.url : "",
                caption: typeof g.caption === "string" ? g.caption : "",
              }))
              .filter((g) => g.url),
          )
        }
        // Load company/product chi tiết qua API search by id (1 hit mỗi cái).
        if (news.relatedCompanyId) {
          fetch(`/api/admin/companies/search?q=${encodeURIComponent(news.relatedCompanyId)}&limit=1`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              const c = (d?.companies as CompanySummary[] | undefined)?.find(
                (x) => x.id === news.relatedCompanyId,
              )
              if (c) setRelatedCompany(c)
            })
            .catch(() => {})
        }
        if (news.relatedProductId) {
          fetch(`/api/admin/products/search?q=${encodeURIComponent(news.relatedProductId)}&limit=1`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              const p = (d?.products as ProductSummary[] | undefined)?.find(
                (x) => x.id === news.relatedProductId,
              )
              if (p) setRelatedProduct(p)
            })
            .catch(() => {})
        }
        setIsPublished(news.isPublished)
        setIsPinned(news.isPinned)
        setSourceName(news.sourceName ?? "")
        setSourceUrl(news.sourceUrl ?? "")
        // Load publishedAt theo LOCAL timezone (input datetime-local). Trước
        // đây dùng toISOString → giờ UTC, sai múi giờ. Giờ dùng helper
        // toLocalDatetimeInput.
        setPublishedAt(news.publishedAt ? toLocalDatetimeInput(news.publishedAt) : "")
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

      // Gallery (template=PHOTO/VIDEO): upload các blob: URL lên Cloudinary,
      // get items đã resolved → dùng làm payload `gallery`. Fail upload =>
      // throw → catch ở handleSubmit hiển thị error, không save bài (tránh
      // lưu gallery có blob URL local mà sau reload sẽ broken).
      let finalGallery: GalleryItem[] = gallery
      if (template !== "NORMAL" && galleryRef.current) {
        try {
          finalGallery = await galleryRef.current.processImages()
        } catch (e) {
          setError(e instanceof Error ? e.message : "Upload ảnh gallery thất bại")
          setLoading(false)
          return
        }
      }

      // Product sidecar (chỉ khi tạo News PRODUCT mới — Phase 3.3 Q5).
      // Validate sớm trước khi gọi API để tránh upload thừa, error rõ ràng.
      let productData: Awaited<ReturnType<NonNullable<typeof productSidecarRef.current>["collect"]>> | null = null
      if (isNew && category === "PRODUCT") {
        const validationError = productSidecarRef.current?.validate()
        if (validationError) {
          setError(validationError)
          setLoading(false)
          return
        }
        productData = (await productSidecarRef.current?.collect()) ?? null
      }

      // Phase 3.3 Q5: PRODUCT + isNew dùng simplified payload — chỉ gửi
      // productData + intro. Server tự derive News.title/slug/excerpt/cover/
      // content từ Product. I18n News cũng inherit từ Product. Tránh admin
      // điền 2 lần (tên SP vs title bài, mô tả SP vs nội dung bài).
      const productMode = isNew && category === "PRODUCT" && !!productData
      const body = productMode
        ? {
            category,
            secondaryCategories,
            pinnedInCategories,
            template,
            relatedCompanyId: relatedCompany?.id ?? null,
            productData,
            intro: newsIntro || null,
            isPublished,
            isPinned,
            publishedAt: publishedAt || null,
            ...(canPickAuthor && author ? { authorId: author.id } : {}),
          }
        : {
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
            secondaryCategories,
            pinnedInCategories,
            template,
            relatedCompanyId: relatedCompany?.id ?? null,
            // Tạo mới News PRODUCT → chỉ gửi `productData`, server tự tạo Product
            // và set `relatedProductId`. Edit/khác category → giữ ID hiện tại.
            relatedProductId: productData ? null : relatedProduct?.id ?? null,
            productData,
            gallery: template === "NORMAL" ? null : finalGallery,
            isPublished,
            isPinned,
            publishedAt: publishedAt || null,
            // Author override — chỉ admin:full được API accept; user khác bị
            // strip ở server. Bỏ qua nếu không có (giữ author hiện tại).
            ...(canPickAuthor && author ? { authorId: author.id } : {}),
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
            // Phase 3.5: source attribution cho EXTERNAL_NEWS.
            sourceName: category === "EXTERNAL_NEWS" ? sourceName.trim() || null : null,
            sourceUrl: category === "EXTERNAL_NEWS" ? sourceUrl.trim() || null : null,
            // Yêu cầu server chạy after() dịch các locale content còn thiếu.
            // Ngay cả khi user rời trang sau khi Save, translation tiếp tục
            // server-side + lưu vào DB (xem lib/news-auto-translate.ts).
            autoTranslateMissing: true,
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
            {/* PRODUCT MODE — Phase 3.3 Q5 (2026-04, customer feedback)
                ────────────────────────────────────────────────────────
                Khi tạo mới + category=PRODUCT: ẩn toàn bộ News card + body
                editor (title/slug/excerpt/cover/content) — server derive hết
                từ Product. Admin chỉ điền Product fields + 1 đoạn intro
                ngắn (optional). Tránh confusion 2 editor + 2 slug + 2
                cover + i18n trùng lặp. */}
            {isNew && category === "PRODUCT" ? (
              <>
                <ProductSidecar ref={productSidecarRef} uploadFolder="san-pham" />
                <div className="rounded-xl border border-brand-200 bg-white p-5 shadow-sm space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-brand-900">Lời giới thiệu (tuỳ chọn)</h3>
                    <p className="mt-0.5 text-[11px] text-brand-500 leading-snug">
                      1-2 câu mở đầu kiểu &quot;biên tập&quot; sẽ chèn lên đầu bài tin trước
                      mô tả sản phẩm. Bỏ trống nếu chỉ cần đăng nguyên mô tả SP.
                    </p>
                  </div>
                  <textarea
                    value={newsIntro}
                    onChange={(e) => setNewsIntro(e.target.value)}
                    rows={3}
                    placeholder="Ví dụ: Doanh nghiệp X vừa ra mắt dòng sản phẩm Y với công thức cải tiến..."
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-y"
                  />
                  <div className="rounded-md bg-brand-50/60 border border-brand-200 px-3 py-2 text-[11px] text-brand-700 leading-relaxed">
                    <p className="font-semibold text-brand-800 mb-1">📰 Bài tin sẽ tự động:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Tiêu đề = <strong>tên sản phẩm</strong></li>
                      <li>Đường link = <code className="bg-white px-1 rounded">/tin-tuc/[slug-SP]</code></li>
                      <li>Ảnh bìa = <strong>ảnh đại diện</strong> của SP</li>
                      <li>Nội dung = lời giới thiệu (nếu có) + <strong>mô tả SP</strong></li>
                      <li>Đa ngôn ngữ = lấy từ bản dịch SP (nếu có)</li>
                    </ul>
                  </div>
                </div>
              </>
            ) : (
            <>
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
              {/* Language tabs — controls title/excerpt/content together */}
              <LangTabsBar
                activeLocale={activeLocale}
                onLocaleChange={(l) => void handleLocaleSwitch(l)}
                hasContent={computeHasContent(title, excerpt, content)}
                helperText={
                  activeLocale === "vi"
                    ? "Bản tiếng Việt là bản gốc — bắt buộc. Hệ thống tự dịch sang EN / 中文 / العربية khi bạn rời khỏi ô (không ghi đè nếu đã gõ thủ công)."
                    : undefined
                }
                onAiTranslate={handleAiTranslate}
              />

              {/* Auto-translate indicator — hiện khi có request đang chạy nền.
                  Badge mờ, không block user action. Dedupe dựa trên content
                  hash — in/out focus nhiều lần không đổi content sẽ không fire
                  lại request. */}
              {(translating.en || translating.zh || translating.ar) && (
                <div className="flex items-center gap-2 rounded-md bg-brand-50 border border-brand-200 px-3 py-1.5 text-[11px] text-brand-700">
                  <svg className="size-3.5 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                  </svg>
                  <span>
                    Đang tự dịch sang{" "}
                    {[
                      translating.en && "EN",
                      translating.zh && "中文",
                      translating.ar && "العربية",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    … Không ghi đè nếu bạn đã gõ thủ công.
                  </span>
                </div>
              )}

              {/* Title — driven by active locale */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">
                  Tiêu đề {activeLocale === "vi" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={title[activeLocale]}
                  onChange={(e) => setTitleField(activeLocale, e.target.value)}
                  onBlur={(e) => {
                    // Chỉ trigger auto-translate khi user đang ở tab VI
                    // (blur từ EN/ZH/AR là user tự sửa bản dịch — skip).
                    if (activeLocale === "vi") {
                      scheduleAutoTranslate("title", e.target.value)
                    }
                  }}
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
                  onBlur={(e) => {
                    if (activeLocale === "vi") {
                      scheduleAutoTranslate("excerpt", e.target.value)
                    }
                  }}
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

            {/* Body editor — đổi theo template:
                NORMAL: RichTextEditor (text + ảnh + video chèn lẫn)
                PHOTO/VIDEO: GalleryEditor (bulk upload + caption mỗi mục) */}
            {template === "NORMAL" ? (
              <RichTextEditor
                ref={editorRef}
                initialContent={initialContent}
                uploadFolder="tin-tuc"
                onUpdate={handleEditorUpdate}
                onBlur={(html) => {
                  // Trigger auto-translate khi VI editor mất focus. Dedupe ở
                  // `scheduleAutoTranslate` qua content-hash — in/out focus
                  // nhiều lần không đổi content → chỉ 1 API call.
                  if (activeLocaleRef.current === "vi") {
                    scheduleAutoTranslate("content", html)
                  }
                }}
              />
            ) : (
              <div className="rounded-xl border border-brand-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-brand-900">
                  {template === "PHOTO" ? "Bộ ảnh" : "Danh sách video"}
                </p>
                <GalleryEditor
                  ref={galleryRef}
                  mode={template}
                  items={gallery}
                  onChange={setGallery}
                  uploadFolder="tin-tuc"
                />
              </div>
            )}
            </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-brand-900">Cài đặt xuất bản</h2>

              {/* Category — Phase 3 (2026-04): 5 loại + conditional fields.
                  Phase 3.7 round 4 (2026-04): customer cho đổi sau khi tạo
                  (vd post nhầm GENERAL → BUSINESS). Đổi xong cần điền field
                  required cho loại mới (DN/source) — server validate. Riêng
                  PRODUCT chỉ giữ option khi bài cũ đã là PRODUCT (không cho
                  switch sang PRODUCT vì mode đó cần productData từ /feed). */}
              <div>
                <label className="block text-xs font-medium text-brand-800 mb-1">
                  Phân loại bài
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const c = e.target.value as NewsCategoryUI
                    setCategory(c)
                    // Clear pickers khi đổi sang loại không cần
                    if (c !== "BUSINESS" && c !== "PRODUCT") {
                      setRelatedCompany(null)
                      setRelatedProduct(null)
                    }
                    if (c !== "PRODUCT") setRelatedProduct(null)
                  }}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-xs bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <option value="GENERAL">Tin tức (/tin-tuc)</option>
                  <option value="RESEARCH">Nghiên cứu khoa học (/nghien-cuu)</option>
                  <option value="BUSINESS">Tin doanh nghiệp</option>
                  {/* Phase 3.5 (2026-04): PRODUCT đã ẩn khỏi flow tạo mới —
                      khách hàng yêu cầu admin chỉ tạo SP qua /feed/tao-bai.
                      Vẫn giữ option khi edit bài PRODUCT cũ để không break load. */}
                  {!isNew && category === "PRODUCT" && (
                    <option value="PRODUCT">Tin sản phẩm</option>
                  )}
                  <option value="EXTERNAL_NEWS">Tin báo chí ngoài (/tin-bao-chi)</option>
                  <option value="AGRICULTURE">Tin khuyến nông (/khuyen-nong)</option>
                  <option value="LEGAL">Văn bản pháp lý (/privacy, /terms)</option>
                </select>
                <p className="mt-1 text-[11px] text-brand-400 leading-snug">
                  Tin doanh nghiệp cần chọn DN bên dưới. Tin báo chí ngoài cần điền nguồn báo + URL bài gốc.
                </p>
              </div>

              {/* Phân loại phụ — Phase 3.7 round 4 (2026-04). Max 3, không
                  trùng primary. Bài có secondary sẽ xuất hiện ở list page
                  của các category đó (vd /tin-tuc + /nghien-cuu); homepage
                  giữ filter primary-only. */}
              <div>
                <label className="block text-xs font-medium text-brand-800 mb-1">
                  Phân loại phụ <span className="text-[10px] text-brand-400 font-normal">(tối đa 3)</span>
                </label>
                <div className="space-y-1.5 rounded-lg border border-brand-200 bg-white p-3">
                  {(
                    [
                      { value: "GENERAL" as const, label: "Tin tức (/tin-tuc)" },
                      { value: "RESEARCH" as const, label: "Nghiên cứu (/nghien-cuu)" },
                      { value: "BUSINESS" as const, label: "Tin doanh nghiệp" },
                      { value: "EXTERNAL_NEWS" as const, label: "Tin báo chí ngoài (/tin-bao-chi)" },
                      { value: "AGRICULTURE" as const, label: "Khuyến nông (/khuyen-nong)" },
                    ] satisfies { value: NewsCategoryUI; label: string }[]
                  )
                    .filter((opt) => opt.value !== category) // exclude primary
                    .map((opt) => {
                      const checked = secondaryCategories.includes(opt.value)
                      const disabled = !checked && secondaryCategories.length >= 3
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            "flex items-center gap-2 text-xs cursor-pointer",
                            disabled && "opacity-40 cursor-not-allowed",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) => {
                              setSecondaryCategories((prev) =>
                                e.target.checked
                                  ? [...prev, opt.value].slice(0, 3)
                                  : prev.filter((v) => v !== opt.value),
                              )
                            }}
                            className="rounded border-brand-300 accent-brand-700"
                          />
                          <span className="text-brand-800">{opt.label}</span>
                        </label>
                      )
                    })}
                </div>
                <p className="mt-1 text-[11px] text-brand-400 leading-snug">
                  Bài có secondary sẽ xuất hiện ở các list page tương ứng. Trang
                  chủ chỉ filter theo phân loại chính.
                </p>
              </div>

              {/* Ghim section trang chủ — Phase 3.7 round 4 (2026-04).
                  Admin-only: bài được tick category nào sẽ pin lên TOP section
                  homepage tương ứng (kể cả không phải primary/secondary của
                  bài — mở rộng visibility cross-list). UI ẩn khi non-admin. */}
              {canPickAuthor && (
                <div>
                  <label className="block text-xs font-medium text-brand-800 mb-1">
                    Ghim lên section trang chủ
                    <span className="ml-1 text-[10px] text-brand-400 font-normal">(admin only)</span>
                  </label>
                  <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
                    {(
                      [
                        { value: "GENERAL" as const, label: "Tin tức (Tin Hội)" },
                        { value: "RESEARCH" as const, label: "Nghiên cứu khoa học" },
                        { value: "BUSINESS" as const, label: "Tin doanh nghiệp" },
                        { value: "PRODUCT" as const, label: "Tin sản phẩm" },
                        { value: "AGRICULTURE" as const, label: "Tin khuyến nông" },
                      ] satisfies { value: NewsCategoryUI; label: string }[]
                    ).map((opt) => {
                      const checked = pinnedInCategories.includes(opt.value)
                      return (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setPinnedInCategories((prev) =>
                                e.target.checked
                                  ? [...prev, opt.value]
                                  : prev.filter((v) => v !== opt.value),
                              )
                            }}
                            className="rounded border-amber-400 accent-amber-600"
                          />
                          <span className="text-brand-800">📌 {opt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  <p className="mt-1 text-[11px] text-brand-400 leading-snug">
                    Bài pin sẽ lên TOP các section đã chọn trên trang chủ, kể cả
                    khi không phải primary/secondary category của bài. Sort:
                    pinned first → mới nhất.
                  </p>
                </div>
              )}

              {/* Phase 3.5 (2026-04): EXTERNAL_NEWS bắt buộc nguồn báo + URL.
                  Validate ở client (required) + server (API trả 400 nếu thiếu). */}
              {category === "EXTERNAL_NEWS" && (
                <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                  <label className="block text-xs font-medium text-brand-800">
                    Tên báo nguồn <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder='Ví dụ: VnExpress, Tuổi Trẻ, Báo Nông Nghiệp'
                    required
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                  <label className="block text-xs font-medium text-brand-800 mt-2">
                    URL bài gốc <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://vnexpress.net/..."
                    required
                    pattern="https?://.+"
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-xs font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                  <p className="text-[11px] text-brand-500 leading-snug">
                    Trang chi tiết sẽ hiển thị attribution &quot;Theo {sourceName || "[tên báo]"}&quot;
                    + nút &quot;Đọc bài gốc&quot;. Nội dung bài là tóm tắt/biên tập của ban biên
                    tập hội — không copy nguyên văn để tránh bản quyền.
                  </p>
                </div>
              )}

              {/* Conditional pickers — BUSINESS/PRODUCT chỉ định DN. PRODUCT
                  cũ (đã có relatedProductId) hiển thị link tới SP đã tạo;
                  PRODUCT mới (Phase 3.3 Q5 2026-04) tạo SP qua sidecar dưới
                  main column → ở đây không pick SP nữa. */}
              {(category === "BUSINESS" || category === "PRODUCT") && (
                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <label className="block text-xs font-medium text-brand-800">
                    Doanh nghiệp <span className="text-red-600">*</span>
                  </label>
                  <CompanyPicker
                    value={relatedCompany}
                    onChange={(c) => {
                      setRelatedCompany(c)
                    }}
                  />

                  {category === "PRODUCT" && !isNew && relatedProduct && (
                    <div className="mt-2 rounded-md border border-brand-200 bg-white px-3 py-2 text-xs">
                      <p className="font-medium text-brand-800">Sản phẩm đã tạo</p>
                      <Link
                        href={`/san-pham/${relatedProduct.slug}`}
                        target="_blank"
                        className="text-brand-700 underline hover:text-brand-900"
                      >
                        {relatedProduct.name}
                      </Link>
                    </div>
                  )}

                  {category === "PRODUCT" && isNew && (
                    <p className="mt-2 text-[11px] text-brand-500 leading-snug">
                      Hệ thống sẽ tự tạo SP mới khi lưu bài — điền thông tin
                      ở panel <strong>&quot;Thông tin sản phẩm mới&quot;</strong> bên trái.
                    </p>
                  )}
                </div>
              )}

              {/* Template — quyết định layout. Sau khi tạo: KHÓA không cho
                  đổi (đổi NORMAL ↔ PHOTO/VIDEO sẽ mất content RichText hoặc
                  gallery, không recoverable). Muốn đổi: xóa + tạo lại. */}
              <div>
                <label className="block text-xs font-medium text-brand-800 mb-1">
                  Dạng bài
                </label>
                <select
                  value={template}
                  disabled={!isNew}
                  onChange={(e) => setTemplate(e.target.value as NewsTemplateUI)}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-xs bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:bg-brand-50/50 disabled:text-brand-500 disabled:cursor-not-allowed"
                >
                  <option value="NORMAL">Bình thường (text + ảnh + video)</option>
                  <option value="PHOTO">Tin ảnh (Multimedia)</option>
                  <option value="VIDEO">Tin video (Multimedia)</option>
                </select>
                <p className="mt-1 text-[11px] text-brand-400 leading-snug">
                  {isNew
                    ? "Tin ảnh / Tin video tự động hiển thị ở mục Multimedia tương ứng."
                    : "Dạng bài đã chốt khi tạo, không đổi được."}
                </p>
              </div>

              {/* Toggle "Xuất bản" đã bỏ — dùng nút "Xuất bản" ở khu hành động
                  dưới (Save / Preview / Publish) để đổi trạng thái + lưu cùng
                  lúc. Hoặc quick toggle pill ngay trên list /admin/tin-tuc. */}

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

              {/* Author selector — chỉ admin:full được đổi (others readonly).
                  Default = current user, có thể chọn hội viên khác để đăng hộ.
                  API enforce permission ở server, UI chỉ là preview. */}
              <div>
                <label className="block text-xs font-medium text-brand-800 mb-1">
                  Tác giả
                </label>
                {canPickAuthor ? (
                  <UserPicker
                    value={author}
                    onChange={setAuthor}
                    unlinkLabel="Đổi"
                    unlinkTitle="Bỏ chọn để chọn tác giả khác"
                    placeholder="Tìm tác giả theo tên hoặc email..."
                    hint=""
                  />
                ) : author ? (
                  <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-2 text-sm text-brand-700">
                    <span className="font-semibold">{author.name}</span>
                    <span className="text-xs text-brand-500">{author.email}</span>
                  </div>
                ) : (
                  <p className="text-xs italic text-brand-400">Mặc định = bạn</p>
                )}
                {canPickAuthor && (
                  <p className="mt-1 text-[11px] leading-snug text-brand-400">
                    Mặc định là bạn. Chọn hội viên khác để đăng hộ tác giả khác.
                  </p>
                )}
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
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 space-y-1">
                <p>Đã lưu thay đổi.</p>
                <p className="text-xs text-green-600">
                  Các locale chưa có bản dịch sẽ được tự dịch trong nền — bạn có
                  thể đóng trang. Refresh lại vài phút sau để thấy bản dịch mới.
                </p>
              </div>
            )}

            {/* Action buttons — order: Lưu → Xem trước → Xuất bản (theo
                yêu cầu khách 2026-04). Publish button chỉ hiện cho user có
                news:publish; thay cho việc bấm toggle "Xuất bản" ở sidebar. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "Đang lưu..." : isNew ? "Tạo tin tức" : "Lưu"}
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
              >
                Xem trước
              </button>

              {!publishDisabled && (
                <button
                  type="submit"
                  disabled={loading}
                  onClick={() => {
                    setIsPublished(true)
                    // Auto-fill ngày xuất bản = NOW (local) khi user publish
                    // mà field còn trống → đảm bảo bài luôn có publishedAt
                    // hợp lệ (sort theo publishedAt ở public list cần value).
                    // Giữ nguyên giá trị cũ nếu user đã set tay.
                    if (!publishedAt) {
                      setPublishedAt(toLocalDatetimeInput(new Date()))
                    }
                  }}
                  title={
                    isPublished
                      ? "Bài đã xuất bản — bấm Lưu để cập nhật"
                      : "Bật xuất bản và lưu ngay"
                  }
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {isPublished ? "✓ Đã xuất bản" : "Xuất bản"}
                </button>
              )}
            </div>
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
          template={template}
          gallery={gallery}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
