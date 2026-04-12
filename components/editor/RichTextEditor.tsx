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
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
} from "react"
import { NodeViewImage } from "./NodeViewImage"

/**
 * Extended Image extension — thêm width/height attributes + React NodeView
 * với drag-handles. Render HTML preserve style="width: X; height: Y" để
 * hiển thị đúng trên trang công khai.
 */
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
}

export interface RichTextEditorProps {
  initialContent?: string
  minHeight?: number | string
  className?: string
}

/**
 * Reusable rich-text editor (TipTap v3) với toolbar đầy đủ:
 * bold/italic, H2/H3, list, quote, image (+drag resize), text-align,
 * và table (insert + row/col commands).
 *
 * Cách dùng:
 * ```tsx
 * const editorRef = useRef<RichTextEditorHandle>(null)
 * <RichTextEditor ref={editorRef} initialContent={html} />
 * // On submit:
 * const html = editorRef.current?.getHTML()
 * ```
 */
export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor({ initialContent = "", minHeight = 300, className = "" }, ref) {
    const editor = useEditor({
      extensions: [
        StarterKit,
        ResizableImage.configure({
          inline: false,
          allowBase64: false,
          HTMLAttributes: { class: "editor-image" },
        }),
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
      ],
      // Quan trọng: editor KHỞI TẠO với content rỗng — NodeView-based images
      // chỉ được render sau khi editor mount xong (qua useEffect + microtask),
      // nếu không sẽ gây "flushSync was called from inside a lifecycle method".
      content: "",
      // "use client" nên không có SSR hydration concern
      immediatelyRender: true,
      // Tránh Tiptap auto-rerender mỗi transaction (dùng useEditorState thay thế).
      shouldRerenderOnTransaction: false,
    })

    // Load initialContent SAU khi editor mount — tránh flushSync với NodeView
    const contentLoadedRef = useRef(false)
    useEffect(() => {
      if (!editor || contentLoadedRef.current) return
      contentLoadedRef.current = true
      if (!initialContent) return
      queueMicrotask(() => {
        editor.commands.setContent(initialContent)
      })
    }, [editor, initialContent])

    // Reactive toolbar state — chỉ re-render khi giá trị thực sự đổi.
    const editorState = useEditorState({
      editor,
      selector: ({ editor }) => {
        if (!editor) return null
        return {
          isBold: editor.isActive("bold"),
          isItalic: editor.isActive("italic"),
          isH2: editor.isActive("heading", { level: 2 }),
          isH3: editor.isActive("heading", { level: 3 }),
          isBulletList: editor.isActive("bulletList"),
          isOrderedList: editor.isActive("orderedList"),
          isBlockquote: editor.isActive("blockquote"),
          isImage: editor.isActive("image"),
          isTable: editor.isActive("table"),
          isAlignLeft: editor.isActive({ textAlign: "left" }),
          isAlignCenter: editor.isActive({ textAlign: "center" }),
          isAlignRight: editor.isActive({ textAlign: "right" }),
          isAlignJustify: editor.isActive({ textAlign: "justify" }),
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
      }),
      [editor],
    )

    const minHeightValue = typeof minHeight === "number" ? `${minHeight}px` : minHeight

    return (
      <div className={`rounded-xl border bg-white shadow-sm ${className}`}>
        <Toolbar editor={editor} state={editorState} />
        <EditorContent
          editor={editor}
          className={[
            "prose prose-sm max-w-none p-4 focus-within:outline-none",
            "[&_.ProseMirror]:outline-none",
            // Image selection feedback
            "[&_.ProseMirror_img]:cursor-pointer [&_.ProseMirror_img]:rounded-md [&_.ProseMirror_img]:transition-all",
            "[&_.ProseMirror_img:hover]:ring-2 [&_.ProseMirror_img:hover]:ring-brand-300",
            "[&_.ProseMirror_img.ProseMirror-selectednode]:ring-4 [&_.ProseMirror_img.ProseMirror-selectednode]:ring-brand-500 [&_.ProseMirror_img.ProseMirror-selectednode]:ring-offset-2",
            // Table styling
            "[&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:my-4 [&_.ProseMirror_table]:table-fixed",
            "[&_.ProseMirror_table_td]:border [&_.ProseMirror_table_td]:border-brand-200 [&_.ProseMirror_table_td]:p-2 [&_.ProseMirror_table_td]:align-top [&_.ProseMirror_table_td]:relative",
            "[&_.ProseMirror_table_th]:border [&_.ProseMirror_table_th]:border-brand-300 [&_.ProseMirror_table_th]:p-2 [&_.ProseMirror_table_th]:align-top [&_.ProseMirror_table_th]:bg-brand-50 [&_.ProseMirror_table_th]:font-semibold [&_.ProseMirror_table_th]:relative",
            "[&_.ProseMirror_.selectedCell]:bg-brand-100/60",
            "[&_.ProseMirror_.column-resize-handle]:absolute [&_.ProseMirror_.column-resize-handle]:right-[-2px] [&_.ProseMirror_.column-resize-handle]:top-0 [&_.ProseMirror_.column-resize-handle]:bottom-0 [&_.ProseMirror_.column-resize-handle]:w-1 [&_.ProseMirror_.column-resize-handle]:bg-brand-400 [&_.ProseMirror_.column-resize-handle]:pointer-events-none",
            "[&_.ProseMirror.resize-cursor]:cursor-col-resize",
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
  isH2: boolean
  isH3: boolean
  isBulletList: boolean
  isOrderedList: boolean
  isBlockquote: boolean
  isImage: boolean
  isTable: boolean
  isAlignLeft: boolean
  isAlignCenter: boolean
  isAlignRight: boolean
  isAlignJustify: boolean
}

function Toolbar({
  editor,
  state,
}: {
  editor: Editor | null
  state: EditorState | null
}) {
  // Defer tất cả editor mutations qua microtask để tránh flushSync-in-lifecycle
  // khi có ReactNodeViewRenderer + React 19 strict checks.
  const run = useMemo(
    () => (fn: () => void) => {
      if (!editor) return
      queueMicrotask(fn)
    },
    [editor],
  )

  return (
    <div className="sticky top-0 z-20 rounded-t-xl border-b bg-brand-50/95 backdrop-blur px-4 py-2 flex gap-1 flex-wrap shadow-sm">
      {/* Inline formatting */}
      <TbBtn
        onClick={() => run(() => editor!.chain().focus().toggleBold().run())}
        active={state?.isBold}
        title="In đậm (Ctrl+B)"
      >
        <strong>B</strong>
      </TbBtn>
      <TbBtn
        onClick={() => run(() => editor!.chain().focus().toggleItalic().run())}
        active={state?.isItalic}
        title="In nghiêng (Ctrl+I)"
      >
        <em>I</em>
      </TbBtn>

      <Separator />

      {/* Headings */}
      <TbBtn
        onClick={() => run(() => editor!.chain().focus().toggleHeading({ level: 2 }).run())}
        active={state?.isH2}
        title="Tiêu đề H2"
      >
        <span className="font-semibold">H2</span>
      </TbBtn>
      <TbBtn
        onClick={() => run(() => editor!.chain().focus().toggleHeading({ level: 3 }).run())}
        active={state?.isH3}
        title="Tiêu đề H3"
      >
        <span className="font-semibold">H3</span>
      </TbBtn>

      <Separator />

      {/* Lists */}
      <TbBtn
        onClick={() => run(() => editor!.chain().focus().toggleBulletList().run())}
        active={state?.isBulletList}
        title="Danh sách gạch đầu dòng"
      >
        • List
      </TbBtn>
      <TbBtn
        onClick={() => run(() => editor!.chain().focus().toggleOrderedList().run())}
        active={state?.isOrderedList}
        title="Danh sách đánh số"
      >
        1. List
      </TbBtn>
      <TbBtn
        onClick={() => run(() => editor!.chain().focus().toggleBlockquote().run())}
        active={state?.isBlockquote}
        title="Trích dẫn"
      >
        &ldquo; Quote
      </TbBtn>

      <Separator />

      {/* Insert */}
      <TbBtn
        onClick={() => {
          const url = window.prompt("Nhập URL hình ảnh:")
          if (url) run(() => editor!.chain().focus().setImage({ src: url }).run())
        }}
        title="Chèn ảnh từ URL"
      >
        + Ảnh
      </TbBtn>
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
        title="Chèn bảng 3x3"
      >
        ⊞ Bảng
      </TbBtn>

      <Separator />

      {/* Text align — always visible */}
      {(
        [
          { align: "left", icon: "⇤", title: "Căn trái", active: state?.isAlignLeft },
          { align: "center", icon: "⇔", title: "Căn giữa", active: state?.isAlignCenter },
          { align: "right", icon: "⇥", title: "Căn phải", active: state?.isAlignRight },
          { align: "justify", icon: "☰", title: "Căn đều", active: state?.isAlignJustify },
        ] as const
      ).map(({ align, icon, title, active }) => (
        <TbBtn
          key={align}
          onClick={() => run(() => editor!.chain().focus().setTextAlign(align).run())}
          active={active}
          title={title}
        >
          {icon}
        </TbBtn>
      ))}

      {/* Image-specific actions — only when image is selected */}
      {state?.isImage && editor && (
        <>
          <Separator />
          <span className="text-[10px] text-brand-500 self-center italic">
            💡 Kéo góc/cạnh ảnh để resize
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
            title="Bỏ resize, về kích thước gốc"
          >
            ↺ Reset size
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
            🔗 URL
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
            📝 Alt
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
            🗑 Xóa ảnh
          </TbBtn>
        </>
      )}

      {/* Table-specific actions — only when cursor is in a table */}
      {state?.isTable && editor && (
        <>
          <Separator />
          <TbBtn
            onClick={() => run(() => editor.chain().focus().addRowBefore().run())}
            title="Thêm hàng phía trên"
          >
            ↑+ Hàng
          </TbBtn>
          <TbBtn
            onClick={() => run(() => editor.chain().focus().addRowAfter().run())}
            title="Thêm hàng phía dưới"
          >
            ↓+ Hàng
          </TbBtn>
          <TbBtn
            onClick={() => run(() => editor.chain().focus().addColumnBefore().run())}
            title="Thêm cột bên trái"
          >
            ←+ Cột
          </TbBtn>
          <TbBtn
            onClick={() => run(() => editor.chain().focus().addColumnAfter().run())}
            title="Thêm cột bên phải"
          >
            →+ Cột
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
            🗑 Bảng
          </TbBtn>
        </>
      )}
    </div>
  )
}

function Separator() {
  return <span className="w-px bg-brand-300 mx-1" aria-hidden="true" />
}

function TbBtn({
  onClick,
  active,
  title,
  tone,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  tone?: "default" | "info" | "warn" | "danger"
  children: ReactNode
}) {
  const toneClass =
    tone === "info"
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
      // onMouseDown + preventDefault giữ focus/selection của editor khi click.
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={`rounded px-2 py-1 text-xs transition-colors ${toneClass}`}
    >
      {children}
    </button>
  )
}
