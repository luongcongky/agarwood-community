/**
 * SEO scoring engine for news articles.
 *
 * Implements the 19-criterion rubric supplied by the customer (legacy, 100 pts)
 * plus a "modern" criterion category (bonus, 32 pts) that reflects how Google
 * actually ranks content in 2026 — alt text, slug quality, internal links, etc.
 *
 * The cached `seoScore` field stores the LEGACY total (0-100) so admin
 * dashboards sort against the customer-facing rubric. Modern checks live in
 * `seoScoreDetail.modernChecks` for display only.
 *
 * Pure module — no DB / IO. The caller supplies `previousTitles` for the
 * duplicate-title check (criterion 6).
 */

export type SeoCategory = "title" | "sapo" | "heading" | "image" | "content" | "modern"

export type SeoCheck = {
  id: string
  label: string
  category: SeoCategory
  maxPoints: number
  earned: number
  passed: boolean
  hint?: string
}

export type SeoInput = {
  title: string
  seoTitle?: string | null
  excerpt?: string | null
  seoDescription?: string | null
  /** HTML body, sanitized */
  content: string
  focusKeyword?: string | null
  secondaryKeywords?: string[] | null
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  slug?: string | null
  /** Other published articles' titles, for duplicate-title check */
  previousTitles?: string[]
  /** Number of locales (besides VI) translated. 0–3. */
  translatedLocaleCount?: number
}

