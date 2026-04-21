/**
 * Shared blur placeholder for Next.js Image components.
 *
 * A tiny base64-encoded SVG in the brand's tan/sand color — about 80 bytes
 * total. When `placeholder="blur"` is set on a Next.js Image, it renders
 * this as the background while the real image loads, eliminating the
 * blank frame + layout jump that bare images produce.
 *
 * Why a static SVG instead of per-image Cloudinary blur URLs:
 *   - Per-image LQIP needs either server-side fetch-and-base64 (adds 200ms
 *     per render) or an upload-time backfill (schema change + migration).
 *   - A single branded swatch looks coherent across the site and adds
 *     zero runtime cost.
 *
 * Color `#f5ebd7` matches the `bg-brand-100` Tailwind token used for card
 * backgrounds, so the blur blends with the surrounding layout.
 */
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjMiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjMiIGZpbGw9IiNmNWViZDciLz48L3N2Zz4="
