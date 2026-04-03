"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TiptapImage from "@tiptap/extension-image"
import TiptapLink from "@tiptap/extension-link"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

interface NewsData {
  title: string
  slug: string
  excerpt: string
  coverImageUrl: string
  content: string
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
  const [isPublished, setIsPublished] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [publishedAt, setPublishedAt] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!isNew)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage,
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: "",
    immediatelyRender: false,
  })

  // Load existing news
  useEffect(() => {
    if (isNew || !editor) return

    async function fetchNews() {
      try {
        const res = await fetch(`/api/admin/news/${id}`)
        if (!res.ok) return
        const { news }: { news: NewsData } = await res.json()
        setTitle(news.title)
        setSlug(news.slug)
        setExcerpt(news.excerpt ?? "")
        setCoverImageUrl(news.coverImageUrl ?? "")
        setIsPublished(news.isPublished)
        setIsPinned(news.isPinned)
        setPublishedAt(
          news.publishedAt
            ? new Date(news.publishedAt).toISOString().slice(0, 16)
            : ""
        )
        editor?.commands.setContent(news.content ?? "")
      } finally {
        setFetching(false)
      }
    }

    fetchNews()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, id, editor])

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

    const content = editor?.getHTML() ?? ""

    const body = {
      title,
      slug,
      excerpt,
      coverImageUrl,
      content,
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

            {/* TipTap Editor */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="border-b bg-brand-50 px-4 py-2 flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`rounded px-2 py-1 text-xs font-bold transition-colors ${
                    editor?.isActive("bold")
                      ? "bg-brand-700 text-white"
                      : "hover:bg-brand-100 text-brand-800"
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`rounded px-2 py-1 text-xs italic transition-colors ${
                    editor?.isActive("italic")
                      ? "bg-brand-700 text-white"
                      : "hover:bg-brand-100 text-brand-800"
                  }`}
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                    editor?.isActive("heading", { level: 2 })
                      ? "bg-brand-700 text-white"
                      : "hover:bg-brand-100 text-brand-800"
                  }`}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                    editor?.isActive("heading", { level: 3 })
                      ? "bg-brand-700 text-white"
                      : "hover:bg-brand-100 text-brand-800"
                  }`}
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    editor?.isActive("bulletList")
                      ? "bg-brand-700 text-white"
                      : "hover:bg-brand-100 text-brand-800"
                  }`}
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    editor?.isActive("orderedList")
                      ? "bg-brand-700 text-white"
                      : "hover:bg-brand-100 text-brand-800"
                  }`}
                >
                  1. List
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor?.chain().focus().toggleBlockquote().run()
                  }
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    editor?.isActive("blockquote")
                      ? "bg-brand-700 text-white"
                      : "hover:bg-brand-100 text-brand-800"
                  }`}
                >
                  &ldquo; Quote
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.prompt("Nhập URL hình ảnh:")
                    if (url) editor?.chain().focus().setImage({ src: url }).run()
                  }}
                  className="rounded px-2 py-1 text-xs hover:bg-brand-100 text-brand-800 transition-colors"
                >
                  Ảnh
                </button>
              </div>
              <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none min-h-[300px] p-4 focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px]"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-brand-900">Cài đặt xuất bản</h2>

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
