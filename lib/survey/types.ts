// ============================================================
// Survey types — runtime + design-time
// ============================================================

export type QuestionType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "scale"

export interface SurveyQuestion {
  id: string
  label: string
  type: QuestionType
  options?: string[]
  required?: boolean
  helpText?: string
  /** Field path để mirror câu trả lời sang User/Company. VD: "user.phone", "company.foundedYear". */
  mapsTo?: string
  /** Map giá trị → điểm (cho recommendation engine). Multiselect: cộng dồn. */
  scoreRule?: Record<string, number>
}

export type RecommendedTier = "BASIC" | "SILVER" | "GOLD"

export interface SurveyConfig {
  /** Ngưỡng điểm để recommend tier. */
  recommendation?: {
    silverFrom?: number
    goldFrom?: number
  }
  /** Có cho phép user submit lại không (overwrite response cũ). */
  allowResubmit?: boolean
}

export type AnswerValue = string | number | string[] | null
export type SurveyAnswers = Record<string, AnswerValue>
