import { Node, mergeAttributes, type RawCommands } from "@tiptap/core"

/**
 * TipTap node: `<aside class="editor-callout">` — vùng "ghi chú quan trọng"
 * trong bài viết, có border + background tone tan/be để nổi bật khỏi flow
 * đoạn văn (giống box "Đọc được sách hay…" trên znews trong reference).
 *
 * Schema:
 *  - group: block — hiện song song với paragraph/heading/list
 *  - content: "block+" — chứa được heading + paragraph + list bên trong
 *    (cho phép admin viết callout có cấu trúc, vd tiêu đề + 2 paragraph)
 *  - defining + isolating: backspace ở đầu callout không merge ngược ra
 *    paragraph trước; selection co/giãn không trườn ra ngoài callout
 *
 * Toggle qua command `editor.commands.toggleCallout()`. Implement bằng
 * `wrapIn` / `lift` standard pattern.
 */

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: () => ReturnType
      toggleCallout: () => ReturnType
      unsetCallout: () => ReturnType
    }
  }
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  parseHTML() {
    return [
      // Match cả <aside class="editor-callout"> (output của extension này) và
      // <div data-callout> (fallback nếu paste từ source khác).
      { tag: "aside.editor-callout" },
      { tag: "aside[data-callout]" },
      { tag: "div[data-callout]" },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes({ class: "editor-callout", "data-callout": "" }, HTMLAttributes),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands }) =>
          commands.wrapIn(this.name),
      toggleCallout:
        () =>
        ({ commands, editor }) => {
          if (editor.isActive(this.name)) {
            return commands.lift(this.name)
          }
          return commands.wrapIn(this.name)
        },
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    } as Partial<RawCommands>
  },
})
