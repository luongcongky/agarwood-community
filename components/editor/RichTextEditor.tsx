"use client"

import {
  EditorContent,
  ReactNodeViewRenderer,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TiptapImage from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table"
import { Link } from "@tiptap/extension-link"
import { Underline } from "@tiptap/extension-underline"
import { TextStyleKit } from "@tiptap/extension-text-style"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Undo2,
  Redo2,
  Minus,
  Table as TableIcon,
  Image as ImageIcon,
  Film,
  IndentIncrease,
  IndentDecrease,
  Palette,
  ChevronDown,
  Pilcrow,
  Heading2,
  Heading3,
  Heading4,
  StickyNote,
} from "lucide-react"
import { NodeViewImage } from "./NodeViewImage"
import { Figure, Figcaption } from "./extensions/Figure"
import { MediaEmbed, type MediaType } from "./extensions/MediaEmbed"
import { Callout } from "./extensions/Callout"
import { ContentImageEditor } from "./ContentImageEditor"
import { MediaEmbedModal } from "./MediaEmbedModal"

// ────────────────────────────────────────────────────────────────────────────
// Helper: build ProseMirror JSON block cho <figure>[image][figcaption].
// Figcaption luôn render trong output để edit-flow tìm lại được caption.
// Phase 3.3 (2026-04): KHÔNG set default width nữa — ảnh stretch full
// container width via CSS `figure img { width: 100% }`. Khách hàng yêu cầu
// default = full 16:9. User vẫn có thể drag handle để thu nhỏ (set inline
// width:Xpx override).
// ────────────────────────────────────────────────────────────────────────────

function buildFigureBlock(
  src: string,
  caption: string,
): Record<string, unknown> {
  const figcaption: Record<string, unknown> = { type: "figcaption" }
  if (caption) {
    figcaption.content = [{ type: "text", text: caption }]
  }
  return {
    type: "figure",
    content: [
      {
        type: "image",
        // width: null → CSS default w-full applies; user resize sẽ set
        // inline width:Xpx override.
        attrs: { src, width: null, height: null },
      },
      figcaption,
    ],
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Resizable Image extension
// ────────────────────────────────────────────────────────────────────────────
const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.width || el.getAttribute("width") || null,
        renderHTML: (attrs: { width?: string | null; height?: string | null }) => {
          const parts: string[] = []
          if (attrs.width) parts.push(`width: ${attrs.width}`)
          if (attrs.height) parts.push(`height: ${attrs.height}`)
          if (attrs.width && !attrs.height) parts.push("height: auto")
          if (attrs.height && !attrs.width) parts.push("width: auto")
          if (parts.length === 0) return {}
          return { style: parts.join("; ") }
        },
      },
      height: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.height || el.getAttribute("height") || null,
        renderHTML: () => ({}),
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(NodeViewImage)
  },
})

export interface RichTextEditorHandle {
  getHTML: () => string
  getText: () => string
  setContent: (html: string) => void
  focus: () => void
  editor: Editor | null
  /** Upload all pending local images to Cloudinary, replace blob URLs in editor.
   *  Returns list of uploaded Cloudinary URLs. */
  processImages: () => Promise<string[]>
}

