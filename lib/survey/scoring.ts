import type { RecommendedTier, SurveyAnswers, SurveyConfig, SurveyQuestion } from "./types"

/** Tính tổng điểm từ answers theo scoreRule của từng câu. */
export function calcScore(questions: SurveyQuestion[], answers: SurveyAnswers): number {
  let total = 0
  for (const q of questions) {
    if (!q.scoreRule) continue
    const v = answers[q.id]
    if (v === undefined || v === null || v === "") continue

    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string" && q.scoreRule[item] != null) total += q.scoreRule[item]
      }
    } else if (typeof v === "string" && q.scoreRule[v] != null) {
      total += q.scoreRule[v]
    } else if (typeof v === "number") {
      // với scale/number — dùng giá trị làm điểm thẳng nếu không có rule cụ thể
      total += v
    }
  }
  return total
}

/** Map tổng điểm → tier gợi ý. */
export function recommendTier(score: number, config?: SurveyConfig | null): RecommendedTier {
  const silverFrom = config?.recommendation?.silverFrom ?? 5
  const goldFrom = config?.recommendation?.goldFrom ?? 12
  if (score >= goldFrom) return "GOLD"
  if (score >= silverFrom) return "SILVER"
  return "BASIC"
}
