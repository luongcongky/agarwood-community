import "server-only"
import { prisma } from "@/lib/prisma"
import { ALLOWED_FIELDS, isAllowedMapsTo } from "./allowed-fields"
import type { SurveyAnswers, SurveyQuestion } from "./types"

export { isAllowedMapsTo }
export { listAllowedFields } from "./allowed-fields"

/**
 * Đồng bộ những câu trả lời có `mapsTo` sang User/Company tương ứng.
 * Bỏ qua câu không có mapping hoặc giá trị rỗng. Không throw — chỉ log.
 */
export async function syncAnswersToProfile(
  userId: string,
  questions: SurveyQuestion[],
  answers: SurveyAnswers
): Promise<void> {
  const userPatch: Record<string, unknown> = {}
  const companyPatch: Record<string, unknown> = {}

  for (const q of questions) {
    if (!q.mapsTo || !isAllowedMapsTo(q.mapsTo)) continue
    const v = answers[q.id]
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue

    const [model, field] = q.mapsTo.split(".")
    const expectedKind = ALLOWED_FIELDS[q.mapsTo]
    let value: unknown = v

    if (expectedKind === "number") {
      const n = typeof v === "number" ? v : Number(v)
      if (Number.isNaN(n)) continue
      value = n
    } else if (expectedKind === "string") {
      if (Array.isArray(v)) value = v.join(", ")
      else value = String(v)
    } else if (expectedKind === "json") {
      value = v
    }

    if (model === "user") userPatch[field] = value
    else if (model === "company") companyPatch[field] = value
  }

  if (Object.keys(userPatch).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: userPatch })
  }
  if (Object.keys(companyPatch).length > 0) {
    const company = await prisma.company.findUnique({ where: { ownerId: userId }, select: { id: true } })
    if (company) {
      await prisma.company.update({ where: { id: company.id }, data: companyPatch })
    }
  }
}