export interface RichTextEditorProps {
  initialContent?: string
  minHeight?: number | string
  className?: string
  /** Cloudinary folder for image uploads (default: "bai-viet") */
  uploadFolder?: string
  /** Fires on every keystroke / structural change. The callback is stored
   *  in a ref so we don't re-instantiate the editor when the parent
   *  re-renders. Throttle/debounce in the parent if needed. */
  onUpdate?: (html: string) => void
  /** Fires when the editor loses focus. Receives the current HTML. Stored
   *  in a ref so editor instance isn't re-created on parent re-render.
   *  Dùng ở NewsEditor để trigger auto-translate sang EN/ZH/AR khi VI blur. */
  onBlur?: (html: string) => void
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor(
    { initialContent = "", minHeight = 300, className = "", uploadFolder = "bai-viet", onUpdate, onBlur },
    ref,
  ) {
    // Hold the latest onUpdate / onBlur in refs so TipTap's closure always
    // sees the freshest callback without re-creating the editor instance.
    const onUpdateRef = useRef(onUpdate)
    useEffect(() => {
      onUpdateRef.current = onUpdate
    }, [onUpdate])
    const onBlurRef = useRef(onBlur)
    useEffect(() => {
      onBlurRef.current = onBlur
    }, [onBlur])

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          // Disable Link + Underline từ StarterKit vì đã configure riêng bên dưới
          link: false,
          underline: false,
        }),
        ResizableImage.configure({
          inline: false,
          allowBase64: false,
          HTMLAttributes: { class: "editor-image" },
        }),
        Figure,
        Figcaption,
        MediaEmbed,
        Callout,
        TextAlign.configure({
          types: ["heading", "paragraph", "image"],
          alignments: ["left", "center", "right", "justify"],
          defaultAlignment: "left",
        }),
        Table.configure({
          resizable: true,
          HTMLAttributes: { class: "editor-table" },
        }),
        TableRow,
        TableHeader,
        TableCell,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "editor-link" },
        }),
        Underline,
        TextStyleKit.configure({
          backgroundColor: false,
          fontFamily: false,
          fontSize: false,
          lineHeight: false,
        }),
      ],
      content: "",
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      onUpdate: ({ editor }) => {
        onUpdateRef.current?.(editor.getHTML())
      },
      onBlur: ({ editor }) => {
        onBlurRef.current?.(editor.getHTML())
      },
    })

    const contentLoadedRef = useRef(false)
    useEffect(() => {
      if (!editor || contentLoadedRef.current) return
      contentLoadedRef.current = true
      if (!initialContent) return
      queueMicrotask(() => {
        editor.commands.setContent(initialContent)
      })
    }, [editor, initialContent])

    // ── Blob → File mapping for local images ──
    const pendingFilesRef = useRef<Map<string, File>>(new Map())

    /** State điều khiển modal ContentImageEditor. */
    type EditorTarget =
      | { kind: "insert"; imageSrc: string }
      | {
          kind: "edit"
          imageSrc: string
          caption: string
          replaceRange: { from: number; to: number }
        }
      | null
    const [imageEditorState, setImageEditorState] =
      useState<EditorTarget>(null)

    const [showMediaModal, setShowMediaModal] = useState(false)

    const handleMediaEmbedInsert = useCallback(
      ({ src, type, caption }: { src: string; type: MediaType; caption: string }) => {
        if (!editor) return
        editor
          .chain()
          .focus()
          .insertContent({ type: "mediaEmbed", attrs: { src, type, caption } })
          .run()
        setShowMediaModal(false)
      },
      [editor],
    )

    /** Khi user pick file mới từ toolbar → mở modal thay vì insert thẳng. */
    const insertLocalImage = useCallback(
      (file: File) => {
        if (!editor) return
        const blobUrl = URL.createObjectURL(file)
        pendingFilesRef.current.set(blobUrl, file)
        setImageEditorState({ kind: "insert", imageSrc: blobUrl })
      },
      [editor],
    )

    /** Khi NodeViewImage request edit ảnh hiện tại.
     *  `from/to` là range để replace — có thể là (figure start, figure end)
     *  nếu image nằm trong figure, hoặc (image start, image end) nếu không. */
    const openEditExisting = useCallback(
      (src: string, caption: string, from: number, to: number) => {
        setImageEditorState({
          kind: "edit",
          imageSrc: src,
          caption,
          replaceRange: { from, to },
        })
      },
      [],
    )

    /** Expose hook cho NodeViewImage qua editor.storage. */
    useEffect(() => {
      if (!editor) return
      // @ts-expect-error — augment storage at runtime; type defined inline
      editor.storage.imageEditor = { requestEdit: openEditExisting }
    }, [editor, openEditExisting])

    function handleImageEditorCancel() {
      const st = imageEditorState
      if (st?.kind === "insert") {
        // User huỷ chèn mới → xóa blob tạm khỏi pending map
        URL.revokeObjectURL(st.imageSrc)
        pendingFilesRef.current.delete(st.imageSrc)
      }
      setImageEditorState(null)
    }

    async function handleImageEditorDone(result: { blob: Blob; caption: string }) {
      if (!editor || !imageEditorState) return
      const { blob, caption } = result
      const newBlobUrl = URL.createObjectURL(blob)
      const newFile = new File([blob], "content-image.jpg", {
        type: "image/jpeg",
      })
      pendingFilesRef.current.set(newBlobUrl, newFile)

      if (imageEditorState.kind === "insert") {
        // Cũ: chỉ file gốc trong pending. User đã crop/resize → xóa blob cũ
        // vì không dùng nữa, chỉ upload blob mới.
        URL.revokeObjectURL(imageEditorState.imageSrc)
        pendingFilesRef.current.delete(imageEditorState.imageSrc)

        const figureNode = buildFigureBlock(newBlobUrl, caption)
        editor.chain().focus().insertContent(figureNode).run()
      } else {
        // Edit mode: replace range (image hoặc figure cũ) bằng figure mới
        const newBlock = buildFigureBlock(newBlobUrl, caption)
        editor
          .chain()
          .focus()
          .insertContentAt(imageEditorState.replaceRange, newBlock)
          .run()
      }
      setImageEditorState(null)
    }

    const processImages = useCallback(async (): Promise<string[]> => {
      if (!editor) return []
      const pending = pendingFilesRef.current
      if (pending.size === 0) return []

      const json = editor.getJSON()

      // Collect all blob URLs still in the document — walk cả image lẫn image
      // nested trong figure/figcaption.
      const blobsInDoc = new Set<string>()
      const walk = (node: Record<string, unknown>) => {
        if (node.type === "image" && typeof (node.attrs as Record<string, unknown>)?.src === "string") {
          const src = (node.attrs as Record<string, string>).src
          if (src.startsWith("blob:")) blobsInDoc.add(src)
        }
        if (Array.isArray(node.content)) {
          for (const child of node.content) walk(child as Record<string, unknown>)
        }
      }
      walk(json as Record<string, unknown>)

      // Phase 1: drop blobs that the user removed from the editor
      const toUpload: { blobUrl: string; file: File }[] = []
      for (const [blobUrl, file] of pending.entries()) {
        if (!blobsInDoc.has(blobUrl)) {
          URL.revokeObjectURL(blobUrl)
          pending.delete(blobUrl)
        } else {
          toUpload.push({ blobUrl, file })
        }
      }

      // Phase 2: upload all in parallel — N images = max(N) instead of sum(N)
      const results = await Promise.all(
        toUpload.map(async ({ blobUrl, file }) => {
          try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("folder", uploadFolder)
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            if (!res.ok) throw new Error("Upload failed")
            const data = await res.json()
            return { blobUrl, file, cloudinaryUrl: (data.secure_url ?? data.url) as string }
          } catch {
            console.error(`Failed to upload image: ${file.name}`)
            return null
          }
        }),
      )

      // Phase 3: rewrite editor doc + clean up blobs (fast, no await)
      const uploadedUrls: string[] = []
      for (const result of results) {
        if (!result) continue
        const { blobUrl, cloudinaryUrl } = result
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === "image" && node.attrs.src === blobUrl) {
            editor
              .chain()
              .focus()
              .setNodeSelection(pos)
              .updateAttributes("image", { src: cloudinaryUrl })
              .run()
          }
        })
        uploadedUrls.push(cloudinaryUrl)
        URL.revokeObjectURL(blobUrl)
        pending.delete(blobUrl)
      }

      return uploadedUrls
    }, [editor, uploadFolder])

    // Cleanup blob URLs on unmount
    useEffect(() => {
      return () => {
        for (const blobUrl of pendingFilesRef.current.keys()) {
          URL.revokeObjectURL(blobUrl)
        }
        pendingFilesRef.current.clear()
      }
    }, [])

    const editorState = useEditorState({
      editor,
      selector: ({ editor }) => {
        if (!editor) return null
        return {
          isBold: editor.isActive("bold"),
          isItalic: editor.isActive("italic"),
          isUnderline: editor.isActive("underline"),
          isStrike: editor.isActive("strike"),
          isH2: editor.isActive("heading", { level: 2 }),
          isH3: editor.isActive("heading", { level: 3 }),
          isH4: editor.isActive("heading", { level: 4 }),
          isBulletList: editor.isActive("bulletList"),
          isOrderedList: editor.isActive("orderedList"),
          isBlockquote: editor.isActive("blockquote"),
          isCallout: editor.isActive("callout"),
          isLink: editor.isActive("link"),
          isImage: editor.isActive("image"),
          isTable: editor.isActive("table"),
          isAlignLeft: editor.isActive({ textAlign: "left" }),
          isAlignCenter: editor.isActive({ textAlign: "center" }),
          isAlignRight: editor.isActive({ textAlign: "right" }),
          isAlignJustify: editor.isActive({ textAlign: "justify" }),
          textColor: (editor.getAttributes("textStyle").color as string) || "",
          canUndo: editor.can().undo(),
          canRedo: editor.can().redo(),
        }
      },
    })

    useImperativeHandle(
      ref,
      () => ({
        getHTML: () => editor?.getHTML() ?? "",
        getText: () => editor?.getText() ?? "",
        setContent: (html: string) => {
          queueMicrotask(() => {
            editor?.commands.setContent(html)
          })
        },
        focus: () => editor?.commands.focus(),
        editor,
        processImages,
      }),
      [editor, processImages],
    )

    const minHeightValue = typeof minHeight === "number" ? `${minHeight}px` : minHeight

    return (
      <div className={`rounded-xl border bg-white shadow-sm ${className}`}>
        {imageEditorState && (
          <ContentImageEditor
            imageSrc={imageEditorState.imageSrc}
            initialCaption={
              imageEditorState.kind === "edit" ? imageEditorState.caption : ""
            }
            onDone={handleImageEditorDone}
            onCancel={handleImageEditorCancel}
          />
        )}
        {showMediaModal && (
          <MediaEmbedModal
            onConfirm={handleMediaEmbedInsert}
            onCancel={() => setShowMediaModal(false)}
          />
        )}
        <Toolbar
          editor={editor}
          state={editorState}
          onInsertLocalImage={insertLocalImage}
          onOpenMediaModal={() => setShowMediaModal(true)}
        />
        <EditorContent
          editor={editor}
          className={[
            "prose prose-sm max-w-none p-4 focus-within:outline-none",
            "[&_.ProseMirror]:outline-none",
            "[&_.ProseMirror_img]:cursor-pointer [&_.ProseMirror_img]:rounded-md [&_.ProseMirror_img]:transition-all",
            "[&_.ProseMirror_img:hover]:ring-2 [&_.ProseMirror_img:hover]:ring-brand-300",
            "[&_.ProseMirror_img.ProseMirror-selectednode]:ring-4 [&_.ProseMirror_img.ProseMirror-selectednode]:ring-brand-500 [&_.ProseMirror_img.ProseMirror-selectednode]:ring-offset-2",
            "[&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:my-4 [&_.ProseMirror_table]:table-fixed",
            "[&_.ProseMirror_table_td]:border [&_.ProseMirror_table_td]:border-brand-200 [&_.ProseMirror_table_td]:p-2 [&_.ProseMirror_table_td]:align-top [&_.ProseMirror_table_td]:relative",
            "[&_.ProseMirror_table_th]:border [&_.ProseMirror_table_th]:border-brand-300 [&_.ProseMirror_table_th]:p-2 [&_.ProseMirror_table_th]:align-top [&_.ProseMirror_table_th]:bg-brand-50 [&_.ProseMirror_table_th]:font-semibold [&_.ProseMirror_table_th]:relative",
            "[&_.ProseMirror_.selectedCell]:bg-brand-100/60",
            "[&_.ProseMirror_.column-resize-handle]:absolute [&_.ProseMirror_.column-resize-handle]:right-[-2px] [&_.ProseMirror_.column-resize-handle]:top-0 [&_.ProseMirror_.column-resize-handle]:bottom-0 [&_.ProseMirror_.column-resize-handle]:w-1 [&_.ProseMirror_.column-resize-handle]:bg-brand-400 [&_.ProseMirror_.column-resize-handle]:pointer-events-none",
            "[&_.ProseMirror.resize-cursor]:cursor-col-resize",
            "[&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:cursor-pointer",
            // Lists
            "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:my-2",
            "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:my-2",
            "[&_.ProseMirror_li]:my-0.5",
            "[&_.ProseMirror_li_p]:my-0",
            // Blockquote
            "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-brand-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:text-brand-600 [&_.ProseMirror_blockquote]:italic",
            // Callout — styles ở `app/globals.css` qua `.prose :where(aside.editor-callout)`
            // áp dụng cho mọi surface (admin editor / preview modal / public render).
            // Headings
            "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-brand-900 [&_.ProseMirror_h2]:my-3",
            "[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-brand-900 [&_.ProseMirror_h3]:my-2",
            "[&_.ProseMirror_h4]:text-base [&_.ProseMirror_h4]:font-semibold [&_.ProseMirror_h4]:text-brand-800 [&_.ProseMirror_h4]:my-2",
            // Horizontal rule
            "[&_.ProseMirror_hr]:border-brand-200 [&_.ProseMirror_hr]:my-4",
            // Figure full-width 16:9 (round 3 — match public CSS). Figure
            // block-level + max-width 960px + img stretch 100% width. Inline
            // style="width:..." từ drag-resize override qua specificity.
            "[&_.ProseMirror_figure]:block [&_.ProseMirror_figure]:w-full [&_.ProseMirror_figure]:max-w-[960px] [&_.ProseMirror_figure]:mx-auto [&_.ProseMirror_figure]:my-4",
            "[&_.ProseMirror_figure_img]:block [&_.ProseMirror_figure_img]:w-full [&_.ProseMirror_figure_img]:h-auto [&_.ProseMirror_figure_img]:my-0 [&_.ProseMirror_figure_img]:mx-auto",
            // Caption sát ảnh — block-level (không còn dùng table-caption do
            // figure đã chuyển sang display:block). mt-0.5 = ~2px gap.
            "[&_.ProseMirror_figcaption]:block [&_.ProseMirror_figcaption]:mt-0.5 [&_.ProseMirror_figcaption]:text-[13px] [&_.ProseMirror_figcaption]:italic [&_.ProseMirror_figcaption]:text-neutral-600 [&_.ProseMirror_figcaption]:leading-tight [&_.ProseMirror_figcaption]:text-center",
            "[&_.ProseMirror_figcaption:empty::before]:content-['Nhập_chú_thích_ảnh…'] [&_.ProseMirror_figcaption:empty::before]:text-neutral-400",
          ].join(" ")}
          style={{ minHeight: minHeightValue }}
        />
      </div>
    )
  },
)

