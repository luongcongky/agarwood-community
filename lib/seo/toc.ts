/**
 * Table-of-contents helpers for news article pages.
 *
 * extractTocFromHtml — pulls H2 text out of sanitized article HTML to build
 * a sidebar / in-page TOC.
 *
 * addAnchorIdsToH2 — mutates the HTML to attach stable `id` attributes on
 * H2 tags so TOC links can jump to them. IDs are slugified from the H2
 * text, with a numeric suffix on collisions.
 */

import { slugify } from "@/lib/utils"

export type TocEntry = {
  id: string
  text: string
}

/** Parse H2 tags and return their inner text as TOC entries. */
export function extractTocFromHtml(html: string): TocEntry[] {
  if (!html) return []
  const entries: TocEntry[] = []
  const seen = new Map<string, number>()
  const re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = m[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
    if (!text) continue
    let id = slugify(text)
    if (!id) continue
    const prior = seen.get(id) ?? 0
    if (prior > 0) id = `${id}-${prior + 1}`
    seen.set(slugify(text), prior + 1)
    entries.push({ id, text })
  }
  return entries
}

/** Inject `id="..."` attributes into H2 tags so in-page anchors work.
 *  Uses the same slugification as extractTocFromHtml so IDs line up. */
export function addAnchorIdsToH2(html: string): string {
  if (!html) return html
  const seen = new Map<string, number>()
  return html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (full, attrs: string | undefined, inner: string) => {
    const text = inner
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    if (!text) return full
    const base = slugify(text)
    if (!base) return full
    const prior = seen.get(base) ?? 0
    const id = prior > 0 ? `${base}-${prior + 1}` : base
    seen.set(base, prior + 1)
    // Preserve any existing attributes; if `id=` already there, don't override.
    const attrStr = attrs ?? ""
    if (/\sid\s*=/.test(attrStr)) return full
    return `<h2${attrStr} id="${id}">${inner}</h2>`
  })
}
