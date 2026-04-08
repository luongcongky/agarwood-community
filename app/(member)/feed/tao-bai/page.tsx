"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TiptapLink from "@tiptap/extension-link"
import { ResizableImage } from "@/components/editor/image-extension"
import { Suspense, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
        "flex items-center justify-center size-9 rounded-md text-sm font-medium transition-colors",
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

export default function TaoBaiPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto py-12 text-center text-brand-400">Đang tải...</div>}>
      <TaoBaiContent />
    </Suspense>
  )
}

function TaoBaiContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const [title, setTitle] = useState("")
  const [preview, setPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [importingDocx, setImportingDocx] = useState(false)
  const [editLoaded, setEditLoaded] = useState(false)
  const [imageSelected, setImageSelected] = useState(false)
  const [originalImages, setOriginalImages] = useState<string[]>([]) // images from loaded content (edit mode)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]) // images uploaded this session
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docxInputRef = useRef<HTMLInputElement>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editIdRef = useRef(editId)
  editIdRef.current = editId

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit,
      ResizableImage.configure({ inline: false, allowBase64: false }),
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      // Only auto-save drafts for NEW posts, not when editing existing
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
    },
    onSelectionUpdate: ({ editor }) => {
      setImageSelected(editor.isActive("image"))
    },
  })

  // Restore draft on mount — only for NEW posts (not edit mode)
  useEffect(() => {
    if (!editor || editId) return
    const raw = localStorage.getItem("feed_draft")
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed.title) setTitle(parsed.title)
      if (parsed.content) {
        editor.commands.setContent(parsed.content)
        setOriginalImages(extractCloudinaryUrls(parsed.content))
      }
      if (parsed.savedAt)
        setDraftSavedAt(new Date(parsed.savedAt).toLocaleTimeString("vi-VN"))
    } catch {
      // ignore corrupt draft
    }
  }, [editor, editId])

  // Load post for editing
  useEffect(() => {
    if (!editor || !editId || editLoaded) return
    // Clear draft so it doesn't pollute next "create new" session
    localStorage.removeItem("feed_draft")
    async function loadPost() {
      try {
        const res = await fetch(`/api/posts/${editId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.post) {
          setTitle(data.post.title ?? "")
          editor?.commands.setContent(data.post.content)
          setOriginalImages(extractCloudinaryUrls(data.post.content))
          setEditLoaded(true)
        }
      } catch {
        setError("Không thể tải bài viết.")
      }
    }
    loadPost()
  }, [editor, editId, editLoaded])

  // Auto-save title when it changes — only for NEW posts
  useEffect(() => {
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

  async function handleImageUpload(file: File) {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      const imgUrl = data.secure_url ?? data.url
      editor?.chain().focus().setImage({ src: imgUrl }).run()
      setUploadedImages((prev) => [...prev, imgUrl])
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

  async function handleDocxImport(file: File) {
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
      // Set title if extracted and current title is empty
      if (data.title && !title) setTitle(data.title)
      // Insert HTML into editor
      editor.commands.setContent(data.html)
      if (data.imageCount > 0) {
        setError(null) // Clear any previous error
      }
    } catch {
      setError("Import file DOCX thất bại. Vui lòng thử lại.")
    } finally {
      setImportingDocx(false)
    }
  }

  async function handleCancel() {
    // Delete only images uploaded THIS SESSION (not original content images)
    // This handles both create (all uploads are new) and edit (only new uploads deleted)
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
    if (!editor) return
    const text = editor.getText().trim()
    if (text.length < 50) {
      setError("Nội dung cần ít nhất 50 ký tự")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const url = editId ? `/api/posts/${editId}` : "/api/posts"
      const method = editId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || undefined, content: editor.getHTML() }),
      })
      if (res.ok) {
        // Cleanup orphaned Cloudinary images (deleted from editor but not from cloud)
        await deleteOrphanedImages([...originalImages, ...uploadedImages], editor.getHTML())
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
        <button
          onClick={handleCancel}
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
        </button>
        <span className="text-brand-500">/</span>
        <h1 className="font-semibold text-brand-900 text-lg">{editId ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</h1>
      </div>

      <div className="bg-white rounded-xl border border-brand-200">
        {/* Title input */}
        <div className="border-b border-brand-200 px-5 py-4">
          <input
            type="text"
            placeholder="Tiêu đề bài viết (tùy chọn)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-semibold text-brand-900 placeholder:text-brand-300 bg-transparent outline-none"
          />
        </div>

        {/* Toolbar — sticky so it stays visible when scrolling long posts */}
        {!preview && (
          <div className="flex items-center gap-1 px-3 py-2 border-b border-brand-200 flex-wrap sticky top-16 bg-white z-10 rounded-t-xl">
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

            <div className="w-px h-5 bg-brand-200 mx-1" />

            <ToolbarButton
              onClick={() => docxInputRef.current?.click()}
              active={false}
              title="Import từ file DOCX"
            >
              {importingDocx ? (
                <div className="size-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-xs font-bold">DOC</span>
              )}
            </ToolbarButton>
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

        {/* Image controls — show when image is selected, sticky below main toolbar */}
        {!preview && imageSelected && editor && (
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-brand-200 bg-brand-50 flex-wrap sticky top-[105px] z-10">
            <span className="text-sm text-brand-600 font-medium mr-1">Ảnh:</span>
            {[
              { label: "S", value: "25%" },
              { label: "M", value: "50%" },
              { label: "L", value: "75%" },
              { label: "XL", value: "100%" },
            ].map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => editor.chain().focus().updateAttributes("image", { width: s.value }).run()}
                className={cn(
                  "px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors",
                  editor.getAttributes("image").width === s.value ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-100",
                )}
              >
                {s.label}
              </button>
            ))}
            <div className="w-px h-5 bg-brand-200 mx-1" />
            {[
              { label: "←", value: "left" },
              { label: "↔", value: "center" },
              { label: "→", value: "right" },
            ].map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => editor.chain().focus().updateAttributes("image", { textAlign: a.value }).run()}
                className={cn(
                  "px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors",
                  (editor.getAttributes("image").textAlign ?? "center") === a.value ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-100",
                )}
              >
                {a.label}
              </button>
            ))}
            <div className="w-px h-5 bg-brand-200 mx-1" />
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().deleteSelection().run()
                setImageSelected(false)
              }}
              className="px-2.5 py-1.5 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors"
            >
              Xóa ảnh
            </button>
          </div>
        )}

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
              className="[&_.tiptap]:outline-none [&_.tiptap]:min-h-[300px] [&_.tiptap]:px-5 [&_.tiptap]:py-4 [&_.tiptap]:text-sm [&_.tiptap]:text-brand-800 [&_.tiptap_p]:mb-2 [&_.tiptap_h2]:text-base [&_.tiptap_h2]:font-semibold [&_.tiptap_h2]:text-brand-900 [&_.tiptap_h2]:mb-2 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:ml-4 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:ml-4 [&_.tiptap_a]:text-brand-600 [&_.tiptap_a]:underline [&_.tiptap_img]:rounded-lg [&_.tiptap_img]:max-w-full [&_.tiptap_img]:cursor-pointer [&_.tiptap_img]:transition-shadow [&_.tiptap_img.ProseMirror-selectednode]:ring-2 [&_.tiptap_img.ProseMirror-selectednode]:ring-blue-500 [&_.tiptap_img.ProseMirror-selectednode]:shadow-lg [&_.tiptap_p.is-empty::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-empty::before]:text-brand-300 [&_.tiptap_p.is-empty::before]:float-left [&_.tiptap_p.is-empty::before]:pointer-events-none"
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
            {editId ? "Cập nhật" : "Đăng bài"}
          </button>
        </div>
      </div>
    </div>
  )
}
