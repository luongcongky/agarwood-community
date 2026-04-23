import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { NodeViewMediaEmbed } from "../NodeViewMediaEmbed"

export type MediaType = "youtube" | "audio"

/** Parse YouTube URL (các format: watch?v=, youtu.be, shorts, embed) → 11-char videoId. */
export function parseYouTubeId(url: string): string | null {
  const trimmed = url.trim()
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  const m = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/,
  )
  return m ? m[1] : null
}

/** True nếu URL kết thúc bằng đuôi audio phổ biến. */
export function isDirectAudioUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return /\.(mp3|m4a|ogg|oga|wav|aac|flac)$/i.test(u.pathname)
  } catch {
    return false
  }
}

/** Nhận URL user paste → detect type + trả về canonical embed URL, hoặc null nếu
 *  không hỗ trợ. Dùng chung bởi modal + toolbar. */
export function resolveMediaUrl(
  url: string,
): { type: MediaType; src: string } | null {
  if (!url.trim()) return null
  const videoId = parseYouTubeId(url)
  if (videoId) {
    return { type: "youtube", src: `https://www.youtube.com/embed/${videoId}` }
  }
  if (isDirectAudioUrl(url)) {
    return { type: "audio", src: url.trim() }
  }
  return null
}

/**
 * TipTap node cho media embed — atom (non-editable), block-level, draggable.
 * Hai loại:
 *  - youtube: iframe tới youtube.com/embed/{id} (responsive 16:9)
 *  - audio: <audio controls> cho .mp3/.m4a/.ogg/.wav direct URL
 *
 * HTML output được DOMPurify sanitize (xem lib/sanitize.ts) — iframe src phải
 * match youtube.com/embed/ regex, audio src phải https://. Bypass script XSS.
 */
export const MediaEmbed = Node.create({
  name: "mediaEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      type: { default: "youtube" },
      /** Width dưới dạng CSS value ("480px", "75%", …). Null = full max-width
       *  container (720px cap via CSS). Chiều cao derive từ aspect-ratio CSS. */
      width: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: "div[data-media-embed-type='youtube']",
        getAttrs: (el) => {
          const root = el as HTMLElement
          const iframe = root.querySelector("iframe")
          return {
            src: iframe?.getAttribute("src") ?? null,
            type: "youtube",
            width: root.style.width || null,
          }
        },
      },
      {
        tag: "div[data-media-embed-type='audio']",
        getAttrs: (el) => {
          const root = el as HTMLElement
          const audio = root.querySelector("audio")
          return {
            src: audio?.getAttribute("src") ?? null,
            type: "audio",
            width: root.style.width || null,
          }
        },
      },
      // Fallback parse từ bare iframe/audio (nếu HTML paste không có wrapper)
      {
        tag: "iframe[data-media-embed='youtube']",
        getAttrs: (el) => ({
          src: (el as HTMLElement).getAttribute("src"),
          type: "youtube",
        }),
      },
      {
        tag: "audio[data-media-embed='audio']",
        getAttrs: (el) => ({
          src: (el as HTMLElement).getAttribute("src"),
          type: "audio",
        }),
      },
    ]
  },

  renderHTML({ node }) {
    const src = node.attrs.src as string
    const type = node.attrs.type as MediaType
    const width = node.attrs.width as string | null
    const style = width ? `width: ${width}` : undefined
    if (type === "youtube") {
      return [
        "div",
        mergeAttributes({
          class: "media-embed media-embed-youtube",
          "data-media-embed-type": "youtube",
          ...(style ? { style } : {}),
        }),
        [
          "iframe",
          {
            src,
            "data-media-embed": "youtube",
            allow:
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
            allowfullscreen: "",
            frameborder: "0",
            loading: "lazy",
          },
        ],
      ]
    }
    // audio — không hỗ trợ resize (control bar auto-fit), bỏ qua width attr
    return [
      "div",
      mergeAttributes({
        class: "media-embed media-embed-audio",
        "data-media-embed-type": "audio",
      }),
      [
        "audio",
        {
          src,
          "data-media-embed": "audio",
          controls: "",
          preload: "metadata",
        },
      ],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(NodeViewMediaEmbed)
  },
})