// ────────────────────────────────────────────────────────────────────────────
// Toolbar
// ────────────────────────────────────────────────────────────────────────────

type EditorState = {
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrike: boolean
  isH2: boolean
  isH3: boolean
  isH4: boolean
  isBulletList: boolean
  isOrderedList: boolean
  isBlockquote: boolean
  isCallout: boolean
  isLink: boolean
  isImage: boolean
  isTable: boolean
  isAlignLeft: boolean
  isAlignCenter: boolean
  isAlignRight: boolean
  isAlignJustify: boolean
  textColor: string
  canUndo: boolean
  canRedo: boolean
}

const ICON_SIZE = 16

const COLORS = [
  { label: "Mặc định", value: "" },
  { label: "Đen", value: "#000000" },
  { label: "Đỏ đậm", value: "#8B0000" },
  { label: "Đỏ", value: "#DC2626" },
  { label: "Cam", value: "#EA580C" },
  { label: "Vàng đậm", value: "#CA8A04" },
  { label: "Xanh lá", value: "#16A34A" },
  { label: "Xanh lá đậm", value: "#166534" },
  { label: "Xanh dương", value: "#2563EB" },
  { label: "Xanh dương đậm", value: "#1E3A8A" },
  { label: "Tím", value: "#7C3AED" },
  { label: "Hồng", value: "#DB2777" },
  { label: "Xám", value: "#6B7280" },
]

