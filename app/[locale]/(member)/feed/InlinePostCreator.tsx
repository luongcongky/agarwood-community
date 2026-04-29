"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { PRODUCT_CATEGORIES } from "@/lib/constants/agarwood"
import { saveMyRecentPost } from "@/lib/my-recent-posts"
import type { ComposerMode, MembershipInfo, Post } from "./FeedClient"

/** Slugify tiếng Việt → a-z, 0-9, dấu gạch ngang. Mirror PostEditor.
 *  Dùng ̀-ͯ để strip Unicode combining diacritical marks. */
function slugify(str: string): string {
  return str
    .normalize("NFD")
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

type Props = {
  /** Filter đang active — quyết định layout form (NEWS: textarea đơn; PRODUCT:
   *  form có tên/danh mục/giá/tiêu đề + mô tả). Post được tạo với category
   *  trùng mode này. MINE không tạo được bài → caller phải ẩn composer. */
  mode: ComposerMode
  currentUserName: string | null
  currentUserAvatarUrl: string | null
  currentUserId: string
  currentUserRole: string
  membershipInfo: MembershipInfo | null
  onPostCreated: (post: Post) => void
  onPostUpdated: (tempId: string, patch: Partial<Post>) => void
}

/**
 * Inline composer cho Feed — render trên top của list khi filter === NEWS/PRODUCT.
 *
 * Tách ra file riêng để lazy-load qua `next/dynamic` trong FeedClient. Component
 * này ~500 dòng (state + upload + optimistic UI) — deferring parse time tới
 * sau LCP giúp giảm TBT ~100-150ms trên mobile Slow 4G.
 */
export function InlinePostCreator({
  mode,
  currentUserName,
  currentUserAvatarUrl,
  currentUserId,
  currentUserRole,
  membershipInfo,
  onPostCreated,
  onPostUpdated,
}: Props) {
  const t = useTranslations("feed")
  const locale = useLocale()
  const [content, setContent] = useState("")
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Product-specific fields — chỉ dùng khi mode === "PRODUCT"
  const [productName, setProductName] = useState("")
  const [productCategory, setProductCategory] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [title, setTitle] = useState("")

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = "auto"
      ta.style.height = ta.scrollHeight + "px"
    }
  }, [content])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 4 - images.length
    const toAdd = files.slice(0, remaining)
    setImages((prev) => [
      ...prev,
      ...toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ])
    e.target.value = ""
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit() {
    const plainText = content.trim()
    const isProductMode = mode === "PRODUCT"

    // Validate theo mode. PRODUCT yêu cầu tên ≥2 + tiêu đề + mô tả ≥50
    // (match server + full editor). NEWS giữ threshold 50 ký tự của content.
    if (isProductMode) {
      if (!productName.trim() || productName.trim().length < 2) {
        setError("Tên sản phẩm tối thiểu 2 ký tự.")
        return
      }
      if (!title.trim()) {
        setError("Vui lòng nhập tiêu đề bài đăng.")
        return
      }
      if (plainText.length < 50) {
        setError(`Mô tả sản phẩm cần ít nhất 50 ký tự (hiện ${plainText.length}).`)
        return
      }
    } else if (plainText.length < 50) {
      setError(t("minContent", { count: plainText.length }))
      return
    }

    // Slug từ tên SP — server validate /^[a-z0-9-]+$/ + ≥2 ký tự + unique.
    // Trùng slug → server trả 409 "Slug đã được sử dụng" → catch block dưới
    // hiển thị qua pendingError.
    const productSlug = isProductMode ? slugify(productName) : ""
    if (isProductMode && (productSlug.length < 2)) {
      setError("Tên sản phẩm chưa thể tạo slug hợp lệ — vui lòng dùng tên có chữ/số.")
      return
    }

    // Snapshot files + blob URLs before resetting the form. The background
    // upload runs against these snapshots, so the user can start composing
    // the next post immediately.
    const imagesSnapshot = images
    const blobUrls = imagesSnapshot.map((img) => img.preview)
    const paragraphs = plainText.split("\n").filter(Boolean).map((p) => `<p>${p}</p>`).join("")
    const blobImageHtml = blobUrls.map((url) => `<img src="${url}" />`).join("")

    // Bug fix (2026-04-29): không prepend product header HTML vào content nữa.
    // Trước đây gắn <h2>tên</h2><p>Danh mục:...</p>... vào content để hiển thị
    // info SP — giờ Product được link đúng → FeedPostCard render badge từ
    // post.product. Prepend cũ → duplicate info + post bị "thừa" dòng.
    const postTitle = isProductMode ? productName.trim() : null
    const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Build optimistic Post. Blob URLs render instantly — the image files
    // are already in browser memory, so there's zero wait for the user.
    //
    // Status phải khớp logic server (/api/posts POST): ADMIN → PUBLISHED ngay,
    // mọi role khác → PENDING chờ admin duyệt. Trước đây hardcode PUBLISHED
    // khiến badge "Chờ duyệt" không hiện ở optimistic UI → user tưởng bài đã
    // công khai ngay.
    const optimisticStatus: "PUBLISHED" | "PENDING" =
      currentUserRole === "ADMIN" ? "PUBLISHED" : "PENDING"
    const optimisticPost: Post = {
      id: tempId,
      authorId: currentUserId,
      title: postTitle,
      content: blobImageHtml + paragraphs,
      imageUrls: blobUrls,
      status: optimisticStatus,
      // Bug fix (2026-04-29): set category để PostCard render đúng product
      // strip cho mode=PRODUCT (badge condition `post.category === "PRODUCT"`).
      category: mode,
      isPremium: currentUserRole === "VIP" || currentUserRole === "INFINITE",
      isPromoted: false,
      authorPriority: membershipInfo?.displayPriority ?? 0,
      viewCount: 0,
      reportCount: 0,
      lockedAt: null,
      lockedBy: null,
      lockReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: currentUserId,
        name: currentUserName ?? "",
        avatarUrl: currentUserAvatarUrl,
        role: currentUserRole,
        accountType: membershipInfo?.accountType ?? "BUSINESS",
        contributionTotal: membershipInfo?.contributionTotal ?? 0,
        company: membershipInfo?.company ?? null,
      },
      // Bug fix (2026-04-29): optimistic product để badge hiển thị ngay
      // khi user vừa đăng. Server response sẽ swap với product thực (có id +
      // certStatus). Slug đã đúng (slugify deterministic) nên link
      // "Xem chi tiết" cũng valid.
      product: isProductMode
        ? {
            id: `tmp-product-${tempId}`,
            name: productName.trim(),
            slug: productSlug,
            priceRange: priceRange.trim() || null,
            category: productCategory.trim() || null,
            badgeUrl: null,
            certStatus: "DRAFT",
            isFeatured: false,
          }
        : null,
      reactions: [],
      _count: { reactions: 0, comments: 0 },
      isPending: true,
      pendingError: null,
    }
    onPostCreated(optimisticPost)

    // Reset form immediately — user can compose next post while upload runs.
    // NOTE: blob URLs are NOT revoked here; the optimistic post is still
    // rendering them. They're revoked in the background handler below
    // after the real Cloudinary URLs are swapped in.
    setContent("")
    setImages([])
    setProductName("")
    setProductCategory("")
    setPriceRange("")
    setTitle("")
    setError(null)

    // ── Background: upload images → POST → swap URLs in the post ───────
    ;(async () => {
      try {
        const uploadedUrls = await Promise.all(
          imagesSnapshot.map(async (img) => {
            const formData = new FormData()
            formData.append("file", img.file)
            formData.append("folder", "bai-viet")
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            if (!res.ok) throw new Error(t("uploadFailed"))
            const data = await res.json()
            return data.secure_url as string
          }),
        )

        const realImageHtml = uploadedUrls.map((url) => `<img src="${url}" />`).join("")
        const realContent = realImageHtml + paragraphs

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: realContent,
            category: mode,
            ...(postTitle ? { title: postTitle } : {}),
            // Bug fix (2026-04-29): gửi product field để server tạo Product
            // linked → FeedPostCard render badge "Sản phẩm | category | giá"
            // y hệt full editor flow. Không có field này → API chỉ tạo Post,
            // post.product null → badge ẩn.
            ...(isProductMode
              ? {
                  product: {
                    name: productName.trim(),
                    slug: productSlug,
                    category: productCategory.trim() || undefined,
                    priceRange: priceRange.trim() || undefined,
                  },
                }
              : {}),
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || t("postFailed"))
        }
        const { post } = await res.json()

        // Swap in server data. React remounts the PostCard because the
        // ID changes, but since it was in `pending` state (no user
        // interactions), the remount is invisible to the user.
        // `status` cần sync từ server để badge moderation (Chờ duyệt /
        // Bị từ chối) hiển thị đúng nếu admin thay đổi logic.
        // `product` lấy từ server (có id thật + certStatus DRAFT) thay
        // optimistic tmp-product-...
        const patch: Partial<Post> = {
          id: post.id,
          status: post.status,
          content: realContent,
          imageUrls: uploadedUrls,
          createdAt: post.createdAt ?? optimisticPost.createdAt,
          updatedAt: post.updatedAt ?? optimisticPost.updatedAt,
          isPending: false,
          pendingError: null,
        }
        if (post.product) {
          patch.product = {
            id: post.product.id,
            name: post.product.name,
            slug: post.product.slug,
            priceRange: post.product.priceRange ?? null,
            category: post.product.category ?? null,
            badgeUrl: post.product.badgeUrl ?? null,
            certStatus: post.product.certStatus ?? "DRAFT",
            isFeatured: post.product.isFeatured ?? false,
          }
        }
        onPostUpdated(tempId, patch)

        // Sticky zone: lưu bài của viewer vào localStorage để lần sau vào
        // /feed vẫn thấy ở top (TTL 2h). Khắc phục vấn đề user priority=0
        // bị đẩy xuống dưới VIP ngay sau khi đăng.
        saveMyRecentPost(currentUserId, { ...optimisticPost, ...patch })

        // Now safe to free the blob URLs — images are served from Cloudinary.
        blobUrls.forEach((url) => URL.revokeObjectURL(url))
      } catch (err) {
        // Keep blob URLs alive so the failed post still shows its images
        // while the user decides to retry / dismiss. They'll be released
        // when the user dismisses (handlePostDismiss).
        onPostUpdated(tempId, {
          isPending: false,
          pendingError: err instanceof Error ? err.message : "Có lỗi xảy ra",
        })
      }
    })()
  }

  const charCount = content.trim().length

  const isProduct = mode === "PRODUCT"
  const inputCls =
    "w-full border border-brand-200 rounded-lg bg-white px-3 py-2 text-sm text-brand-800 placeholder:text-brand-400 focus:border-brand-600 focus:outline-none"

  return (
    <div className="bg-white rounded-xl border border-brand-200 p-4 space-y-3">
      {/* Author row */}
      <div className="flex items-start gap-3">
        <div className="relative w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
          {currentUserAvatarUrl ? (
            <Image src={currentUserAvatarUrl} alt="" fill className="object-cover" sizes="40px" />
          ) : (
            <span className="text-sm font-bold text-brand-700">
              {currentUserName?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>

        {isProduct ? (
          /* Product form — tên / danh mục / giá / tiêu đề / mô tả */
          <div className="flex-1 min-w-0 space-y-2">
            <input
              type="text"
              value={productName}
              onChange={(e) => { setProductName(e.target.value); setError(null) }}
              placeholder="Tên sản phẩm *"
              className={inputCls}
              maxLength={120}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Danh mục — combobox dùng PRODUCT_CATEGORIES chung toàn site
                  (shared với ProductForm ở /san-pham). */}
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className={cn(
                  inputCls,
                  productCategory ? "text-brand-800" : "text-brand-400",
                )}
              >
                <option value="">Chọn danh mục…</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="text-brand-800">
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder="Khoảng giá (vd: 500k - 1tr)"
                className={inputCls}
                maxLength={50}
              />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(null) }}
              placeholder="Tiêu đề bài đăng *"
              className={inputCls}
              maxLength={150}
            />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => { setContent(e.target.value); setError(null) }}
              placeholder="Mô tả chi tiết sản phẩm * (≥50 ký tự)"
              className="w-full resize-none border border-brand-200 rounded-lg bg-white px-3 py-2 text-sm text-brand-800 placeholder:text-brand-400 focus:border-brand-600 focus:outline-none min-h-[100px] leading-relaxed"
              rows={4}
            />
          </div>
        ) : (
          /* NEWS mode — single textarea, auto-resize */
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); setError(null) }}
            placeholder={t("placeholder")}
            className="w-full resize-none text-sm text-brand-800 placeholder:text-brand-400 focus:outline-none min-h-[60px] leading-relaxed"
            rows={2}
          />
        )}
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-brand-200">
              <Image src={img.preview} alt="" fill className="object-cover" sizes="80px" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Footer: actions + submit */}
      <div className="flex items-center justify-between pt-2 border-t border-brand-100">
        <div className="flex items-center gap-2">
          {/* Image upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4}
            className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-40"
            title={t("addImages")}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Zm7.5-12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
            {t("images")}
          </button>

          {/* Full editor link — preserve mode hiện tại của feed (NEWS/PRODUCT)
              để admin/user khi click "Soạn đầy đủ" mở editor đúng category. */}
          <Link
            href={`/${locale}/feed/tao-bai?category=${mode}`}
            className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg px-2.5 py-1.5 transition-colors"
            title={t("fullEditor")}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            {t("fullEditorShort")}
          </Link>

          {/* Char count hint — cả NEWS và PRODUCT đều cần ≥50 ký tự (server +
              full editor enforce cùng threshold). */}
          {content.length > 0 && charCount < 50 && (
            <span className="text-xs text-brand-400">
              {charCount}/50
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            isProduct
              ? !productName.trim() || !title.trim() || charCount < 50
              : charCount < 50
          }
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
            (isProduct
              ? productName.trim() && title.trim() && charCount >= 50
              : charCount >= 50)
              ? "bg-brand-700 text-white hover:bg-brand-800"
              : "bg-brand-100 text-brand-400 cursor-not-allowed",
          )}
        >
          {isProduct ? "Đăng sản phẩm" : t("post")}
        </button>
      </div>
    </div>
  )
}
