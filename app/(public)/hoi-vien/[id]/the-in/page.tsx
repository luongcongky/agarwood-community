import { notFound } from "next/navigation"
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import { calcTier, getTierThresholds } from "@/lib/tier"
import { generateMemberCardId, tierFromRole } from "@/lib/memberCard"
import { MemberCardFront } from "@/components/features/member-card/MemberCardFront"
import { MemberCardBack } from "@/components/features/member-card/MemberCardBack"
import { PrintButton } from "./PrintButton"

export const metadata = {
  title: "In thẻ Hội viên",
  robots: { index: false, follow: false },
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoitramhuong.vn"

export default async function PrintMemberCardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [member, businessThresholds, individualThresholds, configs] =
    await Promise.all([
      prisma.user.findFirst({
        where: { id, role: { in: ["VIP", "INFINITE"] }, isActive: true },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
          accountType: true,
          contributionTotal: true,
          memberCategory: true,
          membershipExpires: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              logoUrl: true,
              representativePosition: true,
            },
          },
        },
      }),
      getTierThresholds("BUSINESS"),
      getTierThresholds("INDIVIDUAL"),
      prisma.siteConfig.findMany({
        where: {
          key: {
            in: ["association_email", "association_phone", "association_website"],
          },
        },
      }),
    ])

  if (!member) notFound()

  const cfg = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  const thresholds =
    member.accountType === "INDIVIDUAL" ? individualThresholds : businessThresholds
  const tierInfo = calcTier(
    member.contributionTotal,
    thresholds.silver,
    thresholds.gold,
  )
  const memberCardId = generateMemberCardId(member.id, member.createdAt)
  const verifyUrl = `${SITE_URL}/hoi-vien/${member.id}`
  const tier = tierFromRole(member.role, tierInfo.stars)

  let qrDataUrl: string | null = null
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 512,
      color: { dark: "#000", light: "#fff" },
    })
  } catch {
    /* ignore */
  }

  const frontData = {
    name: member.name,
    avatarUrl: member.avatarUrl ?? member.company?.logoUrl ?? null,
    title: member.company?.representativePosition ?? null,
    companyName: member.company?.name ?? null,
    memberCategory: member.memberCategory,
    memberCardId,
    validFrom: member.createdAt,
    validTo: member.membershipExpires,
    tier,
  } as const

  return (
    <div className="bg-brand-50 min-h-screen py-10">
      {/* Controls — ẩn khi in */}
      <div className="max-w-4xl mx-auto px-4 mb-8 print:hidden">
        <h1 className="text-2xl font-bold text-brand-900 mb-2">
          In thẻ Hội viên — {member.name}
        </h1>
        <p className="text-sm text-brand-600 mb-4">
          Thẻ được render đúng kích thước CR80 (85.6 × 54mm). Bấm "In" → chọn máy in,
          giấy khổ A4 ngang hoặc giấy thẻ chuyên dụng. Hai mặt sẽ in trên 2 trang liên tiếp
          — chọn "In 2 mặt" ở hộp thoại để ghép đúng.
        </p>
        <div className="flex gap-3">
          <PrintButton />
          <a
            href="/hoi-vien"
            className="rounded-lg border border-brand-200 px-5 py-2.5 text-sm font-medium text-brand-700 hover:bg-white transition-colors"
          >
            ← Quay lại
          </a>
        </div>

        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">📐 Hướng dẫn in chuẩn CR80</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li>Giấy ID card 85.6×54mm (khuyến nghị PVC 0.76mm cho bền)</li>
            <li>Máy in chuyên dụng: Zebra ZC, Fargo DTC, Evolis Zenius — hoặc in A4 rồi cắt</li>
            <li>
              In tại nhà máy thẻ: gửi file PDF này (<strong>Ctrl+P → Save as PDF</strong>)
            </li>
          </ul>
        </div>
      </div>

      {/* Print area — 2 thẻ cách nhau, khi in mỗi thẻ 1 trang */}
      <div className="max-w-xl mx-auto px-4 space-y-8 print:space-y-0 print:max-w-none print:mx-0 print:px-0">
        {/* Mặt trước */}
        <div className="print-card-page">
          <div className="mx-auto" style={{ width: "85.6mm" }}>
            <MemberCardFront data={frontData} />
          </div>
          <p className="mt-2 text-center text-xs text-brand-500 print:hidden">
            Mặt trước
          </p>
        </div>

        {/* Mặt sau */}
        <div className="print-card-page page-break-before">
          <div className="mx-auto" style={{ width: "85.6mm" }}>
            <MemberCardBack
              tier={tier}
              memberCardId={memberCardId}
              qrDataUrl={qrDataUrl}
              verifyUrl={verifyUrl}
              associationEmail={cfg.association_email ?? ""}
              associationPhone={cfg.association_phone ?? ""}
              associationWebsite={cfg.association_website ?? SITE_URL}
            />
          </div>
          <p className="mt-2 text-center text-xs text-brand-500 print:hidden">
            Mặt sau
          </p>
        </div>
      </div>

      {/* Print-specific CSS — set trang đúng kích thước CR80, không margin */}
      <style>{`
        @media print {
          @page {
            size: 85.6mm 54mm;
            margin: 0;
          }
          html, body {
            background: #fff !important;
            margin: 0;
            padding: 0;
          }
          .print-card-page {
            page-break-inside: avoid;
            margin: 0 !important;
          }
          .page-break-before {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  )
}