function Toolbar({
  editor,
  state,
  onInsertLocalImage,
  onOpenMediaModal,
}: {
  editor: Editor | null
  state: EditorState | null
  onInsertLocalImage: (file: File) => void
  onOpenMediaModal: () => void
}) {
  const run = useMemo(
    () => (fn: () => void) => {
      if (!editor) return
      queueMicrotask(fn)
    },
    [editor],
  )

  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const colorRef = useRef<HTMLDivElement>(null)
  const blockRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
      if (blockRef.current && !blockRef.current.contains(e.target as Node)) {
        setShowBlockMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleLink = useCallback(() => {
    if (!editor) return
    if (editor.isActive("link")) {
      run(() => editor.chain().focus().unsetLink().run())
      return
    }
    const url = window.prompt("Nhập URL liên kết:")
    if (url) {
      run(() => editor.chain().focus().setLink({ href: url }).run())
    }
  }, [editor, run])

  const currentBlock = state?.isH2
    ? "H2"
    : state?.isH3
      ? "H3"
      : state?.isH4
        ? "H4"
        : "P"

  const blockLabel = {
    P: "Đoạn văn",
    H2: "Tiêu đề 2",
    H3: "Tiêu đề 3",
    H4: "Tiêu đề 4",
  }

  return (
    <div className="sticky top-0 z-20 rounded-t-xl border-b bg-brand-50/95 backdrop-blur shadow-sm">
      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onInsertLocalImage(file)
          e.target.value = ""
        }}
      />

      {/* ── Row 1: Inline formatting ── */}
      <div className="flex items-center gap-0.5 flex-wrap px-3 py-1.5 border-b border-brand-100">
        {/* Undo / Redo */}
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().undo().run())}
          disabled={!state?.canUndo}
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo2 size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().redo().run())}
          disabled={!state?.canRedo}
          title="Làm lại (Ctrl+Y)"
        >
          <Redo2 size={ICON_SIZE} />
        </TbBtn>

        <Sep />

        {/* Bold / Italic / Underline / Strikethrough */}
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().toggleBold().run())}
          active={state?.isBold}
          title="In đậm (Ctrl+B)"
        >
          <Bold size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().toggleItalic().run())}
          active={state?.isItalic}
          title="In nghiêng (Ctrl+I)"
        >
          <Italic size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().toggleUnderline().run())}
          active={state?.isUnderline}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().toggleStrike().run())}
          active={state?.isStrike}
          title="Gạch ngang"
        >
          <Strikethrough size={ICON_SIZE} />
        </TbBtn>

        <Sep />

        {/* Link / Unlink */}
        <TbBtn onClick={handleLink} active={state?.isLink} title="Chèn liên kết">
          <LinkIcon size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().unsetLink().run())}
          disabled={!state?.isLink}
          title="Bỏ liên kết"
        >
          <Unlink size={ICON_SIZE} />
        </TbBtn>

        <Sep />

        {/* Alignment */}
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().setTextAlign("left").run())}
          active={state?.isAlignLeft}
          title="Căn trái"
        >
          <AlignLeft size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().setTextAlign("center").run())}
          active={state?.isAlignCenter}
          title="Căn giữa"
        >
          <AlignCenter size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().setTextAlign("right").run())}
          active={state?.isAlignRight}
          title="Căn phải"
        >
          <AlignRight size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().setTextAlign("justify").run())}
          active={state?.isAlignJustify}
          title="Căn đều"
        >
          <AlignJustify size={ICON_SIZE} />
        </TbBtn>

        <Sep />

        {/* Lists / Blockquote */}
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().toggleBulletList().run())}
          active={state?.isBulletList}
          title="Danh sách gạch đầu dòng"
        >
          <List size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().toggleOrderedList().run())}
          active={state?.isOrderedList}
          title="Danh sách đánh số"
        >
          <ListOrdered size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().toggleBlockquote().run())}
          active={state?.isBlockquote}
          title="Trích dẫn"
        >
          <Quote size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().toggleCallout().run())}
          active={state?.isCallout}
          title="Ghi chú / tóm tắt (callout box)"
        >
          <StickyNote size={ICON_SIZE} />
        </TbBtn>

        <Sep />

        {/* Horizontal rule */}
        <TbBtn
          onClick={() => run(() => editor!.chain().focus().setHorizontalRule().run())}
          title="Đường kẻ ngang"
        >
          <Minus size={ICON_SIZE} />
        </TbBtn>

        {/* Table */}
        <TbBtn
          onClick={() =>
            run(() =>
              editor!
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run(),
            )
          }
          title="Chèn bảng 3×3"
        >
          <TableIcon size={ICON_SIZE} />
        </TbBtn>

        {/* Image — file picker */}
        <TbBtn
          onClick={() => imageInputRef.current?.click()}
          title="Chèn ảnh"
        >
          <ImageIcon size={ICON_SIZE} />
        </TbBtn>

        {/* Media embed — YouTube video hoặc audio direct URL */}
        <TbBtn
          onClick={onOpenMediaModal}
          title="Chèn media (YouTube / audio)"
        >
          <Film size={ICON_SIZE} />
        </TbBtn>
      </div>

      {/* ── Row 2: Block format, color, indent ── */}
      <div className="flex items-center gap-0.5 flex-wrap px-3 py-1.5">
        {/* Block type dropdown */}
        <div ref={blockRef} className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              setShowBlockMenu((v) => !v)
            }}
            title="Định dạng khối"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-brand-100 text-brand-800 transition-colors min-w-[100px]"
          >
            {currentBlock === "P" && <Pilcrow size={14} />}
            {currentBlock === "H2" && <Heading2 size={14} />}
            {currentBlock === "H3" && <Heading3 size={14} />}
            {currentBlock === "H4" && <Heading4 size={14} />}
            <span>{blockLabel[currentBlock]}</span>
            <ChevronDown size={12} />
          </button>
          {showBlockMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-brand-200 py-1 z-50 min-w-[140px]">
              <BlockMenuItem
                icon={<Pilcrow size={14} />}
                label="Đoạn văn"
                active={currentBlock === "P"}
                onClick={() => {
                  run(() => editor!.chain().focus().setParagraph().run())
                  setShowBlockMenu(false)
                }}
              />
              <BlockMenuItem
                icon={<Heading2 size={14} />}
                label="Tiêu đề 2"
                active={currentBlock === "H2"}
                onClick={() => {
                  run(() => editor!.chain().focus().toggleHeading({ level: 2 }).run())
                  setShowBlockMenu(false)
                }}
              />
              <BlockMenuItem
                icon={<Heading3 size={14} />}
                label="Tiêu đề 3"
                active={currentBlock === "H3"}
                onClick={() => {
                  run(() => editor!.chain().focus().toggleHeading({ level: 3 }).run())
                  setShowBlockMenu(false)
                }}
              />
              <BlockMenuItem
                icon={<Heading4 size={14} />}
                label="Tiêu đề 4"
                active={currentBlock === "H4"}
                onClick={() => {
                  run(() => editor!.chain().focus().toggleHeading({ level: 4 }).run())
                  setShowBlockMenu(false)
                }}
              />
            </div>
          )}
        </div>

        <Sep />

        {/* Font color */}
        <div ref={colorRef} className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              setShowColorPicker((v) => !v)
            }}
            title="Màu chữ"
            className="flex items-center gap-0.5 rounded px-2 py-1 text-xs hover:bg-brand-100 text-brand-800 transition-colors"
          >
            <Palette size={ICON_SIZE} />
            <span
              className="block w-3 h-3 rounded-sm border border-brand-300"
              style={{ backgroundColor: state?.textColor || "#000000" }}
            />
            <ChevronDown size={12} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-brand-200 p-2 z-50 w-[180px]">
              <div className="grid grid-cols-5 gap-1.5 w-full">
                {COLORS.map(({ label, value }) => (
                  <button
                    key={value || "default"}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      if (value) {
                        run(() => editor!.chain().focus().setColor(value).run())
                      } else {
                        run(() => editor!.chain().focus().unsetColor().run())
                      }
                      setShowColorPicker(false)
                    }}
                    title={label}
                    className={`w-7 h-7 rounded border transition-all hover:scale-110 ${
                      state?.textColor === value
                        ? "ring-2 ring-brand-500 ring-offset-1"
                        : "border-gray-300"
                    }`}
                    style={{
                      backgroundColor: value || "#ffffff",
                      backgroundImage: !value
                        ? "linear-gradient(135deg, #fff 40%, #ff0000 40%, #ff0000 60%, #fff 60%)"
                        : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <Sep />

        {/* Indent / Outdent */}
        <TbBtn
          onClick={() => {
            if (!editor) return
            if (editor.isActive("bulletList") || editor.isActive("orderedList")) {
              run(() => editor.chain().focus().sinkListItem("listItem").run())
            }
          }}
          disabled={!state?.isBulletList && !state?.isOrderedList}
          title="Thụt vào (trong danh sách)"
        >
          <IndentIncrease size={ICON_SIZE} />
        </TbBtn>
        <TbBtn
          onClick={() => {
            if (!editor) return
            if (editor.isActive("bulletList") || editor.isActive("orderedList")) {
              run(() => editor.chain().focus().liftListItem("listItem").run())
            }
          }}
          disabled={!state?.isBulletList && !state?.isOrderedList}
          title="Thụt ra (trong danh sách)"
        >
          <IndentDecrease size={ICON_SIZE} />
        </TbBtn>

        {/* ── Contextual: Image actions ── */}
        {state?.isImage && editor && (
          <>
            <Sep />
            <span className="text-[10px] text-brand-500 self-center italic">
              Kéo góc/cạnh ảnh để resize
            </span>
            <TbBtn
              onClick={() =>
                run(() =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("image", { width: null, height: null })
                    .run(),
                )
              }
              tone="info"
              title="Về kích thước gốc"
            >
              ↺ Reset
            </TbBtn>
            <TbBtn
              onClick={() => {
                const currentSrc = editor.getAttributes("image").src as string
                const newSrc = window.prompt("URL ảnh mới:", currentSrc)
                if (newSrc && newSrc !== currentSrc) {
                  run(() =>
                    editor.chain().focus().updateAttributes("image", { src: newSrc }).run(),
                  )
                }
              }}
              tone="warn"
              title="Đổi URL ảnh"
            >
              <LinkIcon size={14} />
            </TbBtn>
            <TbBtn
              onClick={() => {
                const currentAlt = (editor.getAttributes("image").alt as string) ?? ""
                const newAlt = window.prompt("Alt text (mô tả ảnh):", currentAlt)
                if (newAlt !== null) {
                  run(() =>
                    editor.chain().focus().updateAttributes("image", { alt: newAlt }).run(),
                  )
                }
              }}
              tone="warn"
              title="Chỉnh alt text"
            >
              Alt
            </TbBtn>
            <TbBtn
              onClick={() => {
                if (confirm("Xóa ảnh đang chọn?")) {
                  run(() => editor.chain().focus().deleteSelection().run())
                }
              }}
              tone="danger"
              title="Xóa ảnh"
            >
              ✕
            </TbBtn>
          </>
        )}

        {/* ── Contextual: Table actions ── */}
        {state?.isTable && editor && (
          <>
            <Sep />
            <TbBtn
              onClick={() => run(() => editor.chain().focus().addRowBefore().run())}
              title="Thêm hàng phía trên"
            >
              ↑+
            </TbBtn>
            <TbBtn
              onClick={() => run(() => editor.chain().focus().addRowAfter().run())}
              title="Thêm hàng phía dưới"
            >
              ↓+
            </TbBtn>
            <TbBtn
              onClick={() => run(() => editor.chain().focus().addColumnBefore().run())}
              title="Thêm cột bên trái"
            >
              ←+
            </TbBtn>
            <TbBtn
              onClick={() => run(() => editor.chain().focus().addColumnAfter().run())}
              title="Thêm cột bên phải"
            >
              →+
            </TbBtn>
            <TbBtn
              onClick={() => run(() => editor.chain().focus().deleteRow().run())}
              tone="danger"
              title="Xóa hàng"
            >
              − Hàng
            </TbBtn>
            <TbBtn
              onClick={() => run(() => editor.chain().focus().deleteColumn().run())}
              tone="danger"
              title="Xóa cột"
            >
              − Cột
            </TbBtn>
            <TbBtn
              onClick={() => run(() => editor.chain().focus().deleteTable().run())}
              tone="danger"
              title="Xóa bảng"
            >
              ✕ Bảng
            </TbBtn>
          </>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function Sep() {
  return <span className="w-px h-5 bg-brand-300 mx-1 self-center" aria-hidden="true" />
}

function TbBtn({
  onClick,
  active,
  disabled,
  title,
  tone,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  tone?: "default" | "info" | "warn" | "danger"
  children: ReactNode
}) {
  const toneClass = disabled
    ? "text-brand-300 cursor-not-allowed"
    : tone === "info"
      ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
      : tone === "warn"
        ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
        : tone === "danger"
          ? "bg-red-100 text-red-700 hover:bg-red-200"
          : active
            ? "bg-brand-700 text-white"
            : "hover:bg-brand-100 text-brand-800"
  return (
    <button
      type="button"
      data-tb-button={title}
      onMouseDown={(e) => {
        e.preventDefault()
        if (!disabled) onClick()
      }}
      title={title}
      className={`rounded p-1.5 text-xs transition-colors ${toneClass}`}
    >
      {children}
    </button>
  )
}

function BlockMenuItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors ${
        active ? "bg-brand-100 text-brand-900 font-semibold" : "hover:bg-brand-50 text-brand-700"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