export type SeoResult = {
  /** Sum of legacy checks only — the cached `seoScore` value (0-100). */
  legacyScore: number
  legacyMax: number
  /** Sum of modern (bonus) checks (0-32). */
  modernScore: number
  modernMax: number
  /** All checks, in display order. */
  checks: SeoCheck[]
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Strip HTML tags, decode common entities, collapse whitespace. */
export function stripHtml(html: string): string {
  if (!html) return ""
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/** Count whitespace-separated tokens. Vietnamese words are space-delimited
 *  in standard orthography, so this is accurate for VN content. */
export function countWords(text: string): number {
  if (!text) return 0
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/** Take first N words; returns the joined substring. */
export function firstNWords(text: string, n: number): string {
  if (!text || n <= 0) return ""
  return text.trim().split(/\s+/).slice(0, n).join(" ")
}

/** Extract <h2> inner text from HTML. Returns array of plain-text strings. */
export function extractH2(html: string): string[] {
  if (!html) return []
  const out: string[] = []
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    out.push(stripHtml(m[1]).trim())
  }
  return out
}

/** Extract first <p> text from HTML. Falls back to first 30 words of stripped
 *  content when no <p> is found (e.g., content is plain text). */
export function firstParagraph(html: string): string {
  if (!html) return ""
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (m) return stripHtml(m[1]).trim()
  return firstNWords(stripHtml(html), 60)
}

/** Count <img> tags in HTML. */
export function countImages(html: string): number {
  if (!html) return 0
  return (html.match(/<img\b[^>]*>/gi) ?? []).length
}

/** Count <img> tags missing a non-empty alt= attribute. */
export function countImagesMissingAlt(html: string): number {
  if (!html) return 0
  const imgs = html.match(/<img\b[^>]*>/gi) ?? []
  return imgs.filter((tag) => !/\balt\s*=\s*["'][^"']+["']/i.test(tag)).length
}

/** Count internal anchor tags (href starting with /, # not counted). */
export function countInternalLinks(html: string): number {
  if (!html) return 0
  const anchors = html.match(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi) ?? []
  let count = 0
  for (const a of anchors) {
    const m = a.match(/href\s*=\s*["']([^"']+)["']/i)
    const href = m?.[1] ?? ""
    if (href.startsWith("/") && !href.startsWith("//")) count++
  }
  return count
}

/** Count external anchor tags (href starts with http(s)://). */
export function countExternalLinks(html: string): number {
  if (!html) return 0
  const anchors = html.match(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi) ?? []
  let count = 0
  for (const a of anchors) {
    const m = a.match(/href\s*=\s*["']([^"']+)["']/i)
    const href = m?.[1] ?? ""
    if (/^https?:\/\//i.test(href)) count++
  }
  return count
}

/** Lowercase + collapse whitespace for case-insensitive search. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

/** Strip Vietnamese diacritics (a→a, â→a, đ→d, ư→u, ...). Used when comparing
 *  a Vietnamese keyword against a slug, since slugs lose diacritics. */
function stripDiacritics(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
}

/** Escape regex metachars in a string. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Case-insensitive count of `needle` occurrences in `haystack`.
 *  Counts all occurrences (including overlapping word boundaries). */
export function countOccurrences(haystack: string, needle: string): number {
  if (!haystack || !needle) return 0
  const h = normalize(haystack)
  const n = normalize(needle)
  if (!n) return 0
  const re = new RegExp(escapeRegex(n), "g")
  return (h.match(re) ?? []).length
}

/** Whether `text` contains every individual word of `keyword` (case-insensitive).
 *  "trầm hương kỳ nam" passes if title contains all four words anywhere.
 *  This matches the Vietnamese rubric phrasing "kiểm tra sự tồn tại của từ
 *  khóa chính (theo từ đơn)" — by single word. */
export function containsAllWords(text: string, keyword: string): boolean {
  if (!text || !keyword) return false
  const t = normalize(text)
  const words = normalize(keyword).split(" ").filter(Boolean)
  if (words.length === 0) return false
  return words.every((w) => {
    const re = new RegExp(`(^|\\s)${escapeRegex(w)}(\\s|$|[.,!?;:])`, "u")
    return re.test(t) || t.includes(w)
  })
}

/** Whether `text` contains the keyword as exact phrase (case-insensitive). */
export function containsPhrase(text: string, phrase: string): boolean {
  if (!text || !phrase) return false
  return normalize(text).includes(normalize(phrase))
}

/** Compute keyword density as a percentage of total words.
 *  Counts phrase occurrences × phrase word-count / total words × 100. */
export function keywordDensity(plainText: string, keyword: string): number {
  const total = countWords(plainText)
  if (total === 0 || !keyword) return 0
  const occ = countOccurrences(plainText, keyword)
  const kwWords = countWords(keyword)
  return (occ * kwWords * 100) / total
}

// ────────────────────────────────────────────────────────────────────────────
// Scoring rules
// ────────────────────────────────────────────────────────────────────────────

function check(
  id: string,
  label: string,
  category: SeoCategory,
  maxPoints: number,
  earned: number,
  hint?: string,
): SeoCheck {
  const clamped = Math.max(0, Math.min(maxPoints, earned))
  return {
    id,
    label,
    category,
    maxPoints,
    earned: clamped,
    passed: clamped >= maxPoints,
    hint: clamped < maxPoints ? hint : undefined,
  }
}

export function scoreSeo(input: SeoInput): SeoResult {
  const checks: SeoCheck[] = []

  // Resolve effective fields. SEO override wins; falls back to article field.
  const effectiveTitle = (input.seoTitle && input.seoTitle.trim()) || input.title || ""
  const effectiveSapo = (input.seoDescription && input.seoDescription.trim()) || (input.excerpt ?? "") || ""
  const focusKw = (input.focusKeyword ?? "").trim()
  const secKws = (input.secondaryKeywords ?? []).map((k) => k.trim()).filter(Boolean)
  const hasSecondary = secKws.length > 0
  const html = input.content ?? ""
  const plainContent = stripHtml(html)
  const contentWords = countWords(plainContent)
  const titleWords = countWords(effectiveTitle)
  const sapoWords = countWords(effectiveSapo)

  // ─── Tiêu đề chính ──────────────────────────────────────────────────────
  // 1. Tiêu đề chính tồn tại — 2 đ
  checks.push(check(
    "title.exists", "Tiêu đề chính tồn tại", "title", 2,
    effectiveTitle.length > 0 ? 2 : 0,
    "Hãy nhập tiêu đề cho bài viết.",
  ))
  // 2. Đủ dài (số từ > 10) — 2 đ
  checks.push(check(
    "title.minWords", "Tiêu đề có ít nhất 10 từ", "title", 2,
    titleWords > 10 ? 2 : 0,
    `Tiêu đề hiện ${titleWords} từ. Cần > 10 từ.`,
  ))
  // 3. Không vượt quá độ dài tiêu chuẩn (>= 15 từ; <= 80 ký tự) — 2 đ
  // Note: rubric says "không ít hơn 15 từ; không vượt quá 80 ký tự" — passes
  // when title has >= 15 words AND total length ≤ 80 chars.
  const titleChars = effectiveTitle.length
  checks.push(check(
    "title.standardLength",
    "Tiêu đề ≥ 15 từ và ≤ 80 ký tự", "title", 2,
    titleWords >= 15 && titleChars <= 80 ? 2 : 0,
    `Hiện ${titleWords} từ / ${titleChars} ký tự. Cần ≥ 15 từ và ≤ 80 ký tự.`,
  ))
  // 4. Chứa từ khóa chính — 10 đ (+ 4 nếu không có từ khóa phụ — rule 5 cuộn xuống)
  const c4MaxBase = 10
  const c4Max = c4MaxBase + (hasSecondary ? 0 : 4)
  const c4Pass = focusKw && containsAllWords(effectiveTitle, focusKw)
  checks.push(check(
    "title.focusKw", "Tiêu đề chứa từ khóa chính", "title", c4Max,
    c4Pass ? c4Max : 0,
    focusKw
      ? `Hãy thêm từ khóa "${focusKw}" vào tiêu đề.`
      : "Chưa khai báo từ khóa chính.",
  ))
  // 5. Chứa từ khóa phụ — 4 đ (chỉ tính khi có từ khóa phụ)
  if (hasSecondary) {
    const anySecHit = secKws.some((kw) => containsAllWords(effectiveTitle, kw))
    checks.push(check(
      "title.secondaryKw", "Tiêu đề chứa ít nhất 1 từ khóa phụ", "title", 4,
      anySecHit ? 4 : 0,
      `Hãy thêm 1 trong các từ khóa phụ vào tiêu đề: ${secKws.join(", ")}.`,
    ))
  }
  // 6. Không trùng lặp tiêu đề cũ — 2 đ
  const prev = (input.previousTitles ?? []).map(normalize)
  const dup = prev.includes(normalize(effectiveTitle))
  checks.push(check(
    "title.unique", "Tiêu đề không trùng với bài đã đăng", "title", 2,
    !dup ? 2 : 0,
    "Tiêu đề trùng với một bài đã đăng. Hãy đặt tiêu đề khác.",
  ))

  // ─── SAPO (Sapo / excerpt / SEO description) ────────────────────────────
  // 7. Sapo tồn tại — 2 đ
  checks.push(check(
    "sapo.exists", "Sapo tồn tại", "sapo", 2,
    effectiveSapo.length > 0 ? 2 : 0,
    "Hãy nhập sapo (mô tả ngắn) cho bài viết.",
  ))
  // 8. Độ dài đủ (30 ≤ words ≤ 165) — 4 đ
  checks.push(check(
    "sapo.length", "Sapo dài 30–165 từ", "sapo", 4,
    sapoWords >= 30 && sapoWords <= 165 ? 4 : 0,
    `Sapo hiện ${sapoWords} từ. Cần 30–165 từ.`,
  ))
  // 9. Chứa từ khóa chính — 10 đ (+ 6 nếu không có phụ)
  const c9Max = 10 + (hasSecondary ? 0 : 6)
  const c9Pass = focusKw && containsAllWords(effectiveSapo, focusKw)
  checks.push(check(
    "sapo.focusKw", "Sapo chứa từ khóa chính", "sapo", c9Max,
    c9Pass ? c9Max : 0,
    focusKw ? `Hãy nhắc đến "${focusKw}" trong sapo.` : "Chưa khai báo từ khóa chính.",
  ))
  // 10. Chứa từ khóa phụ — 6 đ (chỉ khi có)
  if (hasSecondary) {
    const anySecHit = secKws.some((kw) => containsAllWords(effectiveSapo, kw))
    checks.push(check(
      "sapo.secondaryKw", "Sapo chứa ít nhất 1 từ khóa phụ", "sapo", 6,
      anySecHit ? 6 : 0,
      `Hãy thêm 1 từ khóa phụ vào sapo: ${secKws.join(", ")}.`,
    ))
  }

  // ─── Heading ────────────────────────────────────────────────────────────
  const h2s = extractH2(html)
  // 11. Tồn tại H2 (≥ 1 thẻ, > 5 từ trong thẻ) — 4 đ
  const goodH2 = h2s.find((h) => countWords(h) > 5)
  checks.push(check(
    "h2.exists", "Có ít nhất 1 thẻ H2 có > 5 từ", "heading", 4,
    goodH2 ? 4 : 0,
    h2s.length === 0
      ? "Thêm tiêu đề phụ (H2) vào nội dung."
      : "Có H2 nhưng quá ngắn (≤ 5 từ). Viết H2 chi tiết hơn.",
  ))
  // 12. Không trùng lặp + chứa từ khóa chính/phụ — 4 đ
  const h2sNorm = h2s.map(normalize)
  const noDup = new Set(h2sNorm).size === h2sNorm.length
  const allHaveKw = h2s.length > 0 && h2s.every((h) =>
    (focusKw && containsAllWords(h, focusKw)) ||
    secKws.some((kw) => containsAllWords(h, kw)),
  )
  checks.push(check(
    "h2.uniqueAndKw", "H2 không trùng và chứa từ khóa", "heading", 4,
    noDup && allHaveKw ? 4 : 0,
    h2s.length === 0
      ? "Chưa có H2 nào."
      : !noDup
        ? "Có 2 H2 giống nhau. Hãy viết tiêu đề phụ khác biệt."
        : "Mỗi H2 nên chứa từ khóa chính hoặc từ khóa phụ.",
  ))

  // ─── Hình ảnh trong nội dung ────────────────────────────────────────────
  // 13. Có hình ảnh trong nội dung — 10 đ
  const imgCount = countImages(html)
  checks.push(check(
    "image.exists", "Nội dung có hình ảnh minh họa", "image", 10,
    imgCount >= 1 ? 10 : 0,
    "Thêm ít nhất 1 hình ảnh vào nội dung.",
  ))

  // ─── Nội dung ───────────────────────────────────────────────────────────
  // 14. Đủ độ dài (≥ 300 từ) — 5 đ
  checks.push(check(
    "content.minLength", "Nội dung ≥ 300 từ", "content", 5,
    contentWords >= 300 ? 5 : 0,
    `Nội dung hiện ${contentWords} từ. Cần ≥ 300 từ.`,
  ))
  // 15. Từ khóa chính trong 30 từ đầu — 12 đ (+ 5 nếu không có phụ)
  const firstPara = firstParagraph(html)
  const firstParaHead = firstNWords(firstPara, 30)
  const c15Max = 12 + (hasSecondary ? 0 : 5)
  const c15Pass = focusKw && containsAllWords(firstParaHead, focusKw)
  checks.push(check(
    "content.focusKwIntro", "Từ khóa chính xuất hiện trong 30 từ đầu", "content", c15Max,
    c15Pass ? c15Max : 0,
    focusKw
      ? `Hãy đưa "${focusKw}" vào ngay đoạn mở đầu (30 từ đầu).`
      : "Chưa khai báo từ khóa chính.",
  ))
  // 16. Từ khóa phụ trong 30 từ đầu — 5 đ
  if (hasSecondary) {
    const anySecHit = secKws.some((kw) => containsAllWords(firstParaHead, kw))
    checks.push(check(
      "content.secondaryKwIntro",
      "Từ khóa phụ xuất hiện trong 30 từ đầu", "content", 5,
      anySecHit ? 5 : 0,
      "Đưa 1 từ khóa phụ vào đoạn mở đầu.",
    ))
  }
  // 17. Mật độ từ khóa chính ≥ 3% — 10 đ
  const focusDensity = focusKw ? keywordDensity(plainContent, focusKw) : 0
  checks.push(check(
    "content.focusKwDensity", "Mật độ từ khóa chính ≥ 3%", "content", 10,
    focusDensity >= 3 ? 10 : 0,
    focusKw
      ? `Mật độ hiện ${focusDensity.toFixed(2)}%. Cần ≥ 3% (lưu ý: > 4% có thể bị Google coi là spam).`
      : "Chưa khai báo từ khóa chính.",
  ))
  // 18. Mật độ từ khóa phụ ≥ 1% — 3 đ (+ 0; gộp vào focus nếu không có)
  if (hasSecondary) {
    const secDensity = secKws.reduce((sum, kw) => sum + keywordDensity(plainContent, kw), 0)
    checks.push(check(
      "content.secondaryKwDensity",
      "Tổng mật độ từ khóa phụ ≥ 1%", "content", 3,
      secDensity >= 1 ? 3 : 0,
      `Mật độ phụ hiện ${secDensity.toFixed(2)}%. Cần ≥ 1%.`,
    ))
  } else {
    // Cuộn 3 điểm sang focus density: nâng max của c17 từ 10 → 13.
    // Đã pass focus density? đẩy lên 13. Không pass? giữ 0.
    const c17 = checks.find((c) => c.id === "content.focusKwDensity")
    if (c17) {
      c17.maxPoints += 3
      if (focusDensity >= 3) c17.earned = c17.maxPoints
      c17.passed = c17.earned >= c17.maxPoints
    }
  }
  // 19. Tổng mật độ ≤ 10% — 3 đ
  const totalDensity = focusDensity + secKws.reduce((sum, kw) => sum + keywordDensity(plainContent, kw), 0)
  checks.push(check(
    "content.totalDensityCap", "Tổng mật độ từ khóa ≤ 10%", "content", 3,
    totalDensity <= 10 ? 3 : 0,
    `Tổng mật độ hiện ${totalDensity.toFixed(2)}%. Đang quá dày (spam).`,
  ))

  // ─── Modern (bonus) — 32 pts ────────────────────────────────────────────
  const altText = (input.coverImageAlt ?? "").trim()
  // M1. Alt text ảnh cover có chứa từ khóa — 5 đ
  checks.push(check(
    "modern.coverAltKw", "Alt text ảnh cover chứa từ khóa chính", "modern", 5,
    focusKw && altText && containsAllWords(altText, focusKw) ? 5 : 0,
    !altText
      ? "Thêm alt text cho ảnh cover."
      : `Alt hiện "${altText}" — hãy thêm "${focusKw}".`,
  ))
  // M2. Slug chứa từ khóa chính — 5 đ. Slugs strip diacritics, so we
  // compare diacritic-free forms on both sides.
  const slug = (input.slug ?? "").trim()
  const slugWords = slug.replace(/-/g, " ")
  const slugMatch = !!(focusKw && slug &&
    stripDiacritics(focusKw)
      .split(" ")
      .filter(Boolean)
      .every((w) => stripDiacritics(slugWords).includes(w)))
  checks.push(check(
    "modern.slugKw", "Slug URL chứa từ khóa chính", "modern", 5,
    slugMatch ? 5 : 0,
    "Đặt slug có chứa từ khóa chính (vd /tram-huong-ky-nam).",
  ))
  // M3. SEO Title ≤ 60 ký tự — 3 đ
  checks.push(check(
    "modern.seoTitleLength", "SEO Title ≤ 60 ký tự (tránh bị cắt trên Google)", "modern", 3,
    titleChars > 0 && titleChars <= 60 ? 3 : 0,
    `Hiện ${titleChars} ký tự. Google cắt sau ~60.`,
  ))
  // M4. SEO Description 140-160 ký tự — 3 đ
  const sapoChars = effectiveSapo.length
  checks.push(check(
    "modern.seoDescLength", "SEO Description 140–160 ký tự", "modern", 3,
    sapoChars >= 140 && sapoChars <= 160 ? 3 : 0,
    `Hiện ${sapoChars} ký tự. Tối ưu cho Google: 140–160.`,
  ))
  // M5. ≥ 2 internal links — 5 đ
  const internalLinks = countInternalLinks(html)
  checks.push(check(
    "modern.internalLinks", "Có ≥ 2 link nội bộ", "modern", 5,
    internalLinks >= 2 ? 5 : 0,
    `Hiện ${internalLinks} link. Hãy link sang 2 bài liên quan trong website.`,
  ))
  // M6. ≥ 1 external link uy tín — 3 đ
  const externalLinks = countExternalLinks(html)
  checks.push(check(
    "modern.externalLink", "Có ≥ 1 link đến nguồn ngoài", "modern", 3,
    externalLinks >= 1 ? 3 : 0,
    "Trích dẫn 1 nguồn uy tín bên ngoài (báo, viện nghiên cứu...).",
  ))
  // M7. Mọi <img> trong nội dung đều có alt — 5 đ
  const missingAlt = countImagesMissingAlt(html)
  checks.push(check(
    "modern.imgAltAll", "Mọi ảnh trong nội dung đều có alt text", "modern", 5,
    imgCount > 0 && missingAlt === 0 ? 5 : 0,
    imgCount === 0
      ? "Chưa có ảnh nào trong nội dung."
      : `${missingAlt} ảnh thiếu alt text.`,
  ))
  // M8. Đã dịch sang ≥ 1 ngôn ngữ khác — 3 đ
  const translated = input.translatedLocaleCount ?? 0
  checks.push(check(
    "modern.translated", "Đã dịch sang ít nhất 1 ngôn ngữ khác", "modern", 3,
    translated >= 1 ? 3 : 0,
    "Dịch tiêu đề/sapo/nội dung sang EN/ZH/AR để mở rộng đối tượng.",
  ))

  // ─── Summary ────────────────────────────────────────────────────────────
  const legacyChecks = checks.filter((c) => c.category !== "modern")
  const modernChecks = checks.filter((c) => c.category === "modern")
  const sum = (arr: SeoCheck[], k: keyof Pick<SeoCheck, "maxPoints" | "earned">) =>
    arr.reduce((a, c) => a + c[k], 0)

  return {
    legacyScore: Math.round(sum(legacyChecks, "earned")),
    legacyMax: sum(legacyChecks, "maxPoints"),
    modernScore: Math.round(sum(modernChecks, "earned")),
    modernMax: sum(modernChecks, "maxPoints"),
    checks,
  }
}
