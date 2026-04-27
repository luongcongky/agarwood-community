"use client"

import { useTranslations } from "next-intl"

import { RichTextEditor, type RichTextEditorHandle } from "@/components/editor/RichTextEditor"
import { Suspense, useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"
import { cn } from "@/lib/utils"
import { PRODUCT_CATEGORIES } from "@/lib/constants/agarwood"
import {
  CompanyPicker,
  type CompanySummary,
} from "@/app/(admin)/admin/tin-tuc/[id]/CompanyProductPickers"

/** Slugify tiếng Việt → a-z, 0-9, dấu gạch ngang */
function slugify(str: string): string {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract all Cloudinary image URLs from HTML string */
function extractCloudinaryUrls(html: string): string[] {
  const matches = html.match(/https:\/\/res\.cloudinary\.com\/[^"'\s)]+/g)
  return matches ? [...new Set(matches)] : []
}

/** Delete orphaned Cloudinary images (present in before but not in after).
 *  Fires all deletes in parallel; individual failures are swallowed. */
async function deleteOrphanedImages(beforeUrls: string[], afterHtml: string) {
  const afterUrls = extractCloudinaryUrls(afterHtml)
  const orphaned = beforeUrls.filter((url) => !afterUrls.includes(url))
  await Promise.all(
    orphaned.map((url) =>
      fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).catch(() => {
        /* ignore individual failures */
      }),
    ),
  )
}

// ─── Page Component ──────────────────────────────────────────────────────────

type OwnCompanyProp = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
} | null

export default function TaoBaiPage({
  isAdmin = false,
  ownCompany = null,
}: {
  isAdmin?: boolean
  ownCompany?: OwnCompanyProp
}) {
  const t = useTranslations("postEditor")

  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto py-12 text-center text-brand-400">{t("loading")}</div>}>
      <TaoBaiContent isAdminUserProp={isAdmin} ownCompany={ownCompany} />
    </Suspense>
  )
}

type PostCategoryClient = "GENERAL" | "NEWS" | "PRODUCT"

// CATEGORY_OPTIONS moved inside component to access t()

type QuotaInfo = { used: number; limit: number; remaining: number; resetAt: string }

function TaoBaiContent({
  isAdminUserProp,
  ownCompany,
}: {
  isAdminUserProp: boolean
  ownCompany: OwnCompanyProp
}) {
  const t = useTranslations("postEditor")
  const router = useRouter()
  const searchParams = useSearchParams()
  const CATEGORY_OPTIONS: { value: PostCategoryClient; label: string; hint: string }[] = [
    { value: "GENERAL", label: t("categoryGeneral"), hint: t("categoryGeneralHint") },
    { value: "NEWS",    label: t("categoryNews"), hint: t("categoryNewsHint") },
    { value: "PRODUCT", label: t("categoryProduct"), hint: t("categoryProductHint") },
  ]

  const editId = searchParams.get("edit")
  const initialCategory = searchParams.get("category") as PostCategoryClient | null
  // Phase 3.6 (2026-04): admin sửa bài của hội viên — bắt buộc nhập "lý do
  // chỉnh sửa" để PostRevision audit log có context. `returnTo` cho phép
  // ModerationItem nhảy ngược về cho-duyet sau khi save.
  const adminMode = searchParams.get("adminMode") === "1" && isAdminUserProp && !!editId
  const returnTo = searchParams.get("returnTo")
  const [adminEditReason, setAdminEditReason] = useState("")
  const editorRef = useRef<RichTextEditorHandle>(null)
  const [title, setTitle] = useState("")
  const [category, setCategoryState] = useState<PostCategoryClient>(
    initialCategory === "NEWS" || initialCategory === "PRODUCT" ? initialCategory : "GENERAL",
  )
  // Wrap setCategory so the `?category=` query param stays in sync with the
  // selected tab. Without this, a reader who loaded with ?category=PRODUCT
  // and then clicked "General" would still see PRODUCT in the URL — which is
  // misleading if they share the link or refresh.
  function setCategory(next: PostCategoryClient) {
    setCategoryState(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next === "GENERAL") {
      params.delete("category")
    } else {
      params.set("category", next)
    }
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : "?", { scroll: false })
  }
  // Product sidecar — chỉ dùng khi category=PRODUCT
  const [productName, setProductName] = useState("")
  const [productSlug, setProductSlug] = useState("")
  const [productSlugEdited, setProductSlugEdited] = useState(false)
  const [productCategory, setProductCategory] = useState("")
  const [productPriceRange, setProductPriceRange] = useState("")
  // Phase 3.5 (2026-04): admin đăng SP hộ DN — phải chọn DN.
  // Phase 3.6 follow-up: chỉ hiện admin picker khi user là admin/INFINITE
  // VÀ KHÔNG có DN riêng (true "đăng hộ" scenario). Nếu admin/INFINITE đã
  // có DN (vd lãnh đạo Hội đồng thời là chủ DN), ưu tiên hiển thị DN của
  // họ — họ đăng cho DN của mình, không phải đăng hộ.
  const isAdminUser = isAdminUserProp
  const showAdminPicker = isAdminUser && !ownCompany
  const [adminPickedCompany, setAdminPickedCompany] = useState<CompanySummary | null>(null)
  const [preview, setPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [editLoaded, setEditLoaded] = useState(false)
  const [originalImages, setOriginalImages] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editIdRef = useRef(editId)
  editIdRef.current = editId

  // Auto-generate slug sản phẩm từ tên (trừ khi user đã chỉnh)
  useEffect(() => {
    if (productSlugEdited) return
    setProductSlug(slugify(productName))
  }, [productName, productSlugEdited])

  // Fetch quota — chỉ khi tạo mới
  useEffect(() => {
    if (editId) return
    let cancelled = false
    fetch("/api/posts/quota")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setQuota(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [editId])

  // Auto-save draft — hook into editor's onUpdate via editor instance
  useEffect(() => {
    const editor = editorRef.current?.editor
    if (!editor) return
    const handler = () => {
      if (editIdRef.current) return
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => {
        localStorage.setItem(
          "feed_draft",
          JSON.stringify({
            title,
            content: editor.getHTML(),
            savedAt: new Date().toISOString(),
          })
        )
        setDraftSavedAt(new Date().toLocaleTimeString("vi-VN"))
      }, 2000)
    }
    editor.on("update", handler)
    return () => { editor.off("update", handler) }
  }, [editorRef.current?.editor, title])

  // Restore draft on mount — only for NEW posts
  useEffect(() => {
    if (editId) return
    const raw = localStorage.getItem("feed_draft")
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed.title) setTitle(parsed.title)
      if (parsed.content) {
        editorRef.current?.setContent(parsed.content)
        setOriginalImages(extractCloudinaryUrls(parsed.content))
      }
      if (parsed.savedAt)
        setDraftSavedAt(new Date(parsed.savedAt).toLocaleTimeString("vi-VN"))
    } catch {
      // ignore corrupt draft
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, editorRef.current?.editor])

  // Load post for editing
  useEffect(() => {
    if (!editId || editLoaded) return
    localStorage.removeItem("feed_draft")
    async function loadPost() {
      try {
        const res = await fetch(`/api/posts/${editId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.post) {
          setTitle(data.post.title ?? "")
          editorRef.current?.setContent(data.post.content)
          setOriginalImages(extractCloudinaryUrls(data.post.content))
          setEditLoaded(true)
        }
      } catch {
        setError(t("loadError"))
      }
    }
    loadPost()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, editLoaded, editorRef.current?.editor])

  // Auto-save title changes
  useEffect(() => {
    const editor = editorRef.current?.editor
    if (!editor || editId) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      localStorage.setItem(
        "feed_draft",
        JSON.stringify({
          title,
          content: editor.getHTML(),
          savedAt: new Date().toISOString(),
        })
      )
      setDraftSavedAt(new Date().toLocaleTimeString("vi-VN"))
    }, 2000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  /** Feed return URL preserving filter mode. PRODUCT → `?category=PRODUCT`,
   *  NEWS/GENERAL → bare `/feed` (NEWS = default tab). Admin moderation
   *  flow override qua `returnTo` query param. */
  function feedReturnUrl(): string {
    if (returnTo) return returnTo
    if (category === "PRODUCT") return "/feed?category=PRODUCT"
    return "/feed"
  }

  async function handleCancel() {
    // Fire-and-forget parallel cleanup — don't block redirect
    void Promise.all(
      uploadedImages.map((url) =>
        fetch("/api/upload/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }).catch(() => {
          /* ignore */
        }),
      ),
    )
    localStorage.removeItem("feed_draft")
    router.push(feedReturnUrl())
  }

  async function handleSubmit() {
    const text = editorRef.current?.getText()?.trim() ?? ""
    if (text.length < 50) {
      setError("Nội dung cần ít nhất 50 ký tự")
      return
    }
    // Validate product sidecar khi category=PRODUCT
    const isProduct = !editId && category === "PRODUCT"
    if (isProduct) {
      if (!productName.trim() || productName.trim().length < 2) {
        setError("Vui lòng nhập tên sản phẩm (tối thiểu 2 ký tự)")
        return
      }
      if (!/^[a-z0-9-]+$/.test(productSlug) || productSlug.length < 2) {
        setError("Slug sản phẩm không hợp lệ (chỉ a-z, 0-9, dấu gạch ngang)")
        return
      }
      // Phase 3.5: admin đăng hộ → bắt buộc chọn DN.
      if (showAdminPicker && !adminPickedCompany) {
        setError("Admin đăng SP hộ cần chọn doanh nghiệp.")
        return
      }
    }
    // Phase 3.6: admin sửa bài hội viên → bắt buộc lý do (validate ở server
    // luôn, ở client chỉ là sớm hiện error).
    if (adminMode && adminEditReason.trim().length < 10) {
      setError("Admin chỉnh sửa cần ghi rõ lý do (tối thiểu 10 ký tự).")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      // Upload pending local images to Cloudinary
      const newUploads = await editorRef.current?.processImages() ?? []
      setUploadedImages((prev) => [...prev, ...newUploads])
      const html = editorRef.current?.getHTML() ?? ""
      const url = editId ? `/api/posts/${editId}` : "/api/posts"
      const method = editId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || undefined,
          content: html,
          ...(editId ? {} : { category }),
          // Phase 3.6: admin edit lý do — server bắt buộc khi authorId !== editor.
          ...(adminMode ? { reason: adminEditReason.trim() } : {}),
          ...(isProduct
            ? {
                product: {
                  name: productName.trim(),
                  slug: productSlug.trim(),
                  category: productCategory || undefined,
                  priceRange: productPriceRange || undefined,
                  // Phase 3.5: admin chỉ định DN khi đăng hộ. Server validate
                  // role + tự switch ownerId sang chủ DN. Chỉ gửi companyId
                  // khi true admin scenario (admin không có DN riêng).
                  ...(showAdminPicker && adminPickedCompany
                    ? { companyId: adminPickedCompany.id }
                    : {}),
                },
              }
            : {}),
        }),
      })
      if (res.ok) {
        // Hand the freshly-created post to /feed via sessionStorage so it
        // appears at the top of the list immediately, instead of waiting
        // for the next ISR revalidate tick. FeedClient picks it up on mount.
        try {
          const { post } = await res.json()
          if (post && !editId) {
            sessionStorage.setItem("freshPost", JSON.stringify(post))
          }
        } catch {
          /* fall through — feed will still show post after ISR refresh */
        }
        // Fire-and-forget orphan cleanup — don't block redirect on it
        void deleteOrphanedImages([...originalImages, ...uploadedImages], html)
        localStorage.removeItem("feed_draft")
        // Phase 3.6: admin sửa từ moderation page → quay lại cho-duyet (qua
        // returnTo query). Otherwise: preserve mode tab khi quay về /feed.
        router.push(feedReturnUrl())
      } else {
        const data = await res.json()
        setError(data.error ?? "Đã xảy ra lỗi. Vui lòng thử lại.")
        setSubmitting(false)
      }
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.")
      setSubmitting(false)
    }
  }

  const previewHtml = editorRef.current?.getHTML() ?? ""

  return (
    <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-4 sm:p-6 lg:p-8">
    <div className="space-y-6">
      {/* Phase 3.6 (2026-04): admin chỉnh sửa bài hội viên — banner + textarea
          lý do bắt buộc. Hiển thị trên cùng để admin thấy ngay context. */}
      {adminMode && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
              ✎
            </span>
            <h2 className="text-sm font-bold text-amber-900">
              Chế độ Admin — chỉnh sửa bài hội viên
            </h2>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Thay đổi của bạn sẽ được ghi vào lịch sử bài viết. Owner sẽ thấy
            phiên bản admin sửa và có thể so sánh với bản gốc của họ.
          </p>
          <label className="block text-xs font-semibold text-amber-900 mt-2">
            Lý do chỉnh sửa <span className="text-red-600">*</span>{" "}
            <span className="font-normal text-amber-700">(tối thiểu 10 ký tự)</span>
          </label>
          <textarea
            value={adminEditReason}
            onChange={(e) => setAdminEditReason(e.target.value)}
            rows={2}
            placeholder="Ví dụ: Sửa lỗi chính tả + bổ sung disclaimer pháp lý theo quy định Hội."
            required
            minLength={10}
            className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-y"
          />
          <p className="text-[11px] text-amber-700">
            {adminEditReason.trim().length}/10 ký tự tối thiểu
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 transition-colors"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t("backToFeed")}
        </button>
        <span className="text-brand-500">/</span>
        <h1 className="font-semibold text-brand-900 text-lg">{editId ? t("editTitle") : t("createTitle")}</h1>

        {!editId && quota && (
          <span
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              quota.limit === -1
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : quota.remaining === 0
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : quota.remaining <= 2
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-brand-50 text-brand-700 border border-brand-200"
            )}
            title={
              quota.limit === -1
                ? "Bạn có hạn mức không giới hạn"
                : `Hạn mức sẽ làm mới vào ${new Date(quota.resetAt).toLocaleDateString("vi-VN")}`
            }
          >
            {quota.limit === -1
              ? t("quotaLabelUnlimited")
              : `Đã dùng ${quota.used}/${quota.limit} bài tháng này`}
          </span>
        )}
      </div>

      {/* Category selector — chỉ khi tạo mới */}
      {!editId && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-medium text-brand-600 mr-1">{t("postTypeLabel")}</label>
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategory(opt.value)}
              title={opt.hint}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                category === opt.value
                  ? "bg-brand-700 text-white border-brand-700"
                  : "bg-white text-brand-700 border-brand-200 hover:bg-brand-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Product sidecar panel — chỉ khi tạo mới + category=PRODUCT */}
      {!editId && category === "PRODUCT" && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-brand-900">{t("productInfoTitle")}</h3>
            <p className="text-xs text-brand-500 mt-0.5">{t("productInfoDesc")}</p>
          </div>

          {/* Phase 3.5 (2026-04): admin đăng hộ DN — bắt buộc chọn DN.
              Member thường tự là chủ DN nên không hiện picker, server tự
              đối chiếu `Company.ownerId = userId`. */}
          {showAdminPicker && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2">
              <label className="block text-xs font-medium text-brand-800">
                Doanh nghiệp gắn với SP <span className="text-red-600">*</span>
                <span className="ml-2 text-[10px] font-normal italic text-amber-700">
                  (Admin đăng hộ — chọn DN sở hữu SP)
                </span>
              </label>
              <CompanyPicker
                value={adminPickedCompany}
                onChange={setAdminPickedCompany}
              />
              <p className="text-[11px] text-brand-500 leading-snug">
                SP + bài đăng feed sẽ thuộc về chủ DN bạn chọn (admin đăng hộ
                — không xuất hiện tên admin trên feed). Phù hợp khi DN không
                tự thêm SP qua tài khoản đại diện.
              </p>
            </div>
          )}

          {/* Phase 3.6 follow-up: user (member hoặc admin/INFINITE có DN
              riêng) — hiển thị DN của họ read-only. Server tự lookup
              `Company.ownerId = userId`, UI chỉ show để user biết SP sẽ
              gắn vào DN nào. */}
          {!showAdminPicker && ownCompany && (
            <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-3 flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-md bg-white border border-brand-200 overflow-hidden shrink-0 flex items-center justify-center">
                {ownCompany.logoUrl ? (
                  <Image src={ownCompany.logoUrl} alt="" fill className="object-contain" sizes="40px" />
                ) : (
                  <span className="text-xs font-bold text-brand-700">
                    {ownCompany.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-brand-500 font-semibold">
                  Doanh nghiệp gắn với SP
                </p>
                <p className="text-sm font-semibold text-brand-900 truncate">
                  {ownCompany.name}
                </p>
              </div>
              <span className="text-[10px] text-brand-400 italic">tự động</span>
            </div>
          )}
          {!showAdminPicker && !ownCompany && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              ⚠ Tài khoản của bạn chưa gắn với doanh nghiệp nào. SP sẽ được tạo
              không kèm DN. Để gắn DN, vào{" "}
              <a href="/doanh-nghiep/chinh-sua" className="underline font-semibold">
                Hồ sơ doanh nghiệp
              </a>{" "}
              cập nhật trước.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">
                {t("productNameLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t("productNamePlaceholder")}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">
                {t("slugLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productSlug}
                onChange={(e) => {
                  setProductSlug(e.target.value)
                  setProductSlugEdited(true)
                }}
                placeholder="nhang-tram-cao-cap-khanh-hoa"
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm font-mono"
              />
              <p className="text-[11px] text-brand-400 mt-0.5">{t("slugHint")}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">{t("categoryLabel")}</label>
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm bg-white"
              >
                <option value="">{t("categoryPlaceholder")}</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">{t("priceRangeLabel")}</label>
              <input
                type="text"
                value={productPriceRange}
                onChange={(e) => setProductPriceRange(e.target.value)}
                placeholder={t("priceRangePlaceholder")}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="bg-white rounded-xl border border-brand-200 px-5 py-4">
        <input
          type="text"
          placeholder={t("titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-lg font-semibold text-brand-900 placeholder:text-brand-300 bg-transparent outline-none"
        />
      </div>

      {/* Editor or preview */}
      {preview ? (
        <div className="bg-white rounded-xl border border-brand-200 min-h-[300px]">
          <div
            className="px-5 py-4 min-h-[300px] prose prose-sm max-w-none text-brand-800"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml || `<p class='text-muted-foreground italic'>${t("noContent")}</p>`) }}
          />
        </div>
      ) : (
        <RichTextEditor ref={editorRef} minHeight={300} uploadFolder="bai-viet" />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {draftSavedAt && (
            <span className="text-xs text-muted-foreground">
              {t("draftSaved")} {draftSavedAt}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors"
          >
            {preview ? t("editBtn") : t("previewBtn")}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm text-muted-foreground hover:text-brand-800 transition-colors"
          >
            {t("cancelBtn")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (!editId && quota?.limit !== -1 && quota?.remaining === 0)}
            className={cn(
              "flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition-colors",
              submitting || (!editId && quota?.remaining === 0)
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-brand-800"
            )}
            title={
              !editId && quota?.remaining === 0
                ? "Đã hết hạn mức tháng này — nâng cấp Hội viên để tăng hạn mức"
                : undefined
            }
          >
            {submitting && (
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {editId ? t("updateBtn") : t("postBtn")}
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}
