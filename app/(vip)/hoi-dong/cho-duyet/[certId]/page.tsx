import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { VoteForm } from "./VoteForm"

export const revalidate = 0

type Props = { params: Promise<{ certId: string }> }

const VOTE_STYLES = {
  PENDING: { label: "Chờ vote", cls: "bg-gray-100 text-gray-600" },
  APPROVE: { label: "APPROVE", cls: "bg-green-100 text-green-700" },
  REJECT: { label: "REJECT", cls: "bg-red-100 text-red-700" },
} as const

export default async function CouncilVotePage({ params }: Props) {
  const { certId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isCouncilMember: true },
  })
  if (!user?.isCouncilMember) notFound()

  const cert = await prisma.certification.findUnique({
    where: { id: certId },
    include: {
      product: {
        select: { name: true, description: true, category: true, company: { select: { name: true } } },
      },
      applicant: { select: { name: true, email: true } },
      reviews: {
        orderBy: { createdAt: "asc" },
        include: {
          reviewer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  if (!cert) notFound()

  const myReview = cert.reviews.find((r) => r.reviewer.id === session.user.id)
  if (!myReview) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-3">
        <h1 className="text-xl font-bold text-brand-900">Bạn không thuộc hội đồng của đơn này</h1>
        <Link href="/hoi-dong/cho-duyet" className="text-sm text-brand-600 underline">
          Về danh sách
        </Link>
      </div>
    )
  }

  const canVote = myReview.vote === "PENDING" && cert.status === "UNDER_REVIEW"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/hoi-dong/cho-duyet" className="text-sm text-brand-600 hover:text-brand-800">
          ← Danh sách
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-brand-900">Thẩm định: {cert.product.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: product + applicant */}
        <div className="lg:col-span-3 space-y-4">
          <section className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-brand-900">Thông tin sản phẩm</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Tên</p>
                <p className="font-medium">{cert.product.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Danh mục</p>
                <p className="font-medium">{cert.product.category ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Doanh nghiệp</p>
                <p className="font-medium">{cert.product.company?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hình thức</p>
                <p className="font-medium">{cert.reviewMode === "ONLINE" ? "Online" : "Offline"}</p>
              </div>
              {cert.reviewMode === "ONLINE" && cert.productSalePrice != null && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Giá bán khai báo</p>
                  <p className="font-medium">{cert.productSalePrice.toLocaleString("vi-VN")}đ</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Mô tả</p>
                <p className="whitespace-pre-wrap">{cert.product.description ?? "—"}</p>
              </div>
            </div>
          </section>

          {cert.documentUrls.length > 0 && (
            <section className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-brand-900">Tài liệu đính kèm</h2>
              <ul className="space-y-2">
                {cert.documentUrls.map((url, i) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 underline">
                      📄 Tài liệu {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-brand-900">Người nộp đơn</h2>
            <p className="text-sm">
              <span className="font-medium">{cert.applicant.name}</span> · {cert.applicant.email}
            </p>
            {cert.applicantNote && (
              <div className="rounded-lg bg-brand-50 p-3 text-sm whitespace-pre-wrap">
                {cert.applicantNote}
              </div>
            )}
          </section>
        </div>

        {/* Right: vote form + peer reviews */}
        <div className="lg:col-span-2 space-y-4">
          {canVote ? (
            <VoteForm certId={cert.id} />
          ) : (
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-2">
              <h2 className="text-base font-bold text-brand-900">Bạn đã vote</h2>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${VOTE_STYLES[myReview.vote].cls}`}>
                {VOTE_STYLES[myReview.vote].label}
              </span>
              {myReview.comment && (
                <p className="text-sm text-brand-800 whitespace-pre-wrap rounded bg-brand-50 p-3">
                  {myReview.comment}
                </p>
              )}
              {cert.status !== "UNDER_REVIEW" && (
                <p className="text-xs text-muted-foreground">
                  Trạng thái đơn hiện tại: <span className="font-semibold">{cert.status}</span>
                </p>
              )}
            </div>
          )}

          {/* Peer reviews */}
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-brand-900">Nhận xét của hội đồng</h2>
            <ul className="space-y-3">
              {cert.reviews.map((r) => {
                const style = VOTE_STYLES[r.vote]
                const isMe = r.reviewer.id === session.user.id
                return (
                  <li key={r.id} className="rounded-lg border bg-brand-50/40 p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-brand-900 truncate">
                        {r.reviewer.name}{isMe && <span className="ml-1 text-xs text-brand-500">(bạn)</span>}
                      </p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${style.cls}`}>
                        {style.label}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-brand-800 whitespace-pre-wrap rounded bg-white px-2 py-1.5 border">
                        {r.comment}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
