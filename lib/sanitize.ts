import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitize HTML for rich text article content.
 *
 * Whitelist:
 *  - `<figure>` + `<figcaption>` — ContentImageEditor output.
 *  - `<iframe>` — only for YouTube embed (src must match youtube(-nocookie).com/embed/).
 *  - `<audio>` — only https:// source with common audio extension.
 *
 * Iframe/audio src validation runs in an uponSanitizeAttribute hook — any src
 * not matching whitelist pattern is stripped (leaving a neutered element).
 *
 * Used on:
 *  - /api/admin/news (POST/PATCH) when admin saves
 *  - /tin-tuc/[slug] + /nghien-cuu/[slug] render (defense-in-depth)
 */

const YOUTUBE_EMBED_RE =
  /^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/[\w-]{11}(?:\?[\w=&%-]*)?$/i

const AUDIO_SRC_RE = /^https:\/\/[^\s<>]+\.(?:mp3|m4a|ogg|oga|wav|aac|flac)(?:\?[\w=&%-]*)?$/i

/** Cho phép `style="width: <px|%>"` trên wrapper div của media-embed (resize).
 *  Figure/image style đã whitelisted từ trước qua prose CSS. */
const SAFE_STYLE_RE = /^\s*(?:width\s*:\s*\d+(?:\.\d+)?(?:px|%|rem|em)\s*;?\s*)+$/i

let hookAttached = false

function ensureHook() {
  if (hookAttached) return
  hookAttached = true
  DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    const tag = (node as Element).tagName?.toLowerCase()
    if (data.attrName === "src") {
      if (tag === "iframe" && !YOUTUBE_EMBED_RE.test(data.attrValue)) {
        data.keepAttr = false
      }
      if (tag === "audio" && !AUDIO_SRC_RE.test(data.attrValue)) {
        data.keepAttr = false
      }
    }
    if (data.attrName === "style" && tag === "div") {
      // Chỉ cho phép style đơn giản `width: …` trên media-embed wrapper
      const isMediaWrapper = (node as Element).classList?.contains("media-embed")
      if (!isMediaWrapper || !SAFE_STYLE_RE.test(data.attrValue)) {
        data.keepAttr = false
      }
    }
  })
}

export function sanitizeArticleHtml(html: string): string {
  ensureHook()
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["figure", "figcaption", "iframe", "audio", "source"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "loading",
      "controls",
      "preload",
      "data-media-embed",
      "data-media-embed-type",
      "title",
    ],
  })
}
