import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronDown, Upload } from "lucide-react"
import { DocumentCategory } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UploadForm } from "./UploadForm"
import { DocumentCard } from "./DocumentCard"

export const metadata = {
  title: "Văn bản pháp quy | Admin",
}

export const revalidate = 0

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  DIEU_LE: { label: "Điều lệ Hội", icon: "📜" },
  QUY_CHE: { label: "Quy chế nội bộ", icon: "📋" },
  GIAY_PHEP: { label: "Giấy phép", icon: "🏛️" },
}

export default async function AdminPhapLyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") notFound()

  const params = await searchParams
  const query = (params.q || "").trim()

  const where = {
    category: {
      in: [DocumentCategory.DIEU_LE, DocumentCategory.QUY_CHE, DocumentCategory.GIAY_PHEP],
    },
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { documentNumber: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { issuedDate: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      documentNumber: true,
      issuedDate: true,
      issuer: true,
      sortOrder: true,
      isPublic: true,
      driveFileId: true,
      driveViewUrl: true,
      fileName: true,
      fileSize: true,
      createdAt: true,
    },
  })

  // Group by category
  const grouped: Record<string, typeof documents> = {
    DIEU_LE: [],
    QUY_CHE: [],
    GIAY_PHEP: [],
  }
  for (const doc of documents) {
    grouped[doc.category]?.push(doc)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Văn bản pháp quy</h1>
        <p className="text-sm text-brand-500 mt-1">
          Quản lý Điều lệ, Quy chế và Giấy phép — hiển thị công khai tại{" "}
          <a href="/phap-ly" target="_blank" className="underline font-medium">
            /phap-ly
          </a>
        </p>
      </div>

      {/* ── 1. Upload section — collapsible (default collapsed) ───────────── */}
      <details className="group rounded-xl border border-brand-200 bg-white shadow-sm overflow-hidden">
        <summary className="list-none cursor-pointer px-6 py-4 flex items-center justify-between gap-3 hover:bg-brand-50/40 transition-colors [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-700 text-white shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-900">Upload văn bản mới</h2>
              <p className="text-xs text-brand-500">Thêm Điều lệ / Quy chế / Giấy phép mới vào hệ thống</p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-brand-500 transition-transform group-open:rotate-180 shrink-0" />
        </summary>
        <div className="px-6 pb-6 pt-2 border-t border-brand-100">
          <UploadForm />
        </div>
      </details>

      {/* ── 2. Search section ─────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-brand-200 shadow-sm">
        <form method="GET" action="/admin/phap-ly" className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Tìm theo tên hoặc số hiệu văn bản..."
              className="w-full rounded-lg border border-brand-200 bg-brand-50/30 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
            {query && (
              <Link
                href="/admin/phap-ly"
                className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-1"
              >
                ✕
              </Link>
            )}
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600"
            >
              🔍
            </button>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-800 text-white rounded-lg text-sm font-medium hover:bg-brand-900 transition-colors"
          >
            Tìm
          </button>
        </form>
        {query && (
          <p className="mt-2 text-xs text-brand-500">
            {documents.length} kết quả cho &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {/* ── 3. Document sections (collapsible) ────────────────────────────── */}
      {query && documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-200 p-16 text-center">
          <div className="text-brand-200 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-bold text-brand-900">Không tìm thấy kết quả</h3>
          <p className="text-brand-500 mt-1">
            Không có văn bản nào khớp với từ khóa &quot;{query}&quot;
          </p>
          <Link href="/admin/phap-ly" className="mt-4 inline-block text-brand-700 underline text-sm">
            Xem tất cả văn bản
          </Link>
        </div>
      ) : (
        (["DIEU_LE", "QUY_CHE", "GIAY_PHEP"] as const).map((cat) => {
          const { label, icon } = CATEGORY_LABELS[cat]
          const docs = grouped[cat] || []
          if (query && docs.length === 0) return null

          return (
            <details
              key={cat}
              open
              className="group rounded-xl border bg-white shadow-sm overflow-hidden"
            >
              <summary className="list-none cursor-pointer px-6 py-4 flex items-center justify-between gap-3 hover:bg-brand-50/40 transition-colors [&::-webkit-details-marker]:hidden">
                <h2 className="text-base font-bold text-brand-900 flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  {label}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100 uppercase tracking-tighter">
                    {docs.length} văn bản
                  </span>
                  <ChevronDown className="w-5 h-5 text-brand-500 transition-transform group-open:rotate-180 shrink-0" />
                </div>
              </summary>
              <div className="px-6 pb-6 pt-2 border-t border-brand-100">
                {docs.length === 0 ? (
                  <p className="text-sm text-brand-400 italic">Chưa có văn bản nào.</p>
                ) : (
                  <div className="space-y-3">
                    {docs.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={{
                          id: doc.id,
                          title: doc.title,
                          description: doc.description,
                          category: doc.category,
                          documentNumber: doc.documentNumber,
                          issuedDate: doc.issuedDate?.toISOString() ?? null,
                          issuer: doc.issuer,
                          sortOrder: doc.sortOrder,
                          isPublic: doc.isPublic,
                          driveFileId: doc.driveFileId,
                          driveViewUrl: doc.driveViewUrl,
                          fileName: doc.fileName,
                          fileSize: doc.fileSize,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </details>
          )
        })
      )}
    </div>
  )
}
