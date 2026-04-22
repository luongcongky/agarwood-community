import "server-only"
import { prisma } from "@/lib/prisma"
import type { ReviewVote } from "@prisma/client"
import {
  COUNCIL_SIZE,
  CERT_VALIDITY_YEARS,
} from "@/lib/certification-council-constants"

// Re-export để các server importer cũ không phải đổi import path.
export { COUNCIL_SIZE, CERT_VALIDITY_YEARS }

function addYears(d: Date, years: number): Date {
  const next = new Date(d)
  next.setFullYear(next.getFullYear() + years)
  return next
}

export class CouncilError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export async function assignCouncil(certId: string, reviewerIds: string[]) {
  if (reviewerIds.length !== COUNCIL_SIZE) {
    throw new CouncilError(`Cần chỉ định đúng ${COUNCIL_SIZE} thẩm định viên`)
  }
  if (new Set(reviewerIds).size !== COUNCIL_SIZE) {
    throw new CouncilError("Không được trùng thẩm định viên")
  }

  return prisma.$transaction(async (tx) => {
    const cert = await tx.certification.findUnique({ where: { id: certId } })
    if (!cert) throw new CouncilError("Không tìm thấy đơn", 404)
    if (cert.status !== "PENDING") {
      throw new CouncilError("Chỉ chỉ định hội đồng khi đơn ở trạng thái PENDING")
    }
    if (reviewerIds.includes(cert.applicantId)) {
      throw new CouncilError("Người nộp đơn không thể tham gia hội đồng thẩm định chính đơn của mình")
    }

    const reviewers = await tx.user.findMany({
      where: { id: { in: reviewerIds }, isCouncilMember: true },
      select: { id: true },
    })
    if (reviewers.length !== COUNCIL_SIZE) {
      throw new CouncilError("Một số thẩm định viên không hợp lệ (phải là thành viên hội đồng)")
    }

    await tx.certificationReview.createMany({
      data: reviewerIds.map((reviewerId) => ({
        certificationId: certId,
        reviewerId,
        vote: "PENDING" as const,
      })),
    })

    await tx.certification.update({
      where: { id: certId },
      data: { status: "UNDER_REVIEW" },
    })
  })
}

type VoteResult =
  | { finalDecision: null }
  | { finalDecision: "REJECTED" }
  | { finalDecision: "APPROVED"; certCode: string }

export async function castVote(
  certId: string,
  reviewerId: string,
  vote: ReviewVote,
  comment: string,
): Promise<VoteResult> {
  if (vote !== "APPROVE" && vote !== "REJECT") {
    throw new CouncilError("Vote phải là APPROVE hoặc REJECT")
  }
  const trimmedComment = comment.trim()
  if (!trimmedComment) {
    throw new CouncilError("Bắt buộc phải để lại nhận xét khi vote")
  }

  return prisma.$transaction(async (tx) => {
    const cert = await tx.certification.findUnique({
      where: { id: certId },
      include: { reviews: true },
    })
    if (!cert) throw new CouncilError("Không tìm thấy đơn", 404)
    if (cert.status !== "UNDER_REVIEW") {
      throw new CouncilError("Đơn không còn trong quá trình thẩm định")
    }

    const myReview = cert.reviews.find((r) => r.reviewerId === reviewerId)
    if (!myReview) {
      throw new CouncilError("Bạn không phải thành viên hội đồng thẩm định đơn này", 403)
    }
    if (myReview.vote !== "PENDING") {
      throw new CouncilError("Bạn đã vote cho đơn này rồi")
    }

    const now = new Date()

    await tx.certificationReview.update({
      where: { id: myReview.id },
      data: { vote, comment: trimmedComment, votedAt: now },
    })

    // Veto: 1 REJECT auto-rejects whole application
    if (vote === "REJECT") {
      await tx.certification.update({
        where: { id: certId },
        data: {
          status: "REJECTED",
          rejectedAt: now,
          reviewedAt: now,
          reviewedBy: reviewerId,
          reviewNote: `Bị phủ quyết bởi hội đồng: ${trimmedComment}`,
        },
      })
      await tx.product.update({
        where: { id: cert.productId },
        data: { certStatus: "REJECTED" },
      })
      return { finalDecision: "REJECTED" }
    }

    // Consensus: 5/5 APPROVE auto-approves + generates certCode
    const updatedReviews = cert.reviews.map((r) =>
      r.id === myReview.id ? { ...r, vote } : r,
    )
    const allApproved =
      updatedReviews.length === COUNCIL_SIZE &&
      updatedReviews.every((r) => r.vote === "APPROVE")

    if (allApproved) {
      const year = now.getFullYear()
      const approvedCount = await tx.certification.count({
        where: { status: "APPROVED", approvedAt: { gte: new Date(`${year}-01-01`) } },
      })
      const certCode = `HTHVN-${year}-${String(approvedCount + 1).padStart(4, "0")}`

      await tx.certification.update({
        where: { id: certId },
        data: {
          status: "APPROVED",
          approvedAt: now,
          reviewedAt: now,
          reviewedBy: reviewerId,
          certCode,
        },
      })
      await tx.product.update({
        where: { id: cert.productId },
        data: {
          certStatus: "APPROVED",
          certApprovedAt: now,
          certExpiredAt: addYears(now, CERT_VALIDITY_YEARS),
          badgeUrl: "/badge-chung-nhan.png",
        },
      })
      return { finalDecision: "APPROVED", certCode }
    }

    return { finalDecision: null }
  })
}
