import { GoogleGenerativeAI } from "@google/generative-ai"

// ── Config ──────────────────────────────────────────────────────────────────

// Curated candidates, ordered by preference.
// `*-latest` aliases auto-bump to newer stable versions when Google releases them.
// Versioned entries are kept as fallbacks in case an alias is temporarily unresolved.
const CANDIDATE_ORDER = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-pro-latest",
  "gemini-2.5-pro",
]

const MODEL_LIST_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const QUOTA_BAN_MS = 24 * 60 * 60 * 1000
const BAD_REQUEST_BAN_MS = 60 * 60 * 1000

// Patterns that indicate paid / restricted models — excluded from discovery.
const EXCLUDE_PATTERNS = [
  /preview/i,
  /-exp(-|$)/i,
  /tts/i,
  /image/i,
  /veo/i,
  /lyria/i,
  /nano-banana/i,
  /customtools/i,
  /deep-research/i,
]

// Patterns that look like free-tier-eligible general-purpose models.
const INCLUDE_PATTERNS = [
  /^gemini-[\d.]+-(flash|pro)(-lite)?$/,
  /^gemini-(flash|pro|flash-lite)-latest$/,
]

// ── State (module-scoped; persists for the life of the Node process) ───────

type BanEntry = { until: number | "permanent"; reason: string; at: number }

let modelListCache: { at: number; names: string[] } | null = null
const modelBans = new Map<string, BanEntry>()
let preferredModel: string | null = null

// ── Model discovery ────────────────────────────────────────────────────────

async function fetchAvailableModels(apiKey: string): Promise<string[]> {
  const now = Date.now()
  if (modelListCache && now - modelListCache.at < MODEL_LIST_CACHE_TTL_MS) {
    return modelListCache.names
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    )
    if (!res.ok) {
      console.warn("[gemini-models] ListModels failed:", res.status)
      return modelListCache?.names ?? []
    }
    const data = (await res.json()) as {
      models?: Array<{ name: string; supportedGenerationMethods?: string[] }>
    }
    const names = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
    modelListCache = { at: now, names }
    return names
  } catch (err) {
    console.warn("[gemini-models] ListModels error:", (err as Error).message)
    return modelListCache?.names ?? []
  }
}

function looksFree(name: string): boolean {
  if (EXCLUDE_PATTERNS.some((re) => re.test(name))) return false
  return INCLUDE_PATTERNS.some((re) => re.test(name))
}

// ── Ban tracking ───────────────────────────────────────────────────────────

function isBanned(name: string): boolean {
  const ban = modelBans.get(name)
  if (!ban) return false
  if (ban.until === "permanent") return true
  if (Date.now() < ban.until) return true
  modelBans.delete(name)
  return false
}

function recordFailure(name: string, status: number | undefined, message: string): void {
  const at = Date.now()
  const short = message.slice(0, 120)
  if (status === 404) {
    modelBans.set(name, { until: "permanent", reason: `404: ${short}`, at })
  } else if (status === 429) {
    modelBans.set(name, { until: at + QUOTA_BAN_MS, reason: `429: quota exhausted`, at })
  } else if (status === 400 || status === 403) {
    modelBans.set(name, { until: at + BAD_REQUEST_BAN_MS, reason: `${status}: ${short}`, at })
  }
  // 5xx / network errors are transient — don't ban.
}

// ── Candidate list assembly ────────────────────────────────────────────────

async function buildCandidateList(apiKey: string): Promise<string[]> {
  const available = await fetchAvailableModels(apiKey)
  const availableSet = new Set(available)

  let candidates =
    availableSet.size > 0
      ? CANDIDATE_ORDER.filter((c) => availableSet.has(c))
      : CANDIDATE_ORDER.slice()

  if (availableSet.size > 0) {
    const curatedSet = new Set(CANDIDATE_ORDER)
    const extras = available.filter((n) => !curatedSet.has(n) && looksFree(n))
    candidates.push(...extras)
  }

  candidates = candidates.filter((c) => !isBanned(c))

  if (preferredModel && !isBanned(preferredModel) && candidates.includes(preferredModel)) {
    candidates = [preferredModel, ...candidates.filter((c) => c !== preferredModel)]
  }

  return candidates
}

// ── Public API ─────────────────────────────────────────────────────────────

export type GeminiAttempt = {
  model: string
  status: "success" | "failed"
  error?: string
}

export type GeminiResult = {
  text: string
  modelUsed: string
  attempts: GeminiAttempt[]
}

export class AllModelsFailedError extends Error {
  attempts: GeminiAttempt[]
  allQuotaExceeded: boolean
  constructor(attempts: GeminiAttempt[]) {
    super("All Gemini models failed or exhausted quota")
    this.name = "AllModelsFailedError"
    this.attempts = attempts
    this.allQuotaExceeded =
      attempts.length > 0 && attempts.every((a) => a.error?.startsWith("429"))
  }
}

export async function generateJSON(
  apiKey: string,
  prompt: string,
  options: { temperature?: number } = {},
): Promise<GeminiResult> {
  const candidates = await buildCandidateList(apiKey)
  if (candidates.length === 0) {
    throw new AllModelsFailedError([])
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const attempts: GeminiAttempt[] = []

  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          responseMimeType: "application/json",
        },
      })
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      preferredModel = modelName
      attempts.push({ model: modelName, status: "success" })
      return { text, modelUsed: modelName, attempts }
    } catch (err) {
      const error = err as { status?: number; message?: string }
      const status = error.status
      const msg = error.message ?? String(err)
      recordFailure(modelName, status, msg)
      attempts.push({
        model: modelName,
        status: "failed",
        error: `${status ?? "?"}: ${msg.slice(0, 120)}`,
      })
      console.warn(`[gemini] ${modelName} → ${status ?? "?"}: ${msg.slice(0, 200)}`)
    }
  }

  throw new AllModelsFailedError(attempts)
}

export function getStatus() {
  const now = Date.now()
  const bans: Record<
    string,
    { reason: string; remainingMs: number | "permanent" }
  > = {}
  for (const [name, entry] of modelBans) {
    bans[name] = {
      reason: entry.reason,
      remainingMs:
        entry.until === "permanent" ? "permanent" : Math.max(0, entry.until - now),
    }
  }
  return {
    preferredModel,
    modelListCache: modelListCache
      ? {
          ageMs: now - modelListCache.at,
          count: modelListCache.names.length,
          names: modelListCache.names,
        }
      : null,
    bans,
    curatedOrder: CANDIDATE_ORDER,
  }
}

// Test-only reset. Not called from production code paths.
export function _resetForTests(): void {
  modelListCache = null
  modelBans.clear()
  preferredModel = null
}
