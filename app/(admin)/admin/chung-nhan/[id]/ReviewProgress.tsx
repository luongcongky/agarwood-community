import type { ReviewVote, CertStatus } from "@prisma/client"
import { ReplaceReviewerButton } from "./ReplaceReviewerButton"

interface ReviewItem {
  id: string
  vote: ReviewVote
  comment: string | null
  votedAt: Date | null
  reviewer: { id: string; name: string; email: string }
}

interface Candidate {
  id: string
  name: string
  email: string
}

interface Props {
  certId: string
  status: CertStatus
  reviews: ReviewItem[]
  certCode: string | null
  approvedAt: Date | null
  rejectedAt: Date | null
  /** Council members khả dụng để thay thế (đã loại 5 reviewer hiện tại + applicant). */
  candidates: Candidate[]
}

const VOTE_STYLES: Record<ReviewVote, { label: string; cls: string }> = {
  PENDING: { label: "Chờ vote", cls: "bg-gray-100 text-gray-600" },
  APPROVE: { label: "APPROVE", cls: "bg-green-100 text-green-700" },
  REJECT: { label: "REJECT", cls: "bg-red-100 text-red-700" },
}

export function ReviewProgress({ certId, status, reviews, certCode, approvedAt, rejectedAt, candidates }: Props) {
  const approved = reviews.filter((r) => r.vote === "APPROVE").length
  const rejected = reviews.filter((r) => r.vote === "REJECT").length
  const pending = reviews.filter((r) => r.vote === "PENDING").length

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4 sticky top-6">
      <div>
        <h2 className="text-base font-bold text-brand-900">Tiến độ thẩm định</h2>
        {status === "UNDER_REVIEW" && (
          <p className="text-xs text-muted-foreground mt-1">
            {approved}/{reviews.length} APPROVE · {rejected} REJECT · {pending} chờ vote
          </p>
        )}
      </div>

      {status === "APPROVED" && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 space-y-1">
          <p className="font-semibold">✓ Đã được cấp chứng nhận</p>
          {certCode && (
            <p className="text-xs font-mono">{certCode}</p>
          )}
          {approvedAt && (
            <p className="text-xs">{new Date(approvedAt).toLocaleString("vi-VN")}</p>
          )}
        </div>
      )}

      {status === "REJECTED" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 space-y-1">
          <p className="font-semibold">✗ Đã bị từ chối</p>
          {rejectedAt && (
            <p className="text-xs">{new Date(rejectedAt).toLocaleString("vi-VN")}</p>
          )}
        </div>
      )}

      <ul className="space-y-3">
        {reviews.map((r) => {
          const style = VOTE_STYLES[r.vote]
          // Chỉ cho phép đổi khi đơn còn UNDER_REVIEW và reviewer chưa vote.
          // Đã APPROVE/REJECT → vote đã ghi nhận, không đổi được.
          const canReplace = status === "UNDER_REVIEW" && r.vote === "PENDING"
          return (
            <li key={r.id} className="rounded-lg border bg-brand-50/40 p-3 text-sm space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-brand-900 truncate">{r.reviewer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.reviewer.email}</p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${style.cls}`}>
                  {style.label}
                </span>
              </div>
              {r.comment && (
                <p className="text-xs text-brand-800 whitespace-pre-wrap rounded bg-white px-2 py-1.5 border">
                  {r.comment}
                </p>
              )}
              {r.votedAt && (
                <p className="text-xs text-muted-foreground">
                  Vote lúc: {new Date(r.votedAt).toLocaleString("vi-VN")}
                </p>
              )}
              {canReplace && (
                <ReplaceReviewerButton
                  certId={certId}
                  oldReviewerId={r.reviewer.id}
                  oldReviewerName={r.reviewer.name}
                  candidates={candidates}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
