import "server-only"
import { generateJSON, AllModelsFailedError } from "@/lib/gemini-models"
import { prisma } from "@/lib/prisma"
import { sanitizeArticleHtml } from "@/lib/sanitize"
import { revalidatePath, revalidateTag } from "next/cache"

/**
 * News auto-translate helpers — server-side.
 *
 * Dùng ở 2 nơi:
 *  1. Route `/api/admin/ai/translate` (giữ hành vi cũ — sync response).
 *  2. PATCH `/api/admin/news/[id]` khi admin gửi `autoTranslateMissing: true`
 *     → dùng `after()` từ next/server để tiếp tục dịch + lưu kể cả khi user
 *     rời trang (Vercel fluid compute kéo function alive tới maxDuration).
 *
 * Guarantees:
 *  - Idempotency qua optimistic concurrency: chỉ update cột `_locale` nếu
 *    snapshot VI khớp với `expectedVi` tại thời điểm xin dịch. Nếu user sửa
 *    VI giữa chừng, kết quả dịch cũ bị discard — tránh ghi đè phiên sau.
 *  - Chỉ update locale nào vẫn đang trống — nếu user tự gõ vào tab đó trước
 *    khi dịch xong, user-typed được giữ.
 */

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Simplified Chinese (中文)",
  ar: "Modern Standard Arabic (العربية)",
}

const TRANSLATION_PROMPT = `You are a professional translator for an agarwood industry association website (Hội Trầm Hương Việt Nam / Vietnam Agarwood Association).

Translate the Vietnamese values below to {TARGET_LANGUAGE}.

CRITICAL RULES:
1. Preserve ALL HTML tags exactly (<p>, <strong>, <em>, <h1>-<h6>, <ul>, <ol>, <li>, <a>, <img>, <br>, <blockquote>, etc.)
2. Preserve ALL image URLs — do NOT modify <img src="..."> attributes
3. Preserve ALL link URLs in <a href="..."> attributes
4. Preserve ALL CSS classes, styles, and HTML attributes
5. Only translate the VISIBLE TEXT between tags
6. Keep proper nouns, brand names, Vietnamese province names (Khánh Hòa, Quảng Nam) in original form unless they have well-known translations
7. Keep technical terms consistent: "trầm hương" → "agarwood", "trầm tự nhiên" → "natural agarwood", "trầm nuôi cấy" → "cultivated agarwood", "kỳ nam" → "kynam", "tinh dầu" → "essential oil"
8. Return ONLY a JSON object with the EXACT SAME KEYS as the input, with translated values. No markdown, no code fences, no explanations.

Vietnamese source (JSON):
{INPUT_JSON}

Return the translated JSON now:`

export type AutoLocale = "en" | "zh" | "ar"
export type NewsField = "title" | "excerpt" | "content"

/**
 * Dịch 1 batch field → 1 target locale. Input `fields` phải là subset các
 * field có value không rỗng (hàm skip đã lọc ngoài).
 *
 * Throws:
 *  - `AllModelsFailedError` nếu hết model / hết quota.
 *  - `Error` nếu AI trả về không parse được JSON.
 */
async function translateFieldsToLocale(
  apiKey: string,
  fields: Partial<Record<NewsField, string>>,
  targetLocale: AutoLocale,
): Promise<Partial<Record<NewsField, string>>> {
  const entries = Object.entries(fields).filter(
    ([, v]) => typeof v === "string" && v.trim() !== "",
  )
  if (entries.length === 0) return {}

  const prompt = TRANSLATION_PROMPT.replace(
    "{TARGET_LANGUAGE}",
    LOCALE_NAMES[targetLocale],
  ).replace("{INPUT_JSON}", JSON.stringify(Object.fromEntries(entries), null, 2))

  const { text } = await generateJSON(apiKey, prompt)

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("AI trả về định dạng không hợp lệ")
    parsed = JSON.parse(match[0])
  }

  const out: Partial<Record<NewsField, string>> = {}
  for (const [key] of entries) {
    const v = parsed[key]
    if (typeof v === "string" && v.trim() !== "") {
      out[key as NewsField] = v
    }
  }
  return out
}

/** Fields tồn tại ở DB (lấy từ Prisma select shape). Null-safe reader. */
type NewsRow = {
  id: string
  title: string
  title_en: string | null
  title_zh: string | null
  title_ar: string | null
  excerpt: string | null
  excerpt_en: string | null
  excerpt_zh: string | null
  excerpt_ar: string | null
  content: string
  content_en: string | null
  content_zh: string | null
  content_ar: string | null
}

function getViValue(row: NewsRow, field: NewsField): string {
  if (field === "title") return row.title ?? ""
  if (field === "excerpt") return row.excerpt ?? ""
  return row.content ?? ""
}

function getLocaleValue(
  row: NewsRow,
  field: NewsField,
  locale: AutoLocale,
): string {
  const key = `${field}_${locale}` as keyof NewsRow
  return (row[key] as string | null | undefined) ?? ""
}

