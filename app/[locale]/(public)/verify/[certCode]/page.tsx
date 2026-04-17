import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import type { Metadata } from "next"

type Props = { params: Promise<{ certCode: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certCode } = await params
  return {
    title: `Xác minh chứng nhận ${certCode} | Hội Trầm Hương Việt Nam`,
  }
}

export default async function VerifyPage({ params }: Props) {
  const tV = await getTranslations("verifyCert")

  const { certCode } = await params

  // Look up product by slug (certCode = product slug)
  const product = await prisma.product.findUnique({
    where: { slug: certCode },
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
        select: { approvedAt: true, isOnlineReview: true },
      },
    },
  })

  // Not found
  if (!product) {
    return (
      <div className="bg-brand-50/60 min-h-screen"><div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-2xl">✗</span>
        </div>
        <h1 className="text-xl font-bold text-brand-900">Mã chứng nhận không hợp lệ</h1>
        <p className="text-sm text-brand-500">
          Không tìm thấy sản phẩm với mã &quot;{certCode}&quot;. Vui lòng kiểm tra lại mã trên bao bì sản phẩm.
        </p>
        <Link href="/" className="inline-block text-sm text-brand-600 hover:text-brand-800 underline">
          Về trang chủ
        </Link>
      </div></div>
    )
  }

  // Not approved
  if (product.certStatus !== "APPROVED") {
    return (
      <div className="bg-brand-50/60 min-h-screen"><div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
          <span className="text-2xl">⚠</span>
        </div>
        <h1 className="text-xl font-bold text-brand-900">Chứng nhận chưa có hiệu lực</h1>
        <p className="text-sm text-brand-500">
          Sản phẩm &quot;{product.name}&quot; chưa được Hội Trầm Hương Việt Nam chứng nhận hoặc đang trong quá trình xét duyệt.
        </p>
      </div></div>
    )
  }

  // Check expiry
  const isExpired = product.certExpiredAt && new Date(product.certExpiredAt) < new Date()

  if (isExpired) {
    return (
      <div className="bg-brand-50/60 min-h-screen"><div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-2xl">⏰</span>
        </div>
        <h1 className="text-xl font-bold text-brand-900">Chứng nhận đã hết hiệu lực</h1>
        <p className="text-sm text-brand-500">
          Chứng nhận cho sản phẩm &quot;{product.name}&quot; đã hết hạn. Doanh nghiệp cần nộp đơn gia hạn chứng nhận.
        </p>
      </div></div>
    )
  }

  // Valid!
  const cert = product.certifications[0]
  const approvedDate = cert?.approvedAt
    ? new Date(cert.approvedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : product.certApprovedAt
    ? new Date(product.certApprovedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—"

  return (
    <div className="bg-brand-50/60 min-h-screen"><div className="max-w-lg mx-auto px-4 py-16 space-y-6">
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-8 text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <span className="text-4xl">✓</span>
        </div>

        <h1 className="text-xl font-bold text-amber-900 uppercase tracking-wide">
          Sản phẩm đã được chứng nhận
        </h1>
        <p className="text-amber-800 text-sm">Hội Trầm Hương Việt Nam</p>

        <div className="text-left space-y-2 text-sm bg-white/60 rounded-xl p-5">
          <div className="flex justify-between py-1.5 border-b border-amber-200">
            <span className="text-amber-700">{tV("product")}</span>
            <span className="font-semibold text-amber-900">{product.name}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-amber-200">
            <span className="text-amber-700">{tV("company")}</span>
            <Link href={`/doanh-nghiep/${product.company!.slug}`} className="font-semibold text-amber-900 hover:underline">
              {product.company!.name}
            </Link>
          </div>
          <div className="flex justify-between py-1.5 border-b border-amber-200">
            <span className="text-amber-700">{tV("dateIssued")}</span>
            <span className="font-semibold text-amber-900">{approvedDate}</span>
          </div>
          {cert?.isOnlineReview !== undefined && (
            <div className="flex justify-between py-1.5">
              <span className="text-amber-700">{tV("method")}</span>
              <span className="font-semibold text-amber-900">
                {cert.isOnlineReview ? "Kiểm tra trực tuyến" : "Kiểm tra trực tiếp"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <Link href={`/san-pham/${product.slug}`} className="text-sm text-brand-600 hover:text-brand-800 underline">
          Xem chi tiết sản phẩm
        </Link>
      </div>
    </div></div>
  )
}
