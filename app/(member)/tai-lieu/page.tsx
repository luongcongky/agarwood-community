import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getPreviewUrl } from "@/lib/google-drive"

export const revalidate = 3600

const CATEGORY_LABELS: Record<string, string> = {
  CONG_VAN_DEN: "Công văn đến", CONG_VAN_DI: "Công văn đi",
  BIEN_BAN_HOP: "Biên bản họp", QUYET_DINH: "Quyết định", HOP_DONG: "Hợp đồng",
}

const CATEGORY_BADGE: Record<string, string> = {
  CONG_VAN_DEN: "bg-blue-100 text-blue-700", CONG_VAN_DI: "bg-green-100 text-green-700",
  BIEN_BAN_HOP: "bg-purple-100 text-purple-700", QUYET_DINH: "bg-yellow-100 text-yellow-700",
  HOP_DONG: "bg-orange-100 text-orange-700",
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default async function VIPDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; doc?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  const categoryFilter = params.category ?? ""
  const selectedDocId = params.doc ?? ""

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isPublic: true }
  if (categoryFilter) where.category = categoryFilter

  const documents = await prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      category: true,
      documentNumber: true,
      issuedDate: true,
      fileName: true,
      fileSize: true,
      driveFileId: true,
      description: true,
    },
  })

  const selectedDoc = selectedDocId
    ? documents.find((d) => d.id === selectedDocId)
    : null

  const tabs = [
    { key: "", label: "Tất cả" },
    { key: "CONG_VAN_DEN", label: "CV Đến" },
    { key: "CONG_VAN_DI", label: "CV Đi" },
    { key: "BIEN_BAN_HOP", label: "Biên bản" },
    { key: "QUYET_DINH", label: "Quyết định" },
    { key: "HOP_DONG", label: "Hợp đồng" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Tài liệu Hội</h1>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1 w-fit">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/tai-lieu${t.key ? `?category=${t.key}` : ""}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              categoryFilter === t.key ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-100",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Document list */}
        <div className="flex-1 space-y-2">
          {documents.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-200 p-10 text-center">
              <p className="text-brand-500">Chưa có tài liệu công khai nào.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/tai-lieu?${categoryFilter ? `category=${categoryFilter}&` : ""}doc=${doc.id}`}
                className={cn(
                  "flex items-start gap-4 bg-white rounded-xl border p-4 transition-colors",
                  selectedDoc?.id === doc.id ? "border-brand-500 bg-brand-50" : "border-brand-200 hover:bg-brand-50",
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <span className="text-red-600 text-sm font-bold">PDF</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-900 truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("text-sm font-medium px-2 py-0.5 rounded-full", CATEGORY_BADGE[doc.category])}>
                      {CATEGORY_LABELS[doc.category]}
                    </span>
                    {doc.documentNumber && <span className="text-sm text-brand-500">{doc.documentNumber}</span>}
                    <span className="text-sm text-brand-500">{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Preview panel */}
        {selectedDoc && (
          <div className="lg:w-[55%] shrink-0 bg-white rounded-xl border border-brand-200 overflow-hidden">
            <div className="p-4 border-b border-brand-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-brand-900">{selectedDoc.title}</h2>
                {selectedDoc.description && <p className="text-sm text-brand-500 mt-0.5">{selectedDoc.description}</p>}
              </div>
              <a
                href={`/api/documents/${selectedDoc.id}/download`}
                className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800 transition-colors shrink-0"
              >
                Tải xuống
              </a>
            </div>
            <iframe
              src={getPreviewUrl(selectedDoc.driveFileId)}
              className="w-full h-[600px]"
              title={`Preview: ${selectedDoc.title}`}
            />
          </div>
        )}
      </div>
    </div>
  )
}
