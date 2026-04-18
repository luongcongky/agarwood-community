import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { canAdminWrite } from "@/lib/roles"
import { GoogleGenerativeAI } from "@google/generative-ai"

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  zh: "Simplified Chinese (中文)",
}

const TRANSLATION_PROMPT = `You are a professional translator for an agarwood industry association website (Hội Trầm Hương Việt Nam / Vietnam Agarwood Association).

Translate the Vietnamese content below to {TARGET_LANGUAGE}.

CRITICAL RULES:
1. Preserve ALL HTML tags exactly (<p>, <strong>, <em>, <h1>-<h6>, <ul>, <ol>, <li>, <a>, <img>, <br>, <blockquote>, etc.)
2. Preserve ALL image URLs — do NOT modify <img src="..."> attributes
3. Preserve ALL link URLs in <a href="..."> attributes
4. Preserve ALL CSS classes, styles, and HTML attributes
5. Only translate the VISIBLE TEXT between tags
6. Keep proper nouns, brand names, Vietnamese province names (Khánh Hòa, Quảng Nam) in original form unless they have well-known translations
7. Keep technical terms consistent: "trầm hương" → "agarwood", "trầm tự nhiên" → "natural agarwood", "trầm nuôi cấy" → "cultivated agarwood", "kỳ nam" → "kynam", "tinh dầu" → "essential oil"
8. Return ONLY a JSON object in this exact format — no markdown, no code fences, no explanations:
{"title":"...","excerpt":"...","content":"..."}

Input fields to translate (one or more may be empty):
- title: plain text
- excerpt: plain text
- content: HTML with formatting

Vietnamese source:
TITLE: {TITLE}

EXCERPT: {EXCERPT}

CONTENT:
{CONTENT}`

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canAdminWrite(session.user.role)) {
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
  const { title, excerpt, content, targetLocale } = body as {
    title?: string
    excerpt?: string
    content?: string
    targetLocale?: string
  }

  if (!targetLocale || !LOCALE_NAMES[targetLocale]) {
    return NextResponse.json({ error: "targetLocale phải là 'en' hoặc 'zh'" }, { status: 400 })
  }

  if (!title && !excerpt && !content) {
    return NextResponse.json({ error: "Không có nội dung để dịch" }, { status: 400 })
  }

  const prompt = TRANSLATION_PROMPT
    .replace("{TARGET_LANGUAGE}", LOCALE_NAMES[targetLocale])
    .replace("{TITLE}", title || "")
    .replace("{EXCERPT}", excerpt || "")
    .replace("{CONTENT}", content || "")

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse JSON response
    let parsed: { title?: string; excerpt?: string; content?: string }
    try {
      parsed = JSON.parse(text)
    } catch {
      // Fallback: try to extract JSON if model wrapped in code fences despite prompt
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json(
          { error: "AI trả về định dạng không hợp lệ. Vui lòng thử lại." },
          { status: 502 },
        )
      }
      parsed = JSON.parse(match[0])
    }

    return NextResponse.json({
      title: parsed.title ?? "",
      excerpt: parsed.excerpt ?? "",
      content: parsed.content ?? "",
    })
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string }
    console.error("[AI translate]", error)

    // Rate limit / quota exhausted
    if (error.status === 429 || (error.message && /quota|rate limit|RESOURCE_EXHAUSTED/i.test(error.message))) {
      return NextResponse.json(
        {
          error: "Đã hết quota Gemini free tier hôm nay. Vui lòng thử lại sau 24 giờ hoặc dịch thủ công.",
          quotaExceeded: true,
        },
        { status: 429 },
      )
    }

    return NextResponse.json(
      { error: "Lỗi khi gọi AI. Vui lòng thử lại sau vài phút." },
      { status: 500 },
    )
  }
}
