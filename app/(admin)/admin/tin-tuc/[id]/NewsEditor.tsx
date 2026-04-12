"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/RichTextEditor"

import { slugify } from "@/lib/utils"

interface NewsData {
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string
  content: string
  category: "GENERAL" | "RESEARCH"
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

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [category, setCategory] = useState<"GENERAL" | "RESEARCH">("GENERAL")
  const [isPublished, setIsPublished] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [publishedAt, setPublishedAt] = useState("")
  const [initialContent, setInitialContent] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!isNew)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const editorRef = useRef<RichTextEditorHandle>(null)

  // Load existing news — resolve initialContent before mounting editor
  useEffect(() => {
    if (isNew) return

    async function fetchNews() {
      try {
        const res = await fetch(`/api/admin/news/${id}`)
        if (!res.ok) return
        const { news }: { news: NewsData } = await res.json()
        setTitle(news.title)
        setSlug(news.slug)
        setExcerpt(news.excerpt ?? "")
        setCoverImageUrl(news.coverImageUrl ?? "")
        setCategory(news.category ?? "GENERAL")
        setIsPublished(news.isPublished)
        setIsPinned(news.isPinned)
        setPublishedAt(
          news.publishedAt
            ? new Date(news.publishedAt).toISOString().slice(0, 16)
            : ""
        )
        setInitialContent(news.content ?? "")
      } finally {
        setFetching(false)
      }
    }

    fetchNews()
  }, [isNew, id])

  function handleTitleChange(value: string) {
    setTitle(value)
    if (isNew) {
      setSlug(slugify(value))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSaved(false)

    const content = editorRef.current?.getHTML() ?? ""

    const body = {
      title,
      slug,
      excerpt,
      coverImageUrl,
      content,
      category,
      isPublished,
      isPinned,
      publishedAt: publishedAt || null,
    }

    try {
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>

              {/* Slug */}
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

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">
                  Tóm tắt
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
              </div>

              {/* Cover image */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">
                  Ảnh bìa (URL)
                </label>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
                {coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="mt-2 h-32 w-full rounded-lg object-cover"
                  />
                )}
              </div>
            </div>

            {/* Rich text editor */}
            <RichTextEditor ref={editorRef} initialContent={initialContent} />
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
                  onChange={(e) => setCategory(e.target.value as "GENERAL" | "RESEARCH")}
                  className="w-full rounded-lg border border-brand-200 px-3 py-2 text-xs bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <option value="GENERAL">📰 Tin tức (/tin-tuc)</option>
                  <option value="RESEARCH">📚 Nghiên cứu khoa học (/nghien-cuu)</option>
                </select>
                <p className="mt-1 text-[11px] text-brand-400 leading-snug">
                  Tin tức hiển thị ở trang /tin-tuc. Nghiên cứu khoa học hiển thị ở trang /nghien-cuu.
                </p>
              </div>

              {/* Published toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsPublished((v) => !v)}
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
              </label>

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
          </div>
        </div>
      </form>
    </div>
  )
}
