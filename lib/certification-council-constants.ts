/**
 * Pure constants cho Hội đồng thẩm định chứng nhận.
 *
 * File tách riêng KHÔNG import prisma → safe để import từ cả client component
 * (AssignCouncilForm) lẫn server code. `lib/certification-council.ts` chứa
 * các function DB (assignCouncil, castVote, CouncilError) import từ file này
 * nhưng được gắn `import "server-only"` để chặn accidental client import.
 */

/** Số lượng thành viên hội đồng thẩm định bắt buộc cho mỗi đơn. */
export const COUNCIL_SIZE = 5

/** Thời hạn chứng nhận mặc định (năm) sau khi được duyệt. */
export const CERT_VALIDITY_YEARS = 1
