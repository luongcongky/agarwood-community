import { prisma } from "@/lib/prisma"
import { ReportActions } from "./ReportActions"
import { cn } from "@/lib/utils"

export const revalidate = 0

type ReportItem = {
  id: string
  reason: string
  description: string | null
  createdAt: Date
  postId: string
  post: {
    id: string
    title: string | null
    content: string
    status: string
    reportCount: number
  }
  reporter: {
    name: string | null
    email: string | null
  }
}

export default async function AdminReportsPage() {
  const reports = (await prisma.report.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 50,
    include: {
      post: {
        select: {
          id: true,
          title: true,
          content: true,
          status: true,
          authorId: true,
          reportCount: true,
        },
      },
      reporter: { select: { name: true, email: true } },
    },
  })) as ReportItem[]

  function getContentPreview(content: string, lines = 3): string {
    return content.split("\n").slice(0, lines).join("\n")
  }

  const REASON_LABELS: Record<string, string> = {
    SPAM: "Spam",
    FAKE_INFO: "Thông tin giả",
    INAPPROPRIATE: "Nội dung không phù hợp",
    OTHER: "Lý do khác",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">
          Báo cáo bài viết
        </h1>
        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
          {reports.length} chờ xử lý
        </span>
      </div>

      {reports.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground shadow-sm">
          Không có báo cáo nào đang chờ xử lý
        </div>
      )}

      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-xl border bg-white p-5 shadow-sm space-y-4"
          >
            {/* Post preview */}
            <div className="rounded-lg bg-brand-50 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                {report.post.title && (
                  <p className="font-semibold text-brand-900 text-sm">
                    {report.post.title}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      report.post.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : report.post.status === "LOCKED"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {report.post.status === "PUBLISHED"
                      ? "Đã đăng"
                      : report.post.status === "LOCKED"
                      ? "Đã khoá"
                      : "Đã xoá"}
                  </span>
                  {report.post.reportCount > 1 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      {report.post.reportCount} báo cáo
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-brand-800 whitespace-pre-line line-clamp-3">
                {getContentPreview(report.post.content)}
              </p>
            </div>

            {/* Report details */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Lý do: </span>
                <span className="font-medium text-brand-900">
                  {REASON_LABELS[report.reason] ?? report.reason}
                </span>
              </div>
              {report.description && (
                <div className="w-full">
                  <span className="text-xs text-muted-foreground">
                    Mô tả:{" "}
                  </span>
                  <span className="text-brand-800">{report.description}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground">
                  Người báo cáo:{" "}
                </span>
                <span className="font-medium">{report.reporter.name}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({report.reporter.email})
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Ngày: </span>
                <span>
                  {new Date(report.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-3">
              <ReportActions
                reportId={report.id}
                postId={report.postId}
                postStatus={report.post.status}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
