import { Node, mergeAttributes } from "@tiptap/core"

/**
 * TipTap node: `<figure>` container for image + optional caption.
 * Schema: exactly 1 image, optionally followed by 1 figcaption.
 * Draggable + isolating so the whole block moves together.
 */
export const Figure = Node.create({
  name: "figure",
  group: "block",
  content: "image figcaption?",
  draggable: true,
  isolating: true,
  parseHTML() {
    return [{ tag: "figure" }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes({ class: "editor-figure" }, HTMLAttributes),
      0,
    ]
  },
})

/**
 * TipTap node: `<figcaption>` — inline text only, no marks.
 * Content spec `text*` allows 0 or more chars so empty captions are valid
 * (useful while editing or when admin skips the caption field).
 */
export const Figcaption = Node.create({
  name: "figcaption",
  content: "text*",
  marks: "",
  parseHTML() {
    return [{ tag: "figcaption" }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "figcaption",
      mergeAttributes({ class: "editor-figcaption" }, HTMLAttributes),
      0,
    ]
  },
})
