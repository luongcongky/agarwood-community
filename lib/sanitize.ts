import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitize HTML for rich text article content.
 *
 * Whitelist `<figure>` + `<figcaption>` explicitly — DOMPurify's default
 * config allows them on modern versions, but declaring via ADD_TAGS is
 * defensive in case future upgrades tighten the profile.
 *
 * Used on:
 *  - /api/admin/news (POST/PATCH) when admin saves
 *  - /tin-tuc/[slug] when rendering to viewer (defense-in-depth)
 */
export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["figure", "figcaption"],
  })
}
