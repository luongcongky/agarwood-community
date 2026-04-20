import Link from "next/link"
import type { Metadata } from "next"
import { DocumentCategory } from "@prisma/client"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

export async function generateMetadata() {
  const t = await getTranslations("legalDocs")
  return { title: t("metaTitle"), alternates: { canonical: "/phap-ly" } }
}

export const revalidate = 3600

type Tab = "dieu-le" | "quy-che" | "giay-phep"

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "dieu-le", label: "Điều lệ Hội", icon: "📜" },
  { key: "quy-che", label: "Quy chế nội bộ", icon: "📋" },
  { key: "giay-phep", label: "Giấy phép", icon: "🏛️" },
]

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(d: Date | null): string {
  if (!d) return "—"
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default async function PhapLyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const [locale, tl] = await Promise.all([getLocale() as Promise<Locale>, getTranslations("legalDocs")])
  const l = <T extends Record<string, unknown>>(record: T, field: string) => localize(record, field, locale) as string
  const params = await searchParams
  const rawTab = params.tab ?? "dieu-le"
  const activeTab: Tab = TABS.some((t) => t.key === rawTab) ? (rawTab as Tab) : "dieu-le"

  const categoryMap: Record<Tab, DocumentCategory> = {
    "dieu-le": DocumentCategory.DIEU_LE,
    "quy-che": DocumentCategory.QUY_CHE,
    "giay-phep": DocumentCategory.GIAY_PHEP,
  }

  // Fetch counts for all tabs + documents for active tab
  const [dieuLeCount, quyCheCount, giayPhepCount, documents] = await Promise.all([
    prisma.document.count({ where: { category: DocumentCategory.DIEU_LE, isPublic: true } }),
    prisma.document.count({ where: { category: DocumentCategory.QUY_CHE, isPublic: true } }),
    prisma.document.count({ where: { category: DocumentCategory.GIAY_PHEP, isPublic: true } }),
    prisma.document.findMany({
      where: {
        category: categoryMap[activeTab],
        isPublic: true,
      },
      orderBy: [{ sortOrder: "asc" }, { issuedDate: "desc" }],
      select: {
        id: true,
        title: true, title_en: true, title_zh: true, title_ar: true,
        description: true, description_en: true, description_zh: true, description_ar: true,
        documentNumber: true,
        issuedDate: true,
        issuer: true, issuer_en: true, issuer_zh: true, issuer_ar: true,
        driveFileId: true,
        driveViewUrl: true,
        driveDownloadUrl: true,
        fileName: true,
        fileSize: true,
      },
    }),
  ])

  const counts: Record<Tab, number> = {
    "dieu-le": dieuLeCount,
    "quy-che": quyCheCount,
    "giay-phep": giayPhepCount,
  }

  return (
    <div className="min-h-screen bg-brand-50">
      {/* ── Page Banner ──────────────────────────────────────────────────── */}
      <section className="bg-brand-800 py-14 px-4 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl text-brand-100">
          {tl("pageTitle")}
        </h1>
        <p className="mt-2 text-brand-300 text-base max-w-2xl mx-auto">
          {tl("pageSubtitle")}
        </p>
      </section>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-brand-200 sticky top-16 z-10">
        <div className="mx-auto max-w-5xl px-4">
          <nav className="flex gap-1 overflow-x-auto -mb-px" aria-label="Phân loại văn bản">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <Link
                  key={tab.key}
                  href={`/phap-ly?tab=${tab.key}`}
                  className={cn(
                    "flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
                    isActive
                      ? "border-brand-700 text-brand-900"
                      : "border-transparent text-brand-500 hover:text-brand-700 hover:border-brand-200",
                  )}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full text-xs font-bold px-2 py-0.5 min-w-6",
                      isActive
                        ? "bg-brand-700 text-white"
                        : "bg-brand-100 text-brand-600",
                    )}
                  >
                    {counts[tab.key]}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-brand-200 bg-white p-16 text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-brand-700 text-lg font-medium">
              Chưa có văn bản nào trong mục này
            </p>
            <p className="text-brand-500 text-sm mt-2">
              Ban Quản trị Hội sẽ sớm cập nhật.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <article
                key={doc.id}
                className="rounded-xl border border-brand-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center text-2xl">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-brand-900 leading-snug">
                      {l(doc, "title")}
                    </h2>

                    {/* Meta row */}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-500">
                      {doc.documentNumber && (
                        <span>
                          <span className="font-medium text-brand-700">Số: </span>
                          {doc.documentNumber}
                        </span>
                      )}
                      {doc.issuedDate && (
                        <span>
                          <span className="font-medium text-brand-700">Ngày: </span>
                          {fmtDate(doc.issuedDate)}
                        </span>
                      )}
                      {l(doc, "issuer") && (
                        <span>
                          <span className="font-medium text-brand-700">Ban hành: </span>
                          {l(doc, "issuer")}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {l(doc, "description") && (
                      <p className="mt-3 text-sm text-brand-600 leading-relaxed">
                        {l(doc, "description")}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={doc.driveViewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
                      >
                        👁 Xem trực tuyến
                      </a>
                      <a
                        href={doc.driveDownloadUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
                      >
                        ⬇ Tải PDF ({fmtBytes(doc.fileSize)})
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Note */}
        <div className="mt-8 rounded-lg border border-brand-200 bg-brand-50/50 p-4 text-xs text-brand-600 leading-relaxed">
          <p>
            Các văn bản trên được lưu trữ bản PDF gốc trên Google Drive của Hội.
            Nếu bạn cần bản gốc có chữ ký / con dấu để phục vụ giao dịch hành
            chính, vui lòng liên hệ{" "}
            <Link href="/lien-he" className="underline font-medium text-brand-700">
              Văn phòng Hội
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
