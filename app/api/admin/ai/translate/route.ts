import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canWriteNews } from "@/lib/roles"
import { generateJSON, AllModelsFailedError } from "@/lib/gemini-models"

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

const MAX_FIELDS = 20
const MAX_TOTAL_CHARS = 120_000

export async function POST(req: Request) {
  const session = await auth()
  // Dùng `canWriteNews` thay vì `canAdminWrite` để INFINITE soạn news có thể
  // gọi AI dịch. Các admin surface khác (LeaderManager, SettingsForm,
  // SurveyEditor) vẫn gate UI bằng `readOnly` cho INFINITE nên họ không
  // chạm được tới endpoint này từ đó.
  if (!session?.user || !canWriteNews(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Tính năng AI dịch chưa được cấu hình. Vui lòng liên hệ admin để thêm GEMINI_API_KEY." },
      { status: 503 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const { fields: rawFields, targetLocale, title, excerpt, content } = body as {
    fields?: Record<string, string>
    targetLocale?: string
    // Legacy shape (backward compat for older clients)
    title?: string
    excerpt?: string
    content?: string
  }

  if (!targetLocale || !LOCALE_NAMES[targetLocale]) {
    return NextResponse.json({ error: "targetLocale phải là 'en', 'zh' hoặc 'ar'" }, { status: 400 })
  }

  // Accept both new generic shape (`fields`) and legacy shape (`title/excerpt/content`).
  const fields: Record<string, string> = rawFields ?? {
    ...(title !== undefined && { title }),
    ...(excerpt !== undefined && { excerpt }),
    ...(content !== undefined && { content }),
  }

  const entries = Object.entries(fields).filter(([, v]) => typeof v === "string" && v.trim() !== "")
  if (entries.length === 0) {
    return NextResponse.json({ error: "Không có nội dung để dịch" }, { status: 400 })
  }
  if (entries.length > MAX_FIELDS) {
    return NextResponse.json({ error: `Tối đa ${MAX_FIELDS} field / request` }, { status: 400 })
  }
  const totalChars = entries.reduce((n, [, v]) => n + v.length, 0)
  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json(
      { error: `Nội dung quá dài (${totalChars} ký tự, tối đa ${MAX_TOTAL_CHARS})` },
      { status: 400 },
    )
  }

  const nonEmptyFields = Object.fromEntries(entries)
  const prompt = TRANSLATION_PROMPT
    .replace("{TARGET_LANGUAGE}", LOCALE_NAMES[targetLocale])
    .replace("{INPUT_JSON}", JSON.stringify(nonEmptyFields, null, 2))

  try {
    const { text, modelUsed, attempts } = await generateJSON(apiKey, prompt)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json(
          { error: "AI trả về định dạng không hợp lệ. Vui lòng thử lại." },
          { status: 502 },
        )
      }
      parsed = JSON.parse(match[0])
    }

    // Build response: translated values for fields we sent; empty string for fields
    // that were blank in the input so the caller can safely spread the result.
    const translatedFields: Record<string, string> = {}
    for (const key of Object.keys(fields)) {
      const v = parsed[key]
      translatedFields[key] = typeof v === "string" ? v : ""
    }

    // Back-compat: also expose title/excerpt/content at top level if they were in input
    const legacyShape: Record<string, string> = {}
    if ("title" in fields) legacyShape.title = translatedFields.title ?? ""
    if ("excerpt" in fields) legacyShape.excerpt = translatedFields.excerpt ?? ""
    if ("content" in fields) legacyShape.content = translatedFields.content ?? ""

    return NextResponse.json({
      fields: translatedFields,
      ...legacyShape,
      _modelUsed: modelUsed,
      _attempts: attempts.length,
    })
  } catch (err) {
    if (err instanceof AllModelsFailedError) {
      console.error("[AI translate] All models failed:", err.attempts)
      return NextResponse.json(
        {
          error: err.allQuotaExceeded
            ? "Tất cả model Gemini free tier đã hết quota hôm nay. Vui lòng thử lại vào ngày mai hoặc dịch thủ công."
            : "Không có model Gemini nào khả dụng. Vui lòng liên hệ admin để kiểm tra API key.",
          quotaExceeded: err.allQuotaExceeded,
          attempts: err.attempts.map((a) => ({ model: a.model, status: a.status })),
        },
        { status: 429 },
      )
    }
    console.error("[AI translate]", err)
    return NextResponse.json(
      { error: "Lỗi khi gọi AI. Vui lòng thử lại sau vài phút." },
      { status: 500 },
    )
  }
}
