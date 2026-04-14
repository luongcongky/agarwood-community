"use client"

import { RichTextEditor, type RichTextEditorHandle } from "@/components/editor/RichTextEditor"
import { Suspense, useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DOMPurify from "isomorphic-dompurify"
import { cn } from "@/lib/utils"
import { PRODUCT_CATEGORIES } from "@/lib/constants/agarwood"

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

/** Delete orphaned Cloudinary images (present in before but not in after) */
async function deleteOrphanedImages(beforeUrls: string[], afterHtml: string) {
  const afterUrls = extractCloudinaryUrls(afterHtml)
  const orphaned = beforeUrls.filter((url) => !afterUrls.includes(url))
  for (const url of orphaned) {
    try {
      await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
    } catch { /* ignore individual failures */ }
  }
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function TaoBaiPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto py-12 text-center text-brand-400">Đang tải...</div>}>
      <TaoBaiContent />
    </Suspense>
  )
}

type PostCategoryClient = "GENERAL" | "NEWS" | "PRODUCT"

const CATEGORY_OPTIONS: { value: PostCategoryClient; label: string; hint: string }[] = [
  { value: "GENERAL", label: "Bài viết chung", hint: "Hiển thị ở Bản tin hội viên" },
  { value: "NEWS",    label: "Tin doanh nghiệp", hint: "Có thể lên section tin DN trang chủ (nếu là Hội viên)" },
  { value: "PRODUCT", label: "Sản phẩm", hint: "Tạo sản phẩm mới — kèm thẻ giá, chứng nhận, liên kết marketplace" },
]

type QuotaInfo = { used: number; limit: number; remaining: number; resetAt: string }

function TaoBaiContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const initialCategory = searchParams.get("category") as PostCategoryClient | null
  const editorRef = useRef<RichTextEditorHandle>(null)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<PostCategoryClient>(
    initialCategory === "NEWS" || initialCategory === "PRODUCT" ? initialCategory : "GENERAL",
  )
  // Product sidecar — chỉ dùng khi category=PRODUCT
  const [productName, setProductName] = useState("")
  const [productSlug, setProductSlug] = useState("")
  const [productSlugEdited, setProductSlugEdited] = useState(false)
  const [productCategory, setProductCategory] = useState("")
  const [productPriceRange, setProductPriceRange] = useState("")
  const [preview, setPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [importingDocx, setImportingDocx] = useState(false)
  const [editLoaded, setEditLoaded] = useState(false)
  const [originalImages, setOriginalImages] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docxInputRef = useRef<HTMLInputElement>(null)
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
        setError("Không thể tải bài viết.")
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

  const handleImageUpload = useCallback(async (file: File) => {
    const editor = editorRef.current?.editor
    if (!editor) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "bai-viet")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      const imgUrl = data.secure_url ?? data.url
      editor.chain().focus().setImage({ src: imgUrl }).run()
      setUploadedImages((prev) => [...prev, imgUrl])
    } catch {
      setError("Tải ảnh thất bại. Vui lòng thử lại.")
    } finally {
      setUploadingImage(false)
    }
  }, [])

  const handleDocxImport = useCallback(async (file: File) => {
    const editor = editorRef.current?.editor
    if (!editor) return
    setImportingDocx(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/docx", { method: "POST", body: formData })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Import thất bại")
        return
      }
      const data = await res.json()
      if (data.title && !title) setTitle(data.title)
      editor.commands.setContent(data.html)
    } catch {
      setError("Import file DOCX thất bại. Vui lòng thử lại.")
    } finally {
      setImportingDocx(false)
    }
  }, [title])

  async function handleCancel() {
    for (const url of uploadedImages) {
      try {
        await fetch("/api/upload/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })
      } catch { /* ignore */ }
    }
    localStorage.removeItem("feed_draft")
    router.push("/feed")
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
          ...(isProduct
            ? {
                product: {
                  name: productName.trim(),
                  slug: productSlug.trim(),
                  category: productCategory || undefined,
                  priceRange: productPriceRange || undefined,
                },
              }
            : {}),
        }),
      })
      if (res.ok) {
        await deleteOrphanedImages([...originalImages, ...uploadedImages], html)
        localStorage.removeItem("feed_draft")
        router.push("/feed")
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 transition-colors"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại feed
        </button>
        <span className="text-brand-500">/</span>
        <h1 className="font-semibold text-brand-900 text-lg">{editId ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</h1>

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
              ? "Hạn mức: ∞"
              : `Đã dùng ${quota.used}/${quota.limit} bài tháng này`}
          </span>
        )}
      </div>

      {/* Category selector — chỉ khi tạo mới */}
      {!editId && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-medium text-brand-600 mr-1">Loại bài:</label>
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
            <h3 className="text-sm font-semibold text-brand-900">Thông tin sản phẩm</h3>
            <p className="text-xs text-brand-500 mt-0.5">
              Bài này sẽ đồng thời được tạo dưới dạng sản phẩm trên marketplace và hiển thị trong feed với thẻ giá + nút xem chi tiết.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="VD: Nhang trầm cao cấp Khánh Hòa"
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">
                Slug (URL) <span className="text-red-500">*</span>
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
              <p className="text-[11px] text-brand-400 mt-0.5">Tự sinh từ tên; có thể chỉnh thủ công.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">Danh mục</label>
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm bg-white"
              >
                <option value="">— Chọn danh mục —</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">Khoảng giá</label>
              <input
                type="text"
                value={productPriceRange}
                onChange={(e) => setProductPriceRange(e.target.value)}
                placeholder="500k - 2tr, Liên hệ,..."
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
          placeholder="Tiêu đề bài viết (tùy chọn)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-lg font-semibold text-brand-900 placeholder:text-brand-300 bg-transparent outline-none"
        />
      </div>

      {/* Extra action buttons: Cloudinary upload + DOCX import */}
      {!preview && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors disabled:opacity-60"
          >
            {uploadingImage ? (
              <div className="size-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            Upload ảnh
          </button>
          <button
            type="button"
            onClick={() => docxInputRef.current?.click()}
            disabled={importingDocx}
            className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors disabled:opacity-60"
          >
            {importingDocx ? (
              <div className="size-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-xs font-bold">DOC</span>
            )}
            Import DOCX
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageUpload(file)
          e.target.value = ""
        }}
      />
      <input
        ref={docxInputRef}
        type="file"
        accept=".doc,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleDocxImport(file)
          e.target.value = ""
        }}
      />

      {/* Editor or preview */}
      {preview ? (
        <div className="bg-white rounded-xl border border-brand-200 min-h-[300px]">
          <div
            className="px-5 py-4 min-h-[300px] prose prose-sm max-w-none text-brand-800"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml || "<p class='text-muted-foreground italic'>Chưa có nội dung...</p>") }}
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
              Đã lưu nháp lúc {draftSavedAt}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors"
          >
            {preview ? "Chỉnh sửa" : "Xem trước"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm text-muted-foreground hover:text-brand-800 transition-colors"
          >
            Hủy
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
            {editId ? "Cập nhật" : "Đăng bài"}
          </button>
        </div>
      </div>
    </div>
  )
}
