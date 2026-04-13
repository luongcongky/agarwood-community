import type { SurveyAnswers, SurveyQuestion } from "./types"

/** Validate answers theo định nghĩa câu hỏi. Trả về list lỗi (rỗng = OK). */
export function validateAnswers(
  questions: SurveyQuestion[],
  answers: SurveyAnswers
): string[] {
  const errors: string[] = []

  for (const q of questions) {
    const v = answers[q.id]
    const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)

    if (q.required && empty) {
      errors.push(`Câu "${q.label}" là bắt buộc`)
      continue
    }
    if (empty) continue

    switch (q.type) {
      case "number":
      case "scale":
        if (typeof v !== "number" || Number.isNaN(v)) {
          errors.push(`Câu "${q.label}" phải là số`)
        }
        break
      case "select":
        if (typeof v !== "string" || (q.options && !q.options.includes(v))) {
          errors.push(`Câu "${q.label}" giá trị không hợp lệ`)
        }
        break
      case "multiselect":
        if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) {
          errors.push(`Câu "${q.label}" phải là mảng chuỗi`)
        } else if (q.options) {
          const invalid = v.filter((x) => !q.options!.includes(x))
          if (invalid.length) errors.push(`Câu "${q.label}" có giá trị lạ: ${invalid.join(", ")}`)
        }
        break
      case "text":
      case "textarea":
        if (typeof v !== "string") errors.push(`Câu "${q.label}" phải là chuỗi`)
        break
    }
  }

  return errors
}

/** Validate cấu trúc questions JSON khi admin save survey. */
export function validateQuestionsSchema(questions: unknown): string[] {
  const errors: string[] = []
  if (!Array.isArray(questions)) return ["Danh sách câu hỏi phải là mảng"]

  const ids = new Set<string>()
  questions.forEach((q, i) => {
    if (!q || typeof q !== "object") {
      errors.push(`Câu ${i + 1}: không phải object`)
      return
    }
    const obj = q as Partial<SurveyQuestion>
    if (!obj.id || typeof obj.id !== "string") errors.push(`Câu ${i + 1}: thiếu id`)
    else if (ids.has(obj.id)) errors.push(`Câu ${i + 1}: id "${obj.id}" trùng`)
    else ids.add(obj.id)

    if (!obj.label) errors.push(`Câu ${i + 1}: thiếu label`)
    if (!obj.type) errors.push(`Câu ${i + 1}: thiếu type`)
    if ((obj.type === "select" || obj.type === "multiselect") && (!obj.options || !Array.isArray(obj.options) || obj.options.length === 0)) {
      errors.push(`Câu ${i + 1} (${obj.type}): cần options`)
    }
  })

  return errors
}
