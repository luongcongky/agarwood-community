import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { notFound } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getPreviewUrl } from "@/lib/google-drive"
import { DocumentActions } from "./DocumentActions"

export const revalidate = 0

const CATEGORY_LABELS: Record<string, string> = {
  CONG_VAN_DEN: "Công văn đến", CONG_VAN_DI: "Công văn đi",
  BIEN_BAN_HOP: "Biên bản họp", QUYET_DINH: "Quyết định", HOP_DONG: "Hợp đồng",
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || !isAdmin(session.user.role)) notFound()

  const { id } = await params
  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) notFound()

  const previewUrl = getPreviewUrl(doc.driveFileId)

  return (
    <div className="space-y-6">
      <Link href="/admin/tai-lieu" className="text-sm text-brand-600 hover:text-brand-800">
        &larr; Quay lại danh sách
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-brand-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-brand-900">{doc.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={cn("text-sm font-medium px-2 py-1 rounded-full",
                doc.category === "CONG_VAN_DEN" ? "bg-blue-100 text-blue-700" :
                doc.category === "CONG_VAN_DI" ? "bg-green-100 text-green-700" :
                doc.category === "BIEN_BAN_HOP" ? "bg-purple-100 text-purple-700" :
                doc.category === "QUYET_DINH" ? "bg-yellow-100 text-yellow-700" :
                "bg-orange-100 text-orange-700"
              )}>
                {CATEGORY_LABELS[doc.category]}
              </span>
              <span className={cn("text-sm font-medium px-2 py-1 rounded-full", doc.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                {doc.isPublic ? "Công khai" : "Nội bộ"}
              </span>
            </div>
          </div>
          <DocumentActions documentId={doc.id} isPublic={doc.isPublic} />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-sm">
          <div>
            <p className="text-brand-500">Số hiệu</p>
            <p className="font-medium text-brand-900">{doc.documentNumber ?? "—"}</p>
          </div>
          <div>
            <p className="text-brand-500">Ngày ban hành</p>
            <p className="font-medium text-brand-900">{doc.issuedDate ? new Date(doc.issuedDate).toLocaleDateString("vi-VN") : "—"}</p>
          </div>
          <div>
            <p className="text-brand-500">Kích thước</p>
            <p className="font-medium text-brand-900">{formatFileSize(doc.fileSize)} ({doc.mimeType.split("/")[1]?.toUpperCase()})</p>
          </div>
          <div>
            <p className="text-brand-500">Lượt tải</p>
            <p className="font-medium text-brand-900">{doc.downloadCount}</p>
          </div>
        </div>

        {doc.description && (
          <div className="mt-4 pt-4 border-t border-brand-200">
            <p className="text-sm text-brand-700">{doc.description}</p>
          </div>
        )}
      </div>

      {/* PDF Preview */}
      <div className="bg-white rounded-xl border border-brand-200 overflow-hidden">
        <div className="p-4 border-b border-brand-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-900">Xem trước tài liệu</h2>
          <a
            href={`/api/documents/${doc.id}/download`}
            className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 transition-colors"
          >
            Tải xuống
          </a>
        </div>
        <iframe
          src={previewUrl}
          className="w-full h-[600px] sm:h-[800px]"
          title={`Preview: ${doc.title}`}
        />
      </div>
    </div>
  )
}
