"use client"

// Extract ra file riêng để NewsEditor có thể lazy-load:
//  - DOMPurify là dep nặng (~100KB gzipped); trước đây import ở top-level
//    NewsEditor khiến mọi admin vào editor đều phải parse. Admin thường
//    không bấm "Xem trước" trước khi save → lazy hơn thắng.
//  - Modal là 140 dòng JSX; tách riêng giảm size của NewsEditor module
//    → TTI nhanh hơn khi mở editor lần đầu.

import { sanitizeArticleHtml } from "@/lib/sanitize"
import type { Locale } from "@/components/ui/lang-tabs-bar"

type GalleryItem = { url: string; caption: string }

type NewsPreviewModalProps = {
  category:
    | "GENERAL"
    | "RESEARCH"
    | "LEGAL"
    | "BUSINESS"
    | "PRODUCT"
    | "EXTERNAL_NEWS"
    | "AGRICULTURE"
  title: Record<Locale, string>
  activeLocale: Locale
  publishedAt: string
  displayCover: string
  previewContent: string
  /** Phase 3.3: template + gallery cho tin ảnh / tin video. Default NORMAL. */
  template?: "NORMAL" | "PHOTO" | "VIDEO"
  gallery?: GalleryItem[]
  onClose: () => void
}

export default function NewsPreviewModal({
  category,
  title,
  activeLocale,
  publishedAt,
  displayCover,
  previewContent,
  template = "NORMAL",
  gallery = [],
  onClose,
}: NewsPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
      {/* Simulated Navbar */}
      <header className="sticky top-0 z-50 w-full bg-brand-800 shadow-md shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Logo" className="h-11 w-11 shrink-0" />
              <span className="text-brand-100 font-semibold text-lg hidden sm:block">
                Hội Trầm Hương
                <span className="text-brand-400 text-xs font-normal tracking-widest uppercase block">
                  Việt Nam
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                CHẾ ĐỘ XEM TRƯỚC
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Article content — exactly like /tin-tuc/[slug] */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
            <span className="hover:text-brand-700 cursor-default">Trang chủ</span>
            <span>/</span>
            <span className="hover:text-brand-700 cursor-default">
              {category === "RESEARCH"
                ? "Nghiên cứu"
                : category === "LEGAL"
                  ? "Văn bản pháp lý"
                  : category === "BUSINESS"
                    ? "Doanh nghiệp"
                    : category === "PRODUCT"
                      ? "Sản phẩm"
                      : category === "EXTERNAL_NEWS"
                        ? "Tin báo chí"
                        : category === "AGRICULTURE"
                          ? "Khuyến nông"
                          : "Tin tức"}
            </span>
            <span>/</span>
            <span className="text-foreground font-medium line-clamp-1">
              {title[activeLocale] || title.vi || "..."}
            </span>
          </nav>

          {/* Article Header */}
          <header className="mb-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              {title[activeLocale] || title.vi || <span className="text-brand-300 italic">Chưa có tiêu đề</span>}
            </h1>
            {publishedAt && (
              <p className="text-muted-foreground text-sm">
                Ngày đăng:{" "}
                {new Date(publishedAt).toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            )}
            {displayCover && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayCover}
                  alt={title.vi}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </header>

          {/* Article Body — render khác nhau theo template:
              - NORMAL: sanitize + dangerouslySetInnerHTML (RichTextEditor HTML)
              - PHOTO: gallery <figure><img><figcaption>
              - VIDEO: gallery <iframe> YouTube responsive 16:9 + caption
              Match 1:1 cách render ở trang public /tin-tuc/[slug]. */}
          <article className="mb-10">
            {template === "NORMAL" && (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeArticleHtml(
                    previewContent ||
                      "<p class='text-brand-300 italic'>Chưa có nội dung...</p>",
                  ),
                }}
              />
            )}

            {template === "PHOTO" && (
              <div className="space-y-6">
                {gallery.length === 0 ? (
                  <p className="text-brand-300 italic">
                    Chưa có ảnh nào trong gallery.
                  </p>
                ) : (
                  gallery.map((item, i) =>
                    item.url ? (
                      <figure key={`${item.url}-${i}`} className="space-y-2">
                        {/* Blob URL local hay Cloudinary đều render được qua
                            <img>. eslint-disable vì preview modal — không
                            cần next/image optimization. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.caption ?? ""}
                          className="w-full h-auto rounded-lg"
                        />
                        {item.caption && (
                          <figcaption className="text-center text-[13px] italic text-neutral-600 leading-snug">
                            {item.caption}
                          </figcaption>
                        )}
                      </figure>
                    ) : null,
                  )
                )}
              </div>
            )}

            {template === "VIDEO" && (
              <div className="space-y-8">
                {gallery.length === 0 ? (
                  <p className="text-brand-300 italic">
                    Chưa có video nào trong gallery.
                  </p>
                ) : (
                  gallery.map((item, i) =>
                    item.url ? (
                      <figure key={`${item.url}-${i}`} className="space-y-2">
                        <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-video">
                          <iframe
                            src={item.url}
                            className="absolute inset-0 h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title={item.caption || `Video ${i + 1}`}
                          />
                        </div>
                        {item.caption && (
                          <figcaption className="text-center text-[13px] italic text-neutral-600 leading-snug">
                            {item.caption}
                          </figcaption>
                        )}
                      </figure>
                    ) : null,
                  )
                )}
              </div>
            )}
          </article>

          {/* Share Buttons (visual only) */}
          <div className="border-t border-border pt-6 mb-10">
            <p className="text-sm font-medium text-foreground mb-3">Chia sẻ bài viết:</p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium opacity-60 cursor-default">
                Facebook
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium opacity-60 cursor-default">
                Zalo
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-100 text-brand-700 text-sm font-medium opacity-60 cursor-default">
                Sao chép liên kết
              </span>
            </div>
          </div>

          {/* Related Articles placeholder */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-5">Tin tức liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden border border-border">
                  <div className="w-full h-36 bg-brand-100 flex items-center justify-center text-brand-300 text-sm">
                    Ảnh bài viết
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="h-4 bg-brand-100 rounded w-3/4" />
                    <div className="h-3 bg-brand-50 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Simulated Footer */}
        <footer className="bg-brand-900 text-brand-300 mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center text-sm">
              <p className="text-brand-400">Hội Trầm Hương Việt Nam</p>
              <p className="text-brand-500 text-xs mt-1">Xem trước — Nội dung chưa được xuất bản</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
