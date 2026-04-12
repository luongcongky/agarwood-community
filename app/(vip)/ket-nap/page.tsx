import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ApplicationForm } from "./ApplicationForm"

export const metadata = {
  title: "Kết nạp Hội viên chính thức | Hội Trầm Hương Việt Nam",
}

export const revalidate = 0

function fmtDate(d: Date | null): string {
  if (!d) return "—"
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: "Chờ Ban Thường vụ xét duyệt", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  APPROVED: { label: "Đã được công nhận",           cls: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "Bị từ chối",                  cls: "bg-red-100 text-red-800 border-red-200" },
}

const CATEGORY_LABEL: Record<string, string> = {
  OFFICIAL:  "Chính thức",
  AFFILIATE: "Liên kết",
  HONORARY:  "Danh dự",
}

export default async function KetNapPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [user, applications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        accountType: true,
        memberCategory: true,
        company: {
          select: {
            representativeName: true,
            representativePosition: true,
          },
        },
      },
    }),
    prisma.membershipApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { submittedAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        requestedCategory: true,
        reason: true,
        submittedAt: true,
        reviewedAt: true,
        rejectReason: true,
      },
    }),
  ])

  if (!user) redirect("/login")

  const pendingApp = applications.find((a) => a.status === "PENDING")
  const latestApproved = applications.find((a) => a.status === "APPROVED")

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Kết nạp Hội viên chính thức</h1>
        <p className="mt-2 text-sm text-brand-500">
          Theo{" "}
          <Link href="/dieu-le" className="underline font-medium text-brand-700">
            Điều lệ Hội (Điều 11)
          </Link>
          , Ban Thường vụ Hội xét duyệt đơn kết nạp tại các cuộc họp hàng quý;
          Chủ tịch Hội quyết định công nhận Hội viên trong vòng 30 ngày.
        </p>
      </div>

      {/* Current status */}
      <div className="rounded-xl border border-brand-200 bg-white p-6 space-y-3">
        <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide">
          Hạng Hội viên hiện tại
        </h2>
        <p className="text-lg font-bold text-brand-900">
          {CATEGORY_LABEL[user.memberCategory] ?? "Chưa xác định"}
        </p>
        {latestApproved && (
          <p className="text-xs text-brand-500">
            Công nhận ngày {fmtDate(latestApproved.reviewedAt)}
          </p>
        )}
      </div>

      {/* Pending application */}
      {pendingApp && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏳</span>
            <h2 className="text-base font-bold text-amber-900">
              Đơn của bạn đang chờ xét duyệt
            </h2>
          </div>
          <div className="text-sm text-amber-900 space-y-1">
            <p>
              <strong>Nộp lúc:</strong> {fmtDate(pendingApp.submittedAt)}
            </p>
            <p>
              <strong>Xin kết nạp hạng:</strong>{" "}
              {CATEGORY_LABEL[pendingApp.requestedCategory]}
            </p>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Ban Thường vụ sẽ xem xét đơn của bạn trong cuộc họp quý sắp tới. Bạn
            sẽ nhận email thông báo kết quả trong vòng 30 ngày.
          </p>
        </div>
      )}

      {/* Submit form (only if no pending) */}
      {!pendingApp && (
        <ApplicationForm
          userName={user.name}
          accountType={user.accountType}
          currentCategory={user.memberCategory}
          defaultRepresentativeName={user.company?.representativeName ?? ""}
          defaultRepresentativePosition={user.company?.representativePosition ?? ""}
        />
      )}

      {/* History */}
      {applications.length > 0 && (
        <div className="rounded-xl border border-brand-200 bg-white p-6 space-y-3">
          <h2 className="text-sm font-semibold text-brand-500 uppercase tracking-wide">
            Lịch sử đơn kết nạp
          </h2>
          <div className="divide-y divide-brand-100">
            {applications.map((app) => {
              const badge = STATUS_BADGE[app.status] ?? { label: app.status, cls: "bg-gray-100 text-gray-600" }
              return (
                <div key={app.id} className="py-3 space-y-1 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-brand-500">{fmtDate(app.submittedAt)}</span>
                  </div>
                  <p className="text-xs text-brand-600">
                    Hạng xin: {CATEGORY_LABEL[app.requestedCategory]}
                  </p>
                  {app.status === "REJECTED" && app.rejectReason && (
                    <p className="text-xs text-red-700 italic">
                      Lý do từ chối: {app.rejectReason}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