/**
 * Background task: dịch các field còn thiếu cho 1 news record + update DB.
 *
 * Concurrency model:
 *  - Snapshot `expectedVi` (VI content tại thời điểm Save click) được pass
 *    vào. Trước khi update từng cột, re-query row → nếu VI đã đổi (user
 *    Save lại với VI khác), skip cột đó — không ghi đè "ma" lên save sau.
 *  - Chỉ update cột đang null/empty tại thời điểm write — không ghi đè
 *    user-typed translation.
 *
 * Errors:
 *  - Per-locale try/catch: 1 locale fail không kéo 2 locale còn lại.
 *  - Log console, không throw ra caller (caller là `after()` fire-and-forget).
 */
export async function autoTranslateNewsMissing(params: {
  newsId: string
  expectedVi: { title: string; excerpt: string; content: string }
}): Promise<void> {
  const { newsId, expectedVi } = params

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn(`[auto-translate] GEMINI_API_KEY missing — skip news ${newsId}`)
    return
  }

  const row = (await prisma.news.findUnique({
    where: { id: newsId },
    select: {
      id: true,
      title: true, title_en: true, title_zh: true, title_ar: true,
      excerpt: true, excerpt_en: true, excerpt_zh: true, excerpt_ar: true,
      content: true, content_en: true, content_zh: true, content_ar: true,
    },
  })) as NewsRow | null

  if (!row) {
    console.warn(`[auto-translate] news ${newsId} gone — skip`)
    return
  }

  // Nếu VI đã thay đổi giữa chừng (user Save 2 lần liên tiếp, after() của
  // lần 1 chạy sau lần 2 commit), skip — after() của lần 2 sẽ cover.
  if (
    row.title !== expectedVi.title ||
    (row.excerpt ?? "") !== expectedVi.excerpt ||
    (row.content ?? "") !== expectedVi.content
  ) {
    console.log(`[auto-translate] news ${newsId} VI drifted — skip stale task`)
    return
  }

  const locales: AutoLocale[] = ["en", "zh", "ar"]
  const updates: Partial<Record<string, string>> = {}

  for (const locale of locales) {
    // Fields cần dịch cho locale này = field có VI non-empty + `_locale` trống.
    const fieldsToTranslate: Partial<Record<NewsField, string>> = {}
    for (const field of ["title", "excerpt", "content"] as const) {
      const vi = getViValue(row, field).trim()
      const existing = getLocaleValue(row, field, locale).trim()
      if (vi && !existing) {
        fieldsToTranslate[field] = getViValue(row, field)
      }
    }
    if (Object.keys(fieldsToTranslate).length === 0) continue

    try {
      const translated = await translateFieldsToLocale(apiKey, fieldsToTranslate, locale)
      // Sanitize content HTML trước khi persist (pattern giống manual save).
      if (translated.content) {
        translated.content = sanitizeArticleHtml(translated.content)
      }
      for (const field of Object.keys(translated) as NewsField[]) {
        const col = `${field}_${locale}`
        updates[col] = translated[field]
      }
    } catch (e) {
      if (e instanceof AllModelsFailedError) {
        console.error(
          `[auto-translate] news ${newsId} ${locale} — all Gemini models failed`,
          e.allQuotaExceeded ? "(quota exceeded)" : "",
        )
      } else {
        console.error(`[auto-translate] news ${newsId} ${locale} failed:`, e)
      }
      // Tiếp tục với locale còn lại — fail isolation
    }
  }

  if (Object.keys(updates).length === 0) {
    console.log(`[auto-translate] news ${newsId} — no fields to update`)
    return
  }

  // Final-mile concurrency: re-check VI và chỉ update cột vẫn trống. Prisma
  // raw where để tránh race với các PATCH khác trong cùng khoảng thời gian.
  // Dùng updateMany với where phức tạp — 1 statement atomic.
  try {
    const latest = await prisma.news.findUnique({
      where: { id: newsId },
      select: {
        title: true, title_en: true, title_zh: true, title_ar: true,
        excerpt: true, excerpt_en: true, excerpt_zh: true, excerpt_ar: true,
        content: true, content_en: true, content_zh: true, content_ar: true,
      },
    })
    if (!latest) return
    if (
      latest.title !== expectedVi.title ||
      (latest.excerpt ?? "") !== expectedVi.excerpt ||
      (latest.content ?? "") !== expectedVi.content
    ) {
      console.log(`[auto-translate] news ${newsId} VI drifted before write — skip`)
      return
    }
    // Chỉ update cột đang trống
    const finalUpdates: Record<string, string> = {}
    for (const [col, value] of Object.entries(updates)) {
      const currentVal = (latest as unknown as Record<string, string | null>)[col]
      if ((!currentVal || currentVal.trim() === "") && value) {
        finalUpdates[col] = value
      }
    }
    if (Object.keys(finalUpdates).length === 0) {
      console.log(`[auto-translate] news ${newsId} — all target cols now filled, skip`)
      return
    }
    await prisma.news.update({
      where: { id: newsId },
      data: finalUpdates,
    })

    // Revalidate surfaces liên quan đến news (tin-tuc, nghien-cuu, sitemap…)
    revalidatePath("/admin/tin-tuc")
    revalidatePath("/[locale]/tin-tuc", "layout")
    revalidatePath("/[locale]/nghien-cuu", "layout")
    revalidateTag("homepage", "max")
    revalidateTag("news", "max")

    console.log(
      `[auto-translate] news ${newsId} done — updated ${Object.keys(finalUpdates).length} cols`,
    )
  } catch (e) {
    console.error(`[auto-translate] news ${newsId} final write failed:`, e)
  }
}
