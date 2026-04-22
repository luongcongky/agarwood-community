import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { PrintButton } from "./PrintButton"

export const revalidate = 300

type Props = { params: Promise<{ certCode: string }> }

const CERT_CODE_PATTERN = /^HTHVN-\d{4}-\d{4,}$/

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certCode } = await params
  return {
    title: `Xác minh chứng nhận ${certCode} | Hội Trầm Hương Việt Nam`,
  }
}

async function resolveCertification(code: string) {
  // Ưu tiên lookup bằng certCode chính thức (HTHVN-YYYY-NNNN).
  if (CERT_CODE_PATTERN.test(code)) {
    const cert = await prisma.certification.findUnique({
      where: { certCode: code },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            category: true,
            certStatus: true,
            certApprovedAt: true,
            certExpiredAt: true,
            company: { select: { name: true, slug: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: "asc" },
          include: {
            reviewer: { select: { name: true } },
          },
        },
      },
    })
    return cert
  }

  // Fallback: legacy QR code dùng product slug (cert chưa có certCode do seed trước Sprint 3).
  const product = await prisma.product.findUnique({
    where: { slug: code },
    select: {
      name: true,
      slug: true,
      certStatus: true,
      certApprovedAt: true,
      certExpiredAt: true,
      company: { select: { name: true, slug: true } },
      certifications: {
        where: { status: "APPROVED" },
        orderBy: { approvedAt: "desc" },
        take: 1,
        include: {
          reviews: {
            orderBy: { createdAt: "asc" },
            include: { reviewer: { select: { name: true } } },
          },
        },
      },
    },
  })
  if (!product) return null
  const latestCert = product.certifications[0]
  if (!latestCert) {
    // Sản phẩm có certStatus=APPROVED nhưng không qua workflow (seed / legacy) → vẫn trả metadata tối thiểu.
    return {
      id: "legacy",
      certCode: null,
      approvedAt: product.certApprovedAt,
      rejectedAt: null,
      reviewMode: null,
      status: product.certStatus,
      productSalePrice: null,
      product: {
        name: product.name,
        slug: product.slug,
        category: null as string | null,
        certStatus: product.certStatus,
        certApprovedAt: product.certApprovedAt,
        certExpiredAt: product.certExpiredAt,
        company: product.company,
      },
      reviews: [] as Array<{ id: string; comment: string | null; reviewer: { name: string } }>,
    }
  }
  return {
    id: latestCert.id,
    certCode: latestCert.certCode,
    approvedAt: latestCert.approvedAt,
    rejectedAt: latestCert.rejectedAt,
    reviewMode: latestCert.reviewMode,
    status: product.certStatus,
    productSalePrice: latestCert.productSalePrice,
    product: {
      name: product.name,
      slug: product.slug,
      category: null,
      certStatus: product.certStatus,
      certApprovedAt: product.certApprovedAt,
      certExpiredAt: product.certExpiredAt,
      company: product.company,
    },
    reviews: latestCert.reviews.map((r) => ({ id: r.id, comment: r.comment, reviewer: r.reviewer })),
  }
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default async function VerifyPage({ params }: Props) {
  const { certCode } = await params
  const cert = await resolveCertification(certCode)

  if (!cert) {
    return <NotFound code={certCode} />
  }

  if (cert.product.certStatus !== "APPROVED") {
    return <NotApproved name={cert.product.name} />
  }

  const isExpired =
    cert.product.certExpiredAt && new Date(cert.product.certExpiredAt) < new Date()
  if (isExpired) {
    return <Expired name={cert.product.name} />
  }

  const siteUrl = process.env.NEXTAUTH_URL ?? ""
  const verifyUrl = `${siteUrl}/verify/${cert.certCode ?? cert.product.slug}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
    color: { dark: "#1a5632", light: "#ffffff" },
  })

  const approvedCert = cert.reviews.filter((r) => r.comment).length > 0
  const displayDate = formatDate(cert.approvedAt ?? cert.product.certApprovedAt)
  const displayCode = cert.certCode ?? "—"

  return (
    <div className="bg-amber-50/30 min-h-screen py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-[820px] px-4 print:px-0 print:max-w-none">
        {/* Toolbar (hidden on print) */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Link href="/" className="text-sm text-brand-600 hover:text-brand-800 underline">
            ← Về trang chủ
          </Link>
          <PrintButton />
        </div>

        {/* Certificate */}
        <article className="relative bg-white border-[6px] border-amber-700 shadow-xl print:shadow-none print:border-4 aspect-[1/1.414] overflow-hidden">
          {/* Inner decorative border */}
          <div className="absolute inset-4 border-2 border-amber-600/60 pointer-events-none" />

          <div className="relative h-full flex flex-col px-10 py-8 print:px-12 print:py-10">
            {/* Header */}
            <header className="flex items-center justify-center gap-4 pb-4 border-b-2 border-amber-700/30">
              <Image
                src="/logo.png"
                alt="Hội Trầm Hương Việt Nam"
                width={68}
                height={68}
                className="h-[68px] w-auto"
              />
              <div className="text-center">
                <p className="text-xs tracking-[0.3em] text-amber-900 font-semibold uppercase">
                  Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam
                </p>
                <p className="text-[11px] text-amber-800 italic">Độc lập — Tự do — Hạnh phúc</p>
                <p className="text-sm font-bold text-amber-900 mt-1">HỘI TRẦM HƯƠNG VIỆT NAM</p>
              </div>
            </header>

            {/* Title */}
            <div className="text-center mt-6 space-y-1">
              <p className="text-xs tracking-[0.4em] text-amber-800 uppercase">Giấy</p>
              <h1 className="text-4xl font-serif font-bold text-amber-900 tracking-wider uppercase">
                Chứng Nhận Sản Phẩm
              </h1>
              <p className="text-xs tracking-[0.3em] text-amber-700/80 uppercase">
                Product Certification
              </p>
            </div>

            {/* Body: product + company */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-amber-900">Chứng nhận sản phẩm</p>
              <p className="text-2xl font-serif font-bold text-amber-950">
                {cert.product.name}
              </p>
              {cert.product.company && (
                <p className="text-sm text-amber-800">
                  của doanh nghiệp{" "}
                  <span className="font-semibold">{cert.product.company.name}</span>
                </p>
              )}
              <p className="text-sm text-amber-900 max-w-[560px] mx-auto leading-relaxed pt-1">
                đã được <strong>Hội đồng thẩm định</strong> gồm{" "}
                <strong>{cert.reviews.length || 5}</strong> thành viên của{" "}
                <strong>Hội Trầm Hương Việt Nam</strong> xem xét, đánh giá và nhất
                trí cấp chứng nhận theo đúng quy trình thẩm định.
              </p>
            </div>

            {/* Reviews grid */}
            {approvedCert && (
              <section className="mt-4 flex-1">
                <p className="text-xs tracking-[0.2em] text-amber-800 uppercase text-center mb-2">
                  Nhận xét của hội đồng
                </p>
                <ul className="grid grid-cols-1 gap-1.5 text-[11px] leading-relaxed max-h-[200px] overflow-hidden">
                  {cert.reviews.map((r) => (
                    <li key={r.id} className="border-l-2 border-amber-600 pl-2">
                      <p className="font-semibold text-amber-900">{r.reviewer.name}</p>
                      {r.comment && (
                        <p className="text-amber-800 italic line-clamp-2">&ldquo;{r.comment}&rdquo;</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {!approvedCert && <div className="flex-1" />}

            {/* Footer: code + QR + stamp + signature */}
            <footer className="mt-4 pt-3 border-t-2 border-amber-700/30 grid grid-cols-3 items-end gap-4">
              {/* QR + code */}
              <div className="flex flex-col items-start gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR xác minh" className="w-[90px] h-[90px]" />
                <div>
                  <p className="text-[10px] text-amber-700 uppercase tracking-wide">Mã chứng nhận</p>
                  <p className="text-xs font-mono font-bold text-amber-900">{displayCode}</p>
                </div>
              </div>

              {/* Date */}
              <div className="text-center text-xs text-amber-900">
                <p>Ngày cấp: <strong>{displayDate}</strong></p>
                <p className="mt-1 italic text-amber-700">
                  Truy cập {siteUrl.replace(/^https?:\/\//, "")}/verify/{displayCode} để xác minh
                </p>
              </div>

              {/* Signature + stamp */}
              <div className="relative flex flex-col items-end">
                <div className="text-center">
                  <p className="text-[10px] text-amber-800 italic">T/M Ban Chấp hành</p>
                  <p className="text-xs font-semibold text-amber-900">Chủ tịch Hội</p>
                </div>
                <div className="relative h-[100px] w-[180px] mt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/cert/signature-placeholder.svg"
                    alt="Chữ ký"
                    className="absolute inset-0 w-full h-auto"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/cert/stamp-placeholder.svg"
                    alt="Mộc đỏ"
                    className="absolute -top-2 right-0 w-[110px] h-[110px] opacity-85 mix-blend-multiply"
                  />
                </div>
              </div>
            </footer>
          </div>
        </article>

        {/* Meta info (hidden on print) */}
        <div className="mt-5 text-center text-xs text-brand-600 print:hidden">
          <p>
            Chứng nhận này được xác minh bởi Hội Trầm Hương Việt Nam. Nếu bạn nhận
            được sản phẩm với QR / mã chứng nhận này và nghi ngờ giả mạo, vui lòng
            liên hệ Hội.
          </p>
          {cert.product.slug && (
            <Link
              href={`/san-pham/${cert.product.slug}`}
              className="inline-block mt-2 text-brand-700 hover:text-brand-900 underline"
            >
              Xem trang sản phẩm →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Error states ────────────────────────────────────────────────────

function NotFound({ code }: { code: string }) {
  return (
    <div className="bg-brand-50/60 min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-2xl">✗</span>
        </div>
        <h1 className="text-xl font-bold text-brand-900">Mã chứng nhận không hợp lệ</h1>
        <p className="text-sm text-brand-500">
          Không tìm thấy chứng nhận với mã &quot;{code}&quot;. Vui lòng kiểm tra lại mã trên
          bao bì sản phẩm.
        </p>
        <Link href="/" className="inline-block text-sm text-brand-600 hover:text-brand-800 underline">
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}

function NotApproved({ name }: { name: string }) {
  return (
    <div className="bg-brand-50/60 min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
          <span className="text-2xl">⚠</span>
        </div>
        <h1 className="text-xl font-bold text-brand-900">Chứng nhận chưa có hiệu lực</h1>
        <p className="text-sm text-brand-500">
          Sản phẩm &quot;{name}&quot; chưa được Hội Trầm Hương Việt Nam chứng nhận hoặc đang
          trong quá trình xét duyệt.
        </p>
      </div>
    </div>
  )
}

function Expired({ name }: { name: string }) {
  return (
    <div className="bg-brand-50/60 min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-2xl">⏰</span>
        </div>
        <h1 className="text-xl font-bold text-brand-900">Chứng nhận đã hết hiệu lực</h1>
        <p className="text-sm text-brand-500">
          Chứng nhận cho sản phẩm &quot;{name}&quot; đã hết hạn. Doanh nghiệp cần nộp đơn
          gia hạn.
        </p>
      </div>
    </div>
  )
}
