"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TiptapImage from "@tiptap/extension-image"
import TiptapLink from "@tiptap/extension-link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DOMPurify from "isomorphic-dompurify"
import { cn } from "@/lib/utils"

// ─── Toolbar Button ──────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={cn(
        "flex items-center justify-center size-8 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-brand-700 text-white"
          : "text-brand-700 hover:bg-brand-100"
      )}
    >
      {children}
    </button>
  )
}

// ─── Page Component ──────────────────────────────────────────────────────────

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

export default function TaoBaiPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [preview, setPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage.configure({ inline: false, allowBase64: false }),
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer)
      autoSaveTimer = setTimeout(() => {
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
    },
  })

  // Restore draft on mount
  useEffect(() => {
    if (!editor) return
    const raw = localStorage.getItem("feed_draft")
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed.title) setTitle(parsed.title)
      if (parsed.content) editor.commands.setContent(parsed.content)
      if (parsed.savedAt)
        setDraftSavedAt(new Date(parsed.savedAt).toLocaleTimeString("vi-VN"))
    } catch {
      // ignore corrupt draft
    }
  }, [editor])

  // Auto-save title when it changes
  useEffect(() => {
    if (!editor) return
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => {
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

  async function handleImageUpload(file: File) {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const { url } = await res.json()
      editor?.chain().focus().setImage({ src: url }).run()
    } catch {
      setError("Tải ảnh thất bại. Vui lòng thử lại.")
    } finally {
      setUploadingImage(false)
    }
  }

  function handleInsertLink() {
    const url = window.prompt("Nhập URL liên kết:")
    if (!url) return
    editor?.chain().focus().setLink({ href: url }).run()
  }

  async function handleSubmit() {
    if (!editor) return
    const text = editor.getText().trim()
    if (text.length < 50) {
      setError("Nội dung cần ít nhất 50 ký tự")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || undefined, content: editor.getHTML() }),
      })
      if (res.ok) {
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

  const previewHtml = editor?.getHTML() ?? ""

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/feed"
          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 transition-colors"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại feed
        </Link>
        <span className="text-brand-300">/</span>
        <h1 className="font-heading font-semibold text-brand-900 text-lg">Tạo bài viết mới</h1>
      </div>

      <div className="bg-white rounded-xl border border-brand-200 overflow-hidden">
        {/* Title input */}
        <div className="border-b border-brand-100 px-5 py-4">
          <input
            type="text"
            placeholder="Tiêu đề bài viết (tùy chọn)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-semibold text-brand-900 placeholder:text-brand-300 bg-transparent outline-none"
          />
        </div>

        {/* Toolbar */}
        {!preview && (
          <div className="flex items-center gap-1 px-3 py-2 border-b border-brand-100 flex-wrap">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive("bold")}
              title="In đậm"
            >
              <strong>B</strong>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive("italic")}
              title="In nghiêng"
            >
              <em>I</em>
            </ToolbarButton>

            <ToolbarButton
              onClick={handleInsertLink}
              active={editor?.isActive("link")}
              title="Chèn liên kết"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              active={false}
              title="Chèn ảnh"
            >
              {uploadingImage ? (
                <div className="size-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </ToolbarButton>

            <div className="w-px h-5 bg-brand-200 mx-1" />

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive("bulletList")}
              title="Danh sách gạch đầu dòng"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive("orderedList")}
              title="Danh sách đánh số"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 20h14M7 12h14M7 4h14M3 20v-2a1 1 0 011-1h0a1 1 0 011 1v2M3 12v-2a1 1 0 011-1h0a1 1 0 011 1v2M3 4V2a1 1 0 011-1h0a1 1 0 011 1v2" />
              </svg>
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor?.isActive("heading", { level: 2 })}
              title="Tiêu đề H2"
            >
              <span className="text-xs font-bold">H2</span>
            </ToolbarButton>
          </div>
        )}

        {/* Hidden file input */}
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

        {/* Editor or preview */}
        <div className="min-h-[300px]">
          {preview ? (
            <div
              className="px-5 py-4 min-h-[300px] prose prose-sm max-w-none text-brand-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml || "<p class='text-muted-foreground italic'>Chưa có nội dung...</p>") }}
            />
          ) : (
            <EditorContent
              editor={editor}
              className="[&_.tiptap]:outline-none [&_.tiptap]:min-h-[300px] [&_.tiptap]:px-5 [&_.tiptap]:py-4 [&_.tiptap]:text-sm [&_.tiptap]:text-brand-800 [&_.tiptap_p]:mb-2 [&_.tiptap_h2]:text-base [&_.tiptap_h2]:font-semibold [&_.tiptap_h2]:text-brand-900 [&_.tiptap_h2]:mb-2 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:ml-4 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:ml-4 [&_.tiptap_a]:text-brand-600 [&_.tiptap_a]:underline [&_.tiptap_img]:rounded-lg [&_.tiptap_img]:max-w-full [&_.tiptap_p.is-empty::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-empty::before]:text-brand-300 [&_.tiptap_p.is-empty::before]:float-left [&_.tiptap_p.is-empty::before]:pointer-events-none"
            />
          )}
        </div>
      </div>

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
          <Link
            href="/feed"
            className="text-sm text-muted-foreground hover:text-brand-800 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition-colors",
              submitting
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-brand-800"
            )}
          >
            {submitting && (
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Đăng bài
          </button>
        </div>
      </div>
    </div>
  )
}
