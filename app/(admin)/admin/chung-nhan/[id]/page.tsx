import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CertActionPanel } from "./CertActionPanel"

type Props = { params: Promise<{ id: string }> }

export default async function CertReviewPage({ params }: Props) {
  const { id } = await params
  await auth() // ensure session context

  const cert = await prisma.certification.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          company: {
            select: {
              name: true,
              owner: {
                select: {
                  name: true,
                  email: true,
                  bankAccountName: true,
                  bankAccountNumber: true,
                  bankName: true,
                },
              },
            },
          },
        },
      },
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
          bankAccountName: true,
          bankAccountNumber: true,
          bankName: true,
        },
      },
    },
  })

  if (!cert) notFound()

  return (
    <div className="space-y-6">
      {/* Back + Heading */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/chung-nhan"
          className="text-brand-600 hover:text-brand-800 text-sm"
        >
          &larr; Danh sách chứng nhận
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-brand-900">
        Xét duyệt: {cert.product.name}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left Column — 60% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Product info */}
          <section className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-brand-900">
              Thông tin sản phẩm
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Tên sản phẩm</p>
                <p className="font-medium text-brand-900">{cert.product.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Danh mục</p>
                <p className="font-medium">
                  {cert.product.category ?? "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Mô tả</p>
                <p className="text-brand-800 whitespace-pre-wrap">
                  {cert.product.description ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Doanh nghiệp</p>
                <p className="font-medium">
                  {cert.product.company?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Phương thức xét duyệt
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${
                    cert.isOnlineReview
                      ? "bg-blue-100 text-blue-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {cert.isOnlineReview ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </section>

          {/* Documents */}
          {cert.documentUrls.length > 0 && (
            <section className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-brand-900">
                Tài liệu đính kèm
              </h2>
              <ul className="space-y-2">
                {cert.documentUrls.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 underline"
                    >
                      <span>📄</span>
                      <span>Tài liệu {i + 1}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Applicant info */}
          <section className="rounded-xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-brand-900">
              Thông tin người nộp đơn
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Họ tên</p>
                <p className="font-medium">{cert.applicant.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{cert.applicant.email}</p>
              </div>
            </div>
            {cert.applicantNote && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Ghi chú từ hội viên
                </p>
                <p className="rounded-lg bg-brand-50 p-3 text-sm whitespace-pre-wrap">
                  {cert.applicantNote}
                </p>
              </div>
            )}
          </section>

          {/* Refund bank info */}
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-amber-900">
              Thông tin hoàn tiền (khi từ chối)
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-amber-700">Ngân hàng</p>
                <p className="font-medium text-amber-900">
                  {cert.refundBankName ?? cert.applicant.bankName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Chủ tài khoản</p>
                <p className="font-medium text-amber-900">
                  {cert.refundAccountName ??
                    cert.applicant.bankAccountName ??
                    "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-amber-700">Số tài khoản</p>
                <p className="font-mono font-medium text-amber-900">
                  {cert.refundAccountNo ??
                    cert.applicant.bankAccountNumber ??
                    "—"}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column — 40% */}
        <div className="lg:col-span-2">
          <CertActionPanel
            certId={cert.id}
            status={cert.status}
            approvedAt={cert.approvedAt}
            rejectedAt={cert.rejectedAt}
            refundBankName={
              cert.refundBankName ?? cert.applicant.bankName ?? null
            }
            refundAccountName={
              cert.refundAccountName ??
              cert.applicant.bankAccountName ??
              null
            }
            refundAccountNo={
              cert.refundAccountNo ??
              cert.applicant.bankAccountNumber ??
              null
            }
            refundedAt={cert.refundedAt}
          />
        </div>
      </div>
    </div>
  )
}
